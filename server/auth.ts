import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "leaf-doctor-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if input is an email
        const isEmail = username.includes('@');
        
        let user;
        if (isEmail) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  const registerSchema = insertUserSchema.extend({
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters")
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.format() 
        });
      }
      
      const { username, password, email } = validation.data;
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
      });

      try {
        // Track registration activity
        await storage.logUserActivity(user.id, 'USER_REGISTERED', {
          username,
          email
        });
        
        // Initialize usage metrics for the user
        const today = new Date();
        const metrics = await storage.getOrCreateUsageMetricsForDate(user.id, today);
        await storage.updateUsageMetrics(metrics.id, {
          loginCount: 1  // First login happens at registration
        });
      } catch (error) {
        console.error('Error tracking registration activity:', error);
        // Continue even if analytics fails
      }

      // Grant 30-day premium access on sign-up
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 30);
      const updatedUser = await storage.updateUserPremiumStatus(
        user.id,
        true,
        premiumUntil,
      );
      const finalUser = updatedUser ?? user;

      // Remove password from response
      const { password: _, ...safeUser } = finalUser;

      req.login(finalUser, (err) => {
        if (err) return next(err);
        res.status(201).json(safeUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        try {
          // Track login activity
          await storage.logUserActivity(user.id, 'USER_LOGIN');
          
          // Update login count in usage metrics
          const today = new Date();
          const metrics = await storage.getOrCreateUsageMetricsForDate(user.id, today);
          await storage.updateUsageMetrics(metrics.id, {
            loginCount: metrics.loginCount + 1
          });
          
          // If the user's premium period has expired, revoke premium status
          let effectiveUser = user;
          if (
            user.premiumUntil &&
            new Date(user.premiumUntil as unknown as string) < new Date()
          ) {
            effectiveUser =
              (await storage.updateUserPremiumStatus(user.id, false, null)) ||
              user;
          }

          // Remove password from response
          const { password: _, ...safeUser } = effectiveUser;
          res.status(200).json(safeUser);
        } catch (error) {
          console.error('Error tracking login activity:', error);
          // Still return user even if analytics fails
          const { password: _, ...safeUser } = user;
          res.status(200).json(safeUser);
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (req.isAuthenticated()) {
      // Capture user ID before logout
      const userId = req.user.id;
      
      req.logout(async (err) => {
        if (err) return next(err);
        
        try {
          // Track logout activity
          await storage.logUserActivity(userId, 'USER_LOGOUT');
        } catch (error) {
          console.error('Error tracking logout activity:', error);
        }
        
        res.sendStatus(200);
      });
    } else {
      // Already logged out
      res.sendStatus(200);
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    let user = req.user as Express.User;

    // If premium has expired, revoke it and update session
    if (user.premiumUntil && new Date(user.premiumUntil as any) < new Date()) {
      user = (await storage.updateUserPremiumStatus(user.id, false, null)) || user;
      req.login(user, () => {});
    }

    // Remove password from response
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });
}
