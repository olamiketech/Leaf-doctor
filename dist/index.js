var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  diagnoses: () => diagnoses,
  diagnosisStats: () => diagnosisStats,
  diseaseInfo: () => diseaseInfo,
  insertDiagnosisSchema: () => insertDiagnosisSchema,
  insertDiagnosisStatsSchema: () => insertDiagnosisStatsSchema,
  insertNewsletterSubscriberSchema: () => insertNewsletterSubscriberSchema,
  insertUsageMetricsSchema: () => insertUsageMetricsSchema,
  insertUserActivitySchema: () => insertUserActivitySchema,
  insertUserSchema: () => insertUserSchema,
  newsletterSubscribers: () => newsletterSubscribers,
  usageMetrics: () => usageMetrics,
  userActivity: () => userActivity,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  premiumUntil: timestamp("premium_until"),
  trialStartedAt: timestamp("trial_started_at"),
  diagnosisCount: integer("diagnosis_count").default(0).notNull(),
  lastDiagnosisDate: timestamp("last_diagnosis_date"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var diagnoses = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  disease: text("disease").notNull(),
  confidence: real("confidence").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  treatments: jsonb("treatments").notNull(),
  metadata: jsonb("metadata"),
  // For additional data like plant type
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  // 'login', 'diagnosis', 'upgrade', etc.
  details: jsonb("details"),
  // Additional context about the activity
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usageMetrics = pgTable("usage_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  diagnosisCount: integer("diagnosis_count").default(0).notNull(),
  loginCount: integer("login_count").default(0).notNull(),
  featureUsage: jsonb("feature_usage"),
  // Track which features were used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var diagnosisStats = pgTable("diagnosis_stats", {
  id: serial("id").primaryKey(),
  diseaseType: varchar("disease_type", { length: 100 }).notNull(),
  count: integer("count").default(0).notNull(),
  avgConfidence: real("avg_confidence").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});
var insertDiagnosisSchema = createInsertSchema(diagnoses).omit({
  id: true,
  createdAt: true
});
var insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true
});
var insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true
});
var insertUsageMetricsSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertDiagnosisStatsSchema = createInsertSchema(diagnosisStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var diseaseInfo = [
  {
    name: "Tomato Late Blight",
    description: "A destructive disease caused by the fungus Phytophthora infestans. It first appears as water-soaked spots that rapidly enlarge to form brown lesions.",
    treatments: [
      "Remove and destroy all infected plant parts",
      "Apply copper-based fungicide or chlorothalonil according to label directions",
      "Water at the base of plants to avoid wetting foliage",
      "Ensure good air circulation by proper spacing between plants"
    ],
    severity: "High"
  },
  {
    name: "Tomato Early Blight",
    description: "Caused by the fungus Alternaria solani, characterized by dark spots with concentric rings forming a 'target' pattern.",
    treatments: [
      "Remove infected leaves immediately",
      "Apply fungicide with chlorothalonil or mancozeb",
      "Mulch around the base of plants",
      "Rotate crops - don't plant tomatoes in the same spot for 3-4 years"
    ],
    severity: "Medium"
  },
  {
    name: "Tomato Bacterial Spot",
    description: "Caused by Xanthomonas bacteria, presents as small, water-soaked spots that eventually turn dark and appear scabby.",
    treatments: [
      "Remove infected plants and debris",
      "Apply copper-based bactericide",
      "Avoid overhead irrigation",
      "Rotate crops"
    ],
    severity: "Medium"
  },
  {
    name: "Tomato Leaf Mold",
    description: "Caused by the fungus Passalora fulva, shows as yellow spots on the upper side of leaves with olive-green mold on the underside.",
    treatments: [
      "Improve air circulation around plants",
      "Apply fungicide containing chlorothalonil or mancozeb",
      "Avoid overhead watering",
      "Remove and destroy infected leaves"
    ],
    severity: "Medium"
  },
  {
    name: "Tomato Septoria Leaf Spot",
    description: "Caused by Septoria lycopersici fungus, appears as numerous small, circular spots with dark borders and light centers.",
    treatments: [
      "Remove infected leaves",
      "Apply fungicide with chlorothalonil or copper compounds",
      "Mulch around plants to prevent spores splashing",
      "Improve air circulation"
    ],
    severity: "Medium"
  },
  {
    name: "Tomato Spider Mites",
    description: "Tiny arachnids that cause stippling on leaves, leading to yellowing, bronzing, and leaf drop.",
    treatments: [
      "Spray plants with water to knock off mites",
      "Apply insecticidal soap or neem oil",
      "Introduce predatory mites",
      "Keep plants well-watered to prevent stress"
    ],
    severity: "Medium"
  },
  {
    name: "Tomato Target Spot",
    description: "Caused by the fungus Corynespora cassiicola, creates concentric ring patterns on leaves, stems, and fruit.",
    treatments: [
      "Apply fungicide with chlorothalonil or mancozeb",
      "Prune to improve air circulation",
      "Remove infected plant debris",
      "Avoid overhead irrigation"
    ],
    severity: "Medium"
  },
  {
    name: "Tomato Yellow Leaf Curl Virus",
    description: "A viral disease spread by whiteflies that causes leaves to curl upward, become yellow, and stunts plant growth.",
    treatments: [
      "Remove and destroy infected plants",
      "Control whitefly populations with insecticidal soap",
      "Use reflective mulch to repel whiteflies",
      "Plant resistant varieties"
    ],
    severity: "High"
  },
  {
    name: "Tomato Mosaic Virus",
    description: "Viral infection causing mottled light and dark green patterns on leaves, stunted growth, and malformed fruit.",
    treatments: [
      "Remove and destroy infected plants",
      "Wash hands and tools after handling infected plants",
      "Control insect vectors",
      "Plant resistant varieties in future seasons"
    ],
    severity: "High"
  },
  {
    name: "Pepper Bacterial Spot",
    description: "Xanthomonas campestris bacterial infection causing water-soaked spots on leaves that eventually turn dark and dry up.",
    treatments: [
      "Apply copper-based bactericide",
      "Remove infected plant debris",
      "Avoid working with plants when wet",
      "Rotate crops"
    ],
    severity: "Medium"
  },
  {
    name: "Potato Early Blight",
    description: "Fungal disease caused by Alternaria solani, creates dark brown spots with concentric rings on lower, older leaves first.",
    treatments: [
      "Apply fungicide with chlorothalonil or copper",
      "Remove lower infected leaves",
      "Ensure adequate spacing between plants",
      "Practice crop rotation"
    ],
    severity: "Medium"
  },
  {
    name: "Potato Late Blight",
    description: "Devastating disease caused by Phytophthora infestans, presents as water-soaked spots turning brown or black with white mold on undersides.",
    treatments: [
      "Apply preventative fungicide before symptoms appear",
      "Remove infected plants immediately",
      "Destroy all tubers from infected plants",
      "Plant resistant varieties"
    ],
    severity: "High"
  },
  {
    name: "Healthy",
    description: "No signs of disease or pest damage. The plant appears healthy with normal leaf coloration and structure.",
    treatments: [
      "Continue regular watering and fertilization",
      "Monitor for any changes in appearance",
      "Maintain good air circulation",
      "Apply preventative treatments during high-risk periods"
    ],
    severity: "Healthy"
  }
];

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";

// server/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var sql = neon(process.env.DATABASE_URL);
var db = drizzle(sql, { schema: schema_exports });

// server/storage.ts
import { eq, desc, gte, lte } from "drizzle-orm";
import connectPg from "connect-pg-simple";
var MemoryStore = createMemoryStore(session);
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
      // prune expired entries every 24h
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserPremiumStatus(userId, isPremium, premiumUntil) {
    const [updatedUser] = await db.update(users).set({
      isPremium,
      premiumUntil: premiumUntil || null
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateStripeCustomerId(userId, customerId) {
    const [updatedUser] = await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateStripeSubscriptionId(userId, subscriptionId) {
    const [updatedUser] = await db.update(users).set({ stripeSubscriptionId: subscriptionId }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateUserStripeInfo(userId, info) {
    const [updatedUser] = await db.update(users).set({
      stripeCustomerId: info.customerId,
      stripeSubscriptionId: info.subscriptionId
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  // Start a 30-day trial for a user
  async startTrial(userId) {
    const existingUser = await this.getUser(userId);
    if (!existingUser) return void 0;
    if (existingUser.isPremium || existingUser.trialStartedAt) {
      return existingUser;
    }
    const trialStartedAt = /* @__PURE__ */ new Date();
    const [updatedUser] = await db.update(users).set({ trialStartedAt }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  // Check if a user is in an active trial period
  async checkTrialStatus(userId) {
    const user = await this.getUser(userId);
    const defaultResult = { isInTrial: false, trialEnded: false, daysLeft: null };
    if (!user) return defaultResult;
    if (user.isPremium) return defaultResult;
    if (!user.trialStartedAt) return defaultResult;
    const trialStartDate = new Date(user.trialStartedAt);
    const currentDate = /* @__PURE__ */ new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    const daysLeft = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1e3 * 60 * 60 * 24));
    const isInTrial = currentDate < trialEndDate;
    const trialEnded = !!user.trialStartedAt && !isInTrial;
    return {
      isInTrial,
      trialEnded,
      daysLeft: isInTrial ? daysLeft : null
    };
  }
  // Track diagnosis count and check if user can make a diagnosis
  async incrementDiagnosisCount(userId) {
    const user = await this.getUser(userId);
    if (!user) {
      return { canDiagnose: false, user: void 0 };
    }
    if (user.isPremium) {
      const [updatedUser] = await db.update(users).set({
        diagnosisCount: user.diagnosisCount + 1,
        lastDiagnosisDate: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId)).returning();
      return { canDiagnose: true, user: updatedUser };
    }
    const { isInTrial } = await this.checkTrialStatus(userId);
    const canDiagnose = isInTrial;
    const now = /* @__PURE__ */ new Date();
    if (canDiagnose) {
      const [updatedUser] = await db.update(users).set({
        diagnosisCount: user.diagnosisCount + 1,
        lastDiagnosisDate: now
      }).where(eq(users.id, userId)).returning();
      return { canDiagnose: true, user: updatedUser };
    }
    return { canDiagnose: false, user };
  }
  // Reset the user's monthly diagnosis count
  async resetMonthlyDiagnosisCount(userId) {
    const [updatedUser] = await db.update(users).set({ diagnosisCount: 0 }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async createDiagnosis(insertDiagnosis) {
    const [diagnosis] = await db.insert(diagnoses).values(insertDiagnosis).returning();
    return diagnosis;
  }
  async getDiagnosis(id) {
    const [diagnosis] = await db.select().from(diagnoses).where(eq(diagnoses.id, id));
    return diagnosis;
  }
  async getDiagnosesByUserId(userId) {
    return await db.select().from(diagnoses).where(eq(diagnoses.userId, userId)).orderBy(desc(diagnoses.id));
  }
  async getRecentDiagnosesByUserId(userId, limit) {
    return await db.select().from(diagnoses).where(eq(diagnoses.userId, userId)).orderBy(desc(diagnoses.id)).limit(limit);
  }
  async subscribeToNewsletter(email) {
    const [subscriber] = await db.insert(newsletterSubscribers).values({ email }).returning();
    return subscriber;
  }
  async isEmailSubscribed(email) {
    const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
    return !!subscriber;
  }
  // Analytics methods
  async logUserActivity(userId, activityType, details) {
    const [activity] = await db.insert(userActivity).values({
      userId,
      activityType,
      details: details ? details : null
    }).returning();
    return activity;
  }
  async getUserActivities(userId, limit) {
    let result = await db.select().from(userActivity).where(eq(userActivity.userId, userId)).orderBy(desc(userActivity.createdAt));
    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }
  async getOrCreateUsageMetricsForDate(userId, date2) {
    const formattedDate = new Date(date2);
    formattedDate.setHours(0, 0, 0, 0);
    const dateString = formattedDate.toISOString().split("T")[0];
    const existingMetrics = await db.select().from(usageMetrics).where(eq(usageMetrics.userId, userId)).where(eq(usageMetrics.date, dateString));
    if (existingMetrics.length > 0) {
      return existingMetrics[0];
    }
    const [newMetrics] = await db.insert(usageMetrics).values({
      userId,
      date: dateString,
      diagnosisCount: 0,
      loginCount: 0,
      featureUsage: {}
    }).returning();
    return newMetrics;
  }
  async updateUsageMetrics(id, updates) {
    const [updatedMetrics] = await db.update(usageMetrics).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(usageMetrics.id, id)).returning();
    return updatedMetrics;
  }
  async getUsageMetricsForUser(userId, startDate, endDate) {
    let queryBase = db.select().from(usageMetrics).where(eq(usageMetrics.userId, userId));
    if (startDate) {
      const startDateStr = startDate.toISOString().split("T")[0];
      queryBase = queryBase.where(gte(usageMetrics.date, startDateStr));
    }
    if (endDate) {
      const endDateStr = endDate.toISOString().split("T")[0];
      queryBase = queryBase.where(lte(usageMetrics.date, endDateStr));
    }
    const result = await queryBase.orderBy(desc(usageMetrics.date));
    return result;
  }
  async getOrUpdateDiseaseStats(diseaseType, confidence) {
    const [existingStats] = await db.select().from(diagnosisStats).where(eq(diagnosisStats.diseaseType, diseaseType));
    if (existingStats) {
      const newCount = existingStats.count + 1;
      const newAvgConfidence = (existingStats.avgConfidence * existingStats.count + confidence) / newCount;
      const [updatedStats] = await db.update(diagnosisStats).set({
        count: newCount,
        avgConfidence: newAvgConfidence,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(diagnosisStats.id, existingStats.id)).returning();
      return updatedStats;
    }
    const [newStats] = await db.insert(diagnosisStats).values({
      diseaseType,
      count: 1,
      avgConfidence: confidence
    }).returning();
    return newStats;
  }
  async getTopDiseases(limit = 5) {
    return await db.select().from(diagnosisStats).orderBy(desc(diagnosisStats.count)).limit(limit);
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "leaf-doctor-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const isEmail = username.includes("@");
        let user;
        if (isEmail) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
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
  app2.post("/api/register", async (req, res, next) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.format()
        });
      }
      const { username, password, email } = validation.data;
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
        password: await hashPassword(password)
      });
      try {
        await storage.logUserActivity(user.id, "USER_REGISTERED", {
          username,
          email
        });
        const today = /* @__PURE__ */ new Date();
        const metrics = await storage.getOrCreateUsageMetricsForDate(user.id, today);
        await storage.updateUsageMetrics(metrics.id, {
          loginCount: 1
          // First login happens at registration
        });
      } catch (error) {
        console.error("Error tracking registration activity:", error);
      }
      const premiumUntil = /* @__PURE__ */ new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 30);
      const updatedUser = await storage.updateUserPremiumStatus(
        user.id,
        true,
        premiumUntil
      );
      const finalUser = updatedUser ?? user;
      const { password: _, ...safeUser } = finalUser;
      req.login(finalUser, (err) => {
        if (err) return next(err);
        res.status(201).json(safeUser);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, async (err2) => {
        if (err2) return next(err2);
        try {
          await storage.logUserActivity(user.id, "USER_LOGIN");
          const today = /* @__PURE__ */ new Date();
          const metrics = await storage.getOrCreateUsageMetricsForDate(user.id, today);
          await storage.updateUsageMetrics(metrics.id, {
            loginCount: metrics.loginCount + 1
          });
          let effectiveUser = user;
          if (user.premiumUntil && new Date(user.premiumUntil) < /* @__PURE__ */ new Date()) {
            effectiveUser = await storage.updateUserPremiumStatus(user.id, false, null) || user;
          }
          const { password: _, ...safeUser } = effectiveUser;
          res.status(200).json(safeUser);
        } catch (error) {
          console.error("Error tracking login activity:", error);
          const { password: _, ...safeUser } = user;
          res.status(200).json(safeUser);
        }
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    if (req.isAuthenticated()) {
      const userId = req.user.id;
      req.logout(async (err) => {
        if (err) return next(err);
        try {
          await storage.logUserActivity(userId, "USER_LOGOUT");
        } catch (error) {
          console.error("Error tracking logout activity:", error);
        }
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });
  app2.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    let user = req.user;
    if (user.premiumUntil && new Date(user.premiumUntil) < /* @__PURE__ */ new Date()) {
      user = await storage.updateUserPremiumStatus(user.id, false, null) || user;
      req.login(user, () => {
      });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });
}

// server/plantDiseaseModel.ts
import * as fs from "fs/promises";

// server/openai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
async function analyzeWithVoiceAssistant(question, diseaseContext) {
  try {
    let systemContent = "You are an expert plant pathologist and agricultural advisor specialized in diagnosing and treating plant diseases. ";
    systemContent += "Provide detailed, accurate, and helpful advice to gardeners and farmers about plant diseases, treatments, and best practices. ";
    systemContent += "Keep your responses clear, practical, and actionable. ";
    if (diseaseContext) {
      const diseaseData = diseaseInfo.find((d) => d.name === diseaseContext);
      if (diseaseData) {
        systemContent += `The user is asking about ${diseaseData.name}, which has the following characteristics: `;
        systemContent += `Description: ${diseaseData.description} `;
        systemContent += `Severity: ${diseaseData.severity} `;
        systemContent += `Common treatments include: ${diseaseData.treatments.join(", ")}. `;
      }
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemContent
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error with OpenAI voice assistant:", error);
    throw new Error("Failed to generate voice assistant response");
  }
}
async function analyzePlantImageWithAI(base64Image) {
  try {
    const plantDetectionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an advanced agricultural image analysis system specialized in detecting all types of plants, leaves, vegetables, and disease pigmentation patterns. You can identify a wide variety of plants including but not limited to tomato, potato, pepper, corn, wheat, rice, soybean, cucumber, lettuce, spinach, carrot, onion, garlic, broccoli, cauliflower, cabbage, and fruits. You must be accurate but also inclusive of all plant types. You should still classify an image as containing a plant (is_plant=true) even if it shows plant material being held by hands or alongside other objects like tables, soil, pots, or garden tools. Only set is_plant=false if there is absolutely no plant material visible. You will respond in a structured JSON format with fields: 'is_plant' (boolean), 'contains_non_plant_objects' (boolean), 'plant_type' (string - identify the type of plant if possible), and 'explanation' (string)."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and determine if it contains any type of plant matter - including any leaf, vegetable, fruit, plant stem, flower, or plant with disease pigmentation. Be inclusive - if ANY part of the image shows plant material, even if it's partial or being held by hands or alongside other objects like tables, soil, pots, or garden tools, mark is_plant=true. Ignore the presence of hands or other objects and focus only on whether plant material is visible. If you can identify the type of plant, include that in plant_type. Respond with structured JSON: {"is_plant": boolean, "contains_non_plant_objects": boolean, "plant_type": "specific plant type or 'unknown' if uncertain", "explanation": "your detailed reasoning here"}.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.2,
      // Lower temperature for more consistent, deterministic output
      response_format: { type: "json_object" }
    });
    let plantDetectionResult;
    try {
      const content = plantDetectionResponse.choices[0].message.content || '{"is_plant": false, "contains_non_plant_objects": true, "explanation": "Failed to analyze image"}';
      plantDetectionResult = JSON.parse(content);
      console.log("Plant detection result:", JSON.stringify(plantDetectionResult, null, 2));
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      plantDetectionResult = {
        is_plant: false,
        contains_non_plant_objects: true,
        explanation: "Error parsing detection result"
      };
    }
    if (!plantDetectionResult.is_plant) {
      const explanation = plantDetectionResult.explanation || "The image does not appear to contain plant leaves";
      let prefix = "NOT_A_PLANT: ";
      return `${prefix}${explanation}`;
    }
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert plant pathologist with comprehensive knowledge of diseases affecting all types of plants, vegetables, and crops. Your task is to analyze the plant image and identify any disease present. First, correctly identify the plant type from a broad range of possibilities including vegetables (tomato, potato, pepper, cucumber, lettuce, spinach, carrot, onion, garlic, broccoli, cauliflower, cabbage, etc.), cereal crops (wheat, rice, corn, etc.), legumes (soybean, beans, peas, etc.), fruits, ornamental plants, and trees. Then analyze for diseases and nutritional deficiencies.\n\nFocus exclusively on the plant material in the image, even if it's being held by hands or displayed alongside other objects. Ignore the presence of hands, tables, or other objects in your analysis - evaluate only the plant's health and characteristics.\n\nFor tomato, potato, and pepper plants, focus on: Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus. For other plants, analyze for common diseases like powdery mildew, downy mildew, rust, leaf spot, anthracnose, bacterial wilt, and nutritional deficiencies (nitrogen, phosphorus, potassium, etc.). If the plant appears healthy, explicitly state that it's healthy. For all analyses, describe the visual symptoms that led to your diagnosis and your confidence level."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this plant image in detail. Focus only on the plant material, even if it's being held by hands or alongside other objects. First, identify what type of plant it is from the wide range of possibilities. Then determine if any disease or nutritional deficiency is present, providing a detailed description of the visual symptoms you observe. If you see signs of disease, name the specific disease if possible. If the plant appears healthy, clearly state that it's healthy. Be precise in your identification of both the plant type and any disease. If you cannot make a confident identification for either the plant type or disease, state your level of confidence and what the most likely options are rather than guessing. Do not mention or focus on hands, tables, or any other non-plant objects in your analysis."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1e3,
      temperature: 0.3
      // Lower temperature for more precise analysis
    });
    return visionResponse.choices[0].message.content || "I couldn't analyze the image properly.";
  } catch (error) {
    console.error("Error with OpenAI image analysis:", error);
    throw new Error("Failed to analyze image with AI");
  }
}

// server/plantDiseaseModel.ts
var CLASS_MAPPING = {
  // Original supported plants
  "Pepper Bacterial Spot": "Pepper Bacterial Spot",
  "Healthy Pepper": "Healthy",
  "Potato Early Blight": "Potato Early Blight",
  "Potato Late Blight": "Potato Late Blight",
  "Healthy Potato": "Healthy",
  "Tomato Bacterial Spot": "Tomato Bacterial Spot",
  "Tomato Early Blight": "Tomato Early Blight",
  "Tomato Late Blight": "Tomato Late Blight",
  "Tomato Leaf Mold": "Tomato Leaf Mold",
  "Tomato Septoria Leaf Spot": "Tomato Septoria Leaf Spot",
  "Tomato Spider Mites": "Tomato Spider Mites",
  "Tomato Target Spot": "Tomato Target Spot",
  "Tomato Yellow Leaf Curl Virus": "Tomato Yellow Leaf Curl Virus",
  "Tomato Mosaic Virus": "Tomato Mosaic Virus",
  "Healthy Tomato": "Healthy",
  // Additional vegetables
  "Cucumber Downy Mildew": "Cucumber Downy Mildew",
  "Cucumber Powdery Mildew": "Cucumber Powdery Mildew",
  "Cucumber Angular Leaf Spot": "Cucumber Angular Leaf Spot",
  "Healthy Cucumber": "Healthy",
  "Lettuce Downy Mildew": "Lettuce Downy Mildew",
  "Lettuce Drop": "Lettuce Drop",
  "Healthy Lettuce": "Healthy",
  "Spinach Downy Mildew": "Spinach Downy Mildew",
  "Healthy Spinach": "Healthy",
  "Carrot Leaf Blight": "Carrot Leaf Blight",
  "Healthy Carrot": "Healthy",
  "Onion Purple Blotch": "Onion Purple Blotch",
  "Healthy Onion": "Healthy",
  "Garlic Rust": "Garlic Rust",
  "Healthy Garlic": "Healthy",
  "Broccoli Black Rot": "Broccoli Black Rot",
  "Healthy Broccoli": "Healthy",
  "Cauliflower Black Rot": "Cauliflower Black Rot",
  "Healthy Cauliflower": "Healthy",
  "Cabbage Black Rot": "Cabbage Black Rot",
  "Healthy Cabbage": "Healthy",
  // Cereal crops
  "Corn Northern Leaf Blight": "Corn Northern Leaf Blight",
  "Corn Southern Rust": "Corn Southern Rust",
  "Corn Common Rust": "Corn Common Rust",
  "Healthy Corn": "Healthy",
  "Wheat Leaf Rust": "Wheat Leaf Rust",
  "Wheat Stripe Rust": "Wheat Stripe Rust",
  "Wheat Powdery Mildew": "Wheat Powdery Mildew",
  "Healthy Wheat": "Healthy",
  "Rice Blast": "Rice Blast",
  "Rice Brown Spot": "Rice Brown Spot",
  "Healthy Rice": "Healthy",
  // Legumes
  "Soybean Rust": "Soybean Rust",
  "Soybean Bacterial Blight": "Soybean Bacterial Blight",
  "Healthy Soybean": "Healthy",
  "Bean Rust": "Bean Rust",
  "Bean Anthracnose": "Bean Anthracnose",
  "Healthy Bean": "Healthy",
  // Common disease patterns
  "Powdery Mildew": "Powdery Mildew",
  "Downy Mildew": "Downy Mildew",
  "Leaf Spot": "Leaf Spot",
  "Anthracnose": "Anthracnose",
  "Bacterial Wilt": "Bacterial Wilt",
  "Rust": "Rust",
  "Viral Infection": "Viral Infection",
  "Nutrient Deficiency": "Nutrient Deficiency",
  // General healthy plants
  "Healthy Plant": "Healthy"
};
var DISEASE_CONFIDENCE = {
  // Original confidence values
  "Pepper Bacterial Spot": 0.94,
  "Potato Early Blight": 0.92,
  "Potato Late Blight": 0.93,
  "Tomato Bacterial Spot": 0.91,
  "Tomato Early Blight": 0.9,
  "Tomato Late Blight": 0.93,
  "Tomato Leaf Mold": 0.89,
  "Tomato Septoria Leaf Spot": 0.92,
  "Tomato Spider Mites": 0.88,
  "Tomato Target Spot": 0.87,
  "Tomato Yellow Leaf Curl Virus": 0.95,
  "Tomato Mosaic Virus": 0.92,
  // Additional vegetables
  "Cucumber Downy Mildew": 0.9,
  "Cucumber Powdery Mildew": 0.91,
  "Cucumber Angular Leaf Spot": 0.89,
  "Lettuce Downy Mildew": 0.9,
  "Lettuce Drop": 0.88,
  "Spinach Downy Mildew": 0.9,
  "Carrot Leaf Blight": 0.87,
  "Onion Purple Blotch": 0.88,
  "Garlic Rust": 0.88,
  "Broccoli Black Rot": 0.89,
  "Cauliflower Black Rot": 0.89,
  "Cabbage Black Rot": 0.89,
  // Cereal crops
  "Corn Northern Leaf Blight": 0.9,
  "Corn Southern Rust": 0.91,
  "Corn Common Rust": 0.91,
  "Wheat Leaf Rust": 0.91,
  "Wheat Stripe Rust": 0.9,
  "Wheat Powdery Mildew": 0.89,
  "Rice Blast": 0.92,
  "Rice Brown Spot": 0.9,
  // Legumes
  "Soybean Rust": 0.9,
  "Soybean Bacterial Blight": 0.89,
  "Bean Rust": 0.91,
  "Bean Anthracnose": 0.9,
  // Common disease patterns
  "Powdery Mildew": 0.89,
  "Downy Mildew": 0.89,
  "Leaf Spot": 0.87,
  "Anthracnose": 0.88,
  "Bacterial Wilt": 0.88,
  "Rust": 0.9,
  "Viral Infection": 0.82,
  "Nutrient Deficiency": 0.85
};
async function imageToBase64(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  return imageBuffer.toString("base64");
}
async function analyzePlantDisease(imagePath) {
  try {
    const base64Image = await imageToBase64(imagePath);
    const analysisText = await analyzePlantImageWithAI(base64Image);
    const isNonPlantImage = analysisText.startsWith("NOT_A_PLANT:") || analysisText.toLowerCase().includes("not a plant") || analysisText.toLowerCase().includes("doesn't contain a plant") || analysisText.toLowerCase().includes("does not contain a plant") || analysisText.toLowerCase().includes("not contain plant") || analysisText.toLowerCase().includes("no plant") || analysisText.toLowerCase().includes("cannot identify any plant") || analysisText.toLowerCase().includes("not see any plant");
    if (isNonPlantImage) {
      return {
        disease: "Non-Plant Image",
        class: "Non-Plant",
        confidence: 0.99,
        // High confidence it's not a plant
        analysis: analysisText
        // Include the full analysis for reference
      };
    }
    let detectedDisease = "Healthy";
    let confidence = 0.85;
    if (analysisText.toLowerCase().includes("cannot make a confident") || analysisText.toLowerCase().includes("uncertain") || analysisText.toLowerCase().includes("not clear enough") || analysisText.toLowerCase().includes("difficult to determine") || analysisText.toLowerCase().includes("cannot provide a confident")) {
      confidence = 0.65;
    }
    for (const [diseaseKey, friendlyName] of Object.entries(CLASS_MAPPING)) {
      if (diseaseKey.includes("Healthy")) continue;
      if (analysisText.includes(diseaseKey)) {
        detectedDisease = friendlyName;
        confidence = DISEASE_CONFIDENCE[diseaseKey] || 0.89;
        break;
      }
    }
    const symptomIndicators = [
      "spot",
      "spots",
      "lesion",
      "lesions",
      "chlorosis",
      "necrosis",
      "wilting",
      "yellowing",
      "browning",
      "discoloration",
      "mottling",
      "stunting",
      "blight",
      "rot",
      "mold",
      "mildew",
      "rust",
      "scab",
      "gall",
      "deficiency",
      "deficient",
      "symptom",
      "symptoms",
      "infected",
      "infection",
      "disease",
      "canker",
      "mosaic"
    ];
    const hasSymptoms = symptomIndicators.some(
      (indicator) => analysisText.toLowerCase().includes(indicator)
    );
    if (hasSymptoms && detectedDisease === "Healthy") {
      const lowerText = analysisText.toLowerCase();
      if (lowerText.includes("powdery mildew")) {
        detectedDisease = "Powdery Mildew";
      } else if (lowerText.includes("downy mildew")) {
        detectedDisease = "Downy Mildew";
      } else if (lowerText.includes("leaf spot") || lowerText.includes("spots on")) {
        detectedDisease = "Leaf Spot";
      } else if (lowerText.includes("blight")) {
        detectedDisease = "Blight";
      } else if (lowerText.includes("rust")) {
        detectedDisease = "Rust";
      } else if (lowerText.includes("virus") || lowerText.includes("viral")) {
        detectedDisease = "Viral Infection";
      } else if (lowerText.includes("nutrient") || lowerText.includes("deficiency")) {
        detectedDisease = "Nutrient Deficiency";
      } else if (lowerText.includes("mold")) {
        detectedDisease = "Leaf Mold";
      } else if (lowerText.includes("rot")) {
        detectedDisease = "Rot";
      } else {
        detectedDisease = "Unidentified Disease";
      }
      confidence = 0.8;
    } else if (detectedDisease === "Healthy" && (analysisText.toLowerCase().includes("healthy") || analysisText.toLowerCase().includes("no disease") || analysisText.toLowerCase().includes("not diseased")) && !hasSymptoms) {
      detectedDisease = "Healthy";
      confidence = 0.93;
    }
    const plantTypes = [
      "Tomato",
      "Potato",
      "Pepper",
      "Cucumber",
      "Lettuce",
      "Spinach",
      "Carrot",
      "Onion",
      "Garlic",
      "Broccoli",
      "Cauliflower",
      "Cabbage",
      "Corn",
      "Wheat",
      "Rice",
      "Soybean",
      "Bean"
    ];
    let plantType = null;
    for (const type of plantTypes) {
      if (analysisText.includes(type)) {
        plantType = type;
        break;
      }
    }
    if (plantType && detectedDisease === "Healthy") {
      detectedDisease = `Healthy ${plantType}`;
    }
    if (plantType && (detectedDisease === "Powdery Mildew" || detectedDisease === "Downy Mildew" || detectedDisease === "Leaf Spot" || detectedDisease === "Anthracnose" || detectedDisease === "Bacterial Wilt" || detectedDisease === "Rust" || detectedDisease === "Viral Infection" || detectedDisease === "Nutrient Deficiency")) {
      detectedDisease = `${plantType} ${detectedDisease}`;
    }
    const finalDiseaseName = CLASS_MAPPING[detectedDisease] || detectedDisease;
    return {
      disease: finalDiseaseName,
      class: detectedDisease,
      confidence,
      analysis: analysisText
      // Include the full analysis for reference
    };
  } catch (error) {
    console.error("Error during image analysis:", error);
    if (error.message && typeof error.message === "string" && (error.message.includes("not appear to contain") || error.message.includes("not a plant"))) {
      throw error;
    }
    throw new Error("Failed to analyze plant image");
  }
}

// shared/newsletter-schema.ts
import { z as z2 } from "zod";
var newsletterSubscriptionSchema = z2.object({
  email: z2.string().email("Please provide a valid email address").min(5, "Email must be at least 5 characters long").max(100, "Email must be less than 100 characters long")
});

// server/routes.ts
import multer from "multer";
import path from "path";
import * as fs2 from "fs";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing Stripe secret key. Stripe payment functionality will not work.");
}
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) : null;
var upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs2.existsSync(uploadDir)) {
        fs2.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB max file size
  }
});
var isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.post("/api/diagnose", upload.single("image"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      const userId = req.user.id;
      const { canDiagnose, user } = await storage.incrementDiagnosisCount(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!canDiagnose) {
        const { isInTrial, daysLeft, trialEnded } = await storage.checkTrialStatus(userId);
        if (!isInTrial) {
          if (user.trialStartedAt) {
            return res.status(403).json({
              message: "Your trial period has ended. Upgrade to Premium for unlimited diagnoses.",
              error: "TRIAL_ENDED",
              trialUsed: true
            });
          } else {
            return res.status(403).json({
              message: "Start your 30-day free trial to diagnose plant diseases or upgrade to Premium for unlimited access.",
              error: "NO_ACCESS",
              canStartTrial: true
            });
          }
        } else {
          return res.status(403).json({
            message: `You are currently in your trial period with ${daysLeft} days remaining.`,
            error: "TRIAL_ACTIVE",
            trialDaysLeft: daysLeft
          });
        }
      }
      const imagePath = req.file.path;
      const imageUrl = `/uploads/${req.file.filename}`;
      const imageBuffer = fs2.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");
      let plantAnalysis;
      let plantType = "Unknown";
      try {
        plantAnalysis = await analyzePlantImageWithAI(base64Image);
        console.log("Enhanced AI analysis result:", plantAnalysis);
        const plantTypeMatch = plantAnalysis.match(/(?:This is|I identify this as|The plant is|This appears to be)(?: a)? ([\w\s-]+?)(?:plant| leaf| stem| flower|\.|,)/i);
        if (plantTypeMatch && plantTypeMatch[1]) {
          plantType = plantTypeMatch[1].trim();
        } else {
          const altPlantMatch = plantAnalysis.match(/(?:The image shows|This image contains|In the image|identifies as)(?: a)? ([\w\s-]+?)(?:plant| leaf| stem| flower|\.|,)/i);
          if (altPlantMatch) {
            plantType = altPlantMatch[1].trim();
          }
        }
        plantType = plantType.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
      } catch (error) {
        console.error("Error with OpenAI analysis:", error);
      }
      const analysisResult = await analyzePlantDisease(imagePath);
      let diseaseData;
      let treatmentsFromAI = [];
      let severityFromAI = "Medium";
      let descriptionFromAI = "";
      let diseaseName = analysisResult.disease;
      if (plantAnalysis) {
        let diseaseMatch = plantAnalysis.match(/(?:I identify|I detect|appears to be|suffering from|affected by|shows symptoms of|diagnosed with) ([\w\s-]+)(?: disease| infection| virus| bacteria)?/i);
        if (!diseaseMatch) {
          diseaseMatch = plantAnalysis.match(/disease(?:s)? known as ([^\.]+)/i);
        }
        if (!diseaseMatch) {
          for (const possibleDisease of ["leaf curl", "powdery mildew", "downy mildew", "leaf spot", "blight", "rust", "mosaic virus", "anthracnose", "bacterial wilt", "leaf miners", "fire blight"]) {
            if (plantAnalysis.toLowerCase().includes(possibleDisease)) {
              diseaseMatch = [null, possibleDisease];
              break;
            }
          }
        }
        if (diseaseMatch && diseaseMatch[1]) {
          diseaseName = diseaseMatch[1].trim();
          diseaseName = diseaseName.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
        }
        if (plantAnalysis.toLowerCase().includes("healthy") && !plantAnalysis.toLowerCase().includes("not healthy")) {
          diseaseName = "Healthy";
        }
        if (diseaseName.includes("Unidentified")) {
          const additionalPatterns = [
            /identified as ([^\.]+)/i,
            /diagnosed as ([^\.]+)/i,
            /suffering from ([^\.]+)/i,
            /affected by ([^\.]+)/i,
            /infected with ([^\.]+)/i
          ];
          for (const pattern of additionalPatterns) {
            const match = plantAnalysis.match(pattern);
            if (match && match[1]) {
              diseaseName = match[1].trim().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
              break;
            }
          }
        }
      }
      diseaseData = diseaseInfo.find((d) => d.name === diseaseName);
      if (!diseaseData) {
        diseaseData = diseaseInfo.find(
          (d) => diseaseName.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(diseaseName.toLowerCase())
        );
      }
      if (!diseaseData || analysisResult.disease.includes("Unidentified") || analysisResult.analysis.toLowerCase().includes("symptom") && !analysisResult.disease.includes("Healthy")) {
        const aiAnalysis = analysisResult.analysis;
        if (aiAnalysis.toLowerCase().includes("severe") || aiAnalysis.toLowerCase().includes("advanced") || aiAnalysis.toLowerCase().includes("widespread")) {
          severityFromAI = "High";
        } else if (aiAnalysis.toLowerCase().includes("mild") || aiAnalysis.toLowerCase().includes("early stage") || aiAnalysis.toLowerCase().includes("beginning")) {
          severityFromAI = "Low";
        } else {
          severityFromAI = "Medium";
        }
        if (diseaseName.toLowerCase().includes("leaf curl") || plantAnalysis.toLowerCase().includes("leaf curl")) {
          treatmentsFromAI = [
            "Remove and destroy all infected leaves and plant debris",
            "Apply fungicide with copper compounds during the dormant season",
            "Ensure good air circulation by proper pruning",
            "Water at the base of the plant to avoid wetting the leaves",
            "Plant resistant varieties in the future"
          ];
          descriptionFromAI = "Leaf curl is a fungal disease caused by Taphrina deformans. It affects peach, nectarine, and related trees causing leaves to become distorted, puckered, and discolored with reddish-purple tones.";
        } else if (analysisResult.disease.toLowerCase().includes("powdery mildew") || diseaseName.toLowerCase().includes("powdery mildew")) {
          treatmentsFromAI = [
            "Remove and destroy infected leaves",
            "Ensure good air circulation around plants",
            "Apply neem oil or potassium bicarbonate spray",
            "Use fungicides containing sulfur for severe cases",
            "Avoid overhead watering to prevent spreading"
          ];
          descriptionFromAI = "Powdery mildew is a fungal disease that appears as white powdery spots on leaves and stems. It thrives in humid conditions but doesn't require standing water to develop.";
        } else if (analysisResult.disease.toLowerCase().includes("downy mildew")) {
          treatmentsFromAI = [
            "Remove infected plant parts immediately",
            "Improve air circulation around plants",
            "Water at the base of plants in the morning",
            "Apply copper-based fungicides",
            "Rotate crops to prevent recurrence"
          ];
          descriptionFromAI = "Downy mildew is a fungus-like disease that causes yellow or brown spots on the upper leaf surface with fuzzy gray-purple growth underneath. It thrives in cool, wet conditions.";
        } else if (analysisResult.disease.toLowerCase().includes("leaf spot") || aiAnalysis.toLowerCase().includes("spots on")) {
          treatmentsFromAI = [
            "Remove infected leaves and destroy them",
            "Avoid overhead watering",
            "Apply fungicide containing copper or chlorothalonil",
            "Ensure adequate spacing between plants",
            "Use mulch to prevent soil splash onto leaves"
          ];
          descriptionFromAI = "Leaf spot diseases are caused by various fungi and bacteria, creating spots of various colors and sizes on foliage. They typically spread in wet conditions.";
        } else if (analysisResult.disease.toLowerCase().includes("blight")) {
          treatmentsFromAI = [
            "Remove and destroy all infected plant parts",
            "Avoid working with plants when they're wet",
            "Apply copper-based fungicides preventatively",
            "Rotate crops and avoid planting in the same location",
            "Improve drainage in the growing area"
          ];
          descriptionFromAI = "Blight is a rapidly spreading disease that causes sudden death or browning of plant tissues. It can be caused by fungi or bacteria and often appears in warm, moist conditions.";
        } else if (analysisResult.disease.toLowerCase().includes("rust")) {
          treatmentsFromAI = [
            "Remove infected leaves and stems",
            "Apply sulfur or copper-based fungicides",
            "Avoid overhead watering",
            "Increase spacing between plants",
            "Clean garden tools after use"
          ];
          descriptionFromAI = "Rust is a fungal disease characterized by orange, red, or brown pustules on the undersides of leaves. It can weaken plants by reducing photosynthesis and causing leaf drop.";
        } else if (analysisResult.disease.toLowerCase().includes("viral")) {
          treatmentsFromAI = [
            "Remove and destroy infected plants",
            "Control insect vectors like aphids and whiteflies",
            "Disinfect tools between plants",
            "Use virus-resistant varieties in future plantings",
            "Maintain weed control to reduce virus reservoirs"
          ];
          descriptionFromAI = "Viral infections in plants often cause mottling, distortion, or discoloration of leaves. There are no chemical treatments for plant viruses, so management focuses on prevention and control.";
        } else if (analysisResult.disease.toLowerCase().includes("nutrient deficiency")) {
          treatmentsFromAI = [
            "Conduct a soil test to identify specific deficiencies",
            "Apply balanced fertilizer appropriate for the plant",
            "Adjust soil pH if necessary for nutrient availability",
            "Use foliar feeding for quick uptake of nutrients",
            "Add organic matter to improve soil structure and nutrient retention"
          ];
          descriptionFromAI = "Nutrient deficiencies cause various symptoms depending on the lacking element. Common signs include yellowing, stunted growth, and abnormal leaf development.";
        } else if (aiAnalysis.toLowerCase().includes("spot") || aiAnalysis.toLowerCase().includes("lesion") || aiAnalysis.toLowerCase().includes("discolor")) {
          treatmentsFromAI = [
            "Remove affected parts of the plant",
            "Improve air circulation around plants",
            "Avoid overhead watering",
            "Apply appropriate fungicide for the symptoms observed",
            "Consider a broad-spectrum organic treatment like neem oil"
          ];
          descriptionFromAI = "The spotted pattern on the leaves suggests a fungal or bacterial infection. These pathogens typically thrive in humid conditions and may spread through water or contact.";
        } else {
          treatmentsFromAI = [
            "Remove affected parts of the plant",
            "Improve air circulation around plants",
            "Avoid overhead watering",
            "Apply appropriate fungicide if fungal disease is suspected",
            "Consider a broad-spectrum organic treatment like neem oil",
            "Consult with a local agricultural extension for specific identification"
          ];
          descriptionFromAI = "Based on the visible symptoms, this appears to be a plant disease or disorder. The symptoms could be caused by a pathogen, environmental stress, or nutrient imbalance.";
        }
      }
      if (!diseaseData && !treatmentsFromAI.length) {
        diseaseData = diseaseInfo.find((d) => d.name === "Healthy");
      }
      if (!diseaseData && !treatmentsFromAI.length) {
        return res.status(500).json({ message: "Failed to match disease data or generate treatments" });
      }
      const description = treatmentsFromAI.length > 0 ? descriptionFromAI : diseaseData.description;
      const severity = treatmentsFromAI.length > 0 ? severityFromAI : diseaseData.severity;
      const treatments = treatmentsFromAI.length > 0 ? treatmentsFromAI : diseaseData.treatments;
      const enhancedDescription = `AI Analysis: ${analysisResult.analysis}

Database Description: ${description}`;
      if (analysisResult.disease === "Non-Plant Image") {
        const enhancedDescription2 = `AI Analysis: ${analysisResult.analysis}

Database Description: This is not a plant image. Our system works best with clear, close-up photos of tomato, potato, or pepper plant leaves.`;
        const treatments2 = [
          "Please upload a clear image of tomato, potato, or pepper plant leaves",
          "Ensure good lighting when taking photos of plants",
          "Position the camera close to the leaf to capture details",
          "Try to include only the plant in the frame",
          "Avoid uploading non-plant images for diagnosis"
        ];
        const diagnosis2 = await storage.createDiagnosis({
          userId,
          imageUrl,
          disease: "Non-Plant Image",
          confidence: analysisResult.confidence,
          severity: "Not Applicable",
          description: enhancedDescription2,
          treatments: treatments2,
          metadata: {
            plantType: "None",
            aiAnalysis: plantAnalysis ? true : false,
            aiModel: "gpt-4o"
          }
        });
        await storage.getOrUpdateDiseaseStats("Non-Plant Image", analysisResult.confidence);
        await storage.logUserActivity(userId, "NON_PLANT_IMAGE_UPLOADED", {
          diagnosisId: diagnosis2.id,
          confidence: analysisResult.confidence
        });
        const today2 = /* @__PURE__ */ new Date();
        const metrics2 = await storage.getOrCreateUsageMetricsForDate(userId, today2);
        const featureUsage2 = metrics2.featureUsage || {};
        if (!featureUsage2.nonPlantImages) {
          featureUsage2.nonPlantImages = 1;
        } else {
          featureUsage2.nonPlantImages++;
        }
        if (!featureUsage2.confidenceLevels) {
          featureUsage2.confidenceLevels = {
            low: 0,
            medium: 0,
            high: 0
          };
        }
        const confidenceLevel2 = analysisResult.confidence < 0.4 ? "low" : analysisResult.confidence < 0.7 ? "medium" : "high";
        featureUsage2.confidenceLevels[confidenceLevel2]++;
        await storage.updateUsageMetrics(metrics2.id, {
          diagnosisCount: metrics2.diagnosisCount + 1,
          featureUsage: featureUsage2
        });
        res.status(200).json(diagnosis2);
        return;
      }
      const diagnosis = await storage.createDiagnosis({
        userId,
        imageUrl,
        disease: diseaseName || analysisResult.disease,
        confidence: analysisResult.confidence,
        severity,
        description: enhancedDescription,
        treatments,
        metadata: {
          plantType: plantType || "Unknown",
          aiAnalysis: plantAnalysis ? true : false,
          aiModel: "gpt-4o"
        }
      });
      await storage.getOrUpdateDiseaseStats(analysisResult.disease, analysisResult.confidence);
      await storage.logUserActivity(userId, "DIAGNOSIS_CREATED", {
        diagnosisId: diagnosis.id,
        disease: analysisResult.disease,
        confidence: analysisResult.confidence
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.diseaseTypes) {
        featureUsage.diseaseTypes = {};
      }
      if (!featureUsage.diseaseTypes[analysisResult.disease]) {
        featureUsage.diseaseTypes[analysisResult.disease] = 1;
      } else {
        featureUsage.diseaseTypes[analysisResult.disease]++;
      }
      if (!featureUsage.confidenceLevels) {
        featureUsage.confidenceLevels = {
          low: 0,
          medium: 0,
          high: 0
        };
      }
      const confidenceLevel = analysisResult.confidence < 0.4 ? "low" : analysisResult.confidence < 0.7 ? "medium" : "high";
      featureUsage.confidenceLevels[confidenceLevel]++;
      await storage.updateUsageMetrics(metrics.id, {
        diagnosisCount: metrics.diagnosisCount + 1,
        featureUsage
      });
      res.status(200).json(diagnosis);
    } catch (error) {
      console.error("Error during diagnosis:", error);
      res.status(500).json({ message: "Failed to process diagnosis" });
    }
  });
  app2.get("/api/diagnoses", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;
      const diagnoses2 = await storage.getDiagnosesByUserId(userId);
      await storage.logUserActivity(userId, "DIAGNOSIS_HISTORY_VIEWED", {
        diagnosisCount: diagnoses2.length
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.historyViews) {
        featureUsage.historyViews = 1;
      } else {
        featureUsage.historyViews++;
      }
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      res.status(200).json(diagnoses2);
    } catch (error) {
      console.error("Error fetching diagnoses:", error);
      res.status(500).json({ message: "Failed to fetch diagnoses" });
    }
  });
  app2.get("/api/diagnoses/recent", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 5;
      const diagnoses2 = await storage.getRecentDiagnosesByUserId(userId, limit);
      await storage.logUserActivity(userId, "RECENT_DIAGNOSES_VIEWED", {
        limit,
        diagnosisCount: diagnoses2.length
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.recentDiagnosesViews) {
        featureUsage.recentDiagnosesViews = 1;
      } else {
        featureUsage.recentDiagnosesViews++;
      }
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      res.status(200).json(diagnoses2);
    } catch (error) {
      console.error("Error fetching recent diagnoses:", error);
      res.status(500).json({ message: "Failed to fetch recent diagnoses" });
    }
  });
  app2.get("/api/diagnoses/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const diagnosisId = parseInt(req.params.id);
      const diagnosis = await storage.getDiagnosis(diagnosisId);
      if (!diagnosis) {
        return res.status(404).json({ message: "Diagnosis not found" });
      }
      if (diagnosis.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.logUserActivity(req.user.id, "DIAGNOSIS_VIEWED", {
        diagnosisId: diagnosis.id,
        disease: diagnosis.disease
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(req.user.id, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.diagnosisViews) {
        featureUsage.diagnosisViews = 1;
      } else {
        featureUsage.diagnosisViews++;
      }
      if (!featureUsage.viewedDiseases) {
        featureUsage.viewedDiseases = {};
      }
      if (!featureUsage.viewedDiseases[diagnosis.disease]) {
        featureUsage.viewedDiseases[diagnosis.disease] = 1;
      } else {
        featureUsage.viewedDiseases[diagnosis.disease]++;
      }
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      res.status(200).json(diagnosis);
    } catch (error) {
      console.error("Error fetching diagnosis:", error);
      res.status(500).json({ message: "Failed to fetch diagnosis" });
    }
  });
  app2.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not properly configured" });
      }
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: userId.toString()
          }
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500,
        // $5.00 in cents
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          userId: userId.toString(),
          type: "premium_payment",
          plan: "monthly",
          description: "Plant Health AI Premium - 1 month"
        }
      });
      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });
  app2.post("/api/create-subscription", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not properly configured" });
      }
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.stripeSubscriptionId) {
        try {
          const subscription2 = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (subscription2.status === "active") {
            return res.status(200).json({
              message: "Subscription already active",
              subscription: {
                id: subscription2.id,
                status: subscription2.status,
                currentPeriodEnd: new Date(subscription2.current_period_end * 1e3)
              }
            });
          }
        } catch (err) {
          console.warn("Failed to retrieve subscription, creating new one", err);
        }
      }
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: userId.toString()
          }
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            // Using a predefined price for the premium subscription
            price_data: {
              currency: "usd",
              product_data: {
                name: "Plant Health AI Premium Subscription",
                description: "Unlimited diagnoses and premium features"
              },
              unit_amount: 500,
              // $5.00 per month
              recurring: {
                interval: "month"
              }
            }
          }
        ],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"]
      });
      await storage.updateStripeSubscriptionId(userId, subscription.id);
      const premiumUntil = new Date(subscription.current_period_end * 1e3);
      const updatedUser = await storage.updateUserPremiumStatus(userId, true, premiumUntil);
      await storage.logUserActivity(userId, "PREMIUM_SUBSCRIPTION_CREATED", {
        subscriptionId: subscription.id,
        premiumUntil
      });
      const invoice = subscription.latest_invoice;
      const paymentIntent = invoice.payment_intent;
      res.status(200).json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  app2.post("/api/subscription/confirm", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not properly configured" });
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "Payment has not been completed",
          paymentStatus: paymentIntent.status
        });
      }
      const premiumUntil = /* @__PURE__ */ new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 30);
      const updatedUser = await storage.updateUserPremiumStatus(userId, true, premiumUntil);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.logUserActivity(userId, "PREMIUM_SUBSCRIPTION_ACTIVATED", {
        paymentIntentId,
        premiumUntil
      });
      res.status(200).json({
        isPremium: updatedUser.isPremium,
        premiumUntil: updatedUser.premiumUntil
      });
    } catch (error) {
      console.error("Error confirming subscription payment:", error);
      res.status(500).json({ message: "Failed to confirm subscription payment" });
    }
  });
  app2.post("/api/trial/start", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isPremium) {
        return res.status(400).json({
          message: "You already have premium access",
          isPremium: true
        });
      }
      if (user.trialStartedAt) {
        const { isInTrial, trialEnded, daysLeft: daysLeft2 } = await storage.checkTrialStatus(userId);
        if (isInTrial) {
          return res.status(400).json({
            message: `You are already in your 30-day trial period. ${daysLeft2} days remaining.`,
            isInTrial: true,
            daysLeft: daysLeft2
          });
        } else if (trialEnded) {
          return res.status(400).json({
            message: "Your trial period has ended. Please upgrade to premium for full access.",
            trialEnded: true
          });
        }
      }
      const updatedUser = await storage.startTrial(userId);
      const { daysLeft } = await storage.checkTrialStatus(userId);
      await storage.logUserActivity(userId, "TRIAL_STARTED", {
        daysLeft
      });
      return res.status(200).json({
        message: "Your 30-day trial has started!",
        user: updatedUser,
        daysLeft
      });
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({ message: "Failed to start trial" });
    }
  });
  app2.get("/api/trial/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;
      const trialStatus = await storage.checkTrialStatus(userId);
      return res.status(200).json(trialStatus);
    } catch (error) {
      console.error("Error checking trial status:", error);
      res.status(500).json({ message: "Failed to check trial status" });
    }
  });
  app2.post("/api/voice-assistant", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = req.user;
      const userId = user.id;
      if (!user.isPremium) {
        const { isInTrial, trialEnded } = await storage.checkTrialStatus(userId);
        if (!isInTrial) {
          if (trialEnded) {
            return res.status(403).json({
              message: "Your trial has ended. Upgrade to Premium to continue using the voice assistant.",
              error: "TRIAL_ENDED"
            });
          } else {
            return res.status(403).json({
              message: "Premium subscription or active trial required for voice assistant.",
              error: "PREMIUM_REQUIRED"
            });
          }
        }
      }
      const { question, diseaseContext } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      const response = await analyzeWithVoiceAssistant(question, diseaseContext);
      await storage.logUserActivity(userId, "VOICE_ASSISTANT_USED", {
        diseaseContext: diseaseContext || null,
        questionLength: question.length
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.voiceAssistantCount) {
        featureUsage.voiceAssistantCount = 1;
      } else {
        featureUsage.voiceAssistantCount++;
      }
      await storage.updateUsageMetrics(metrics.id, {
        featureUsage
      });
      res.status(200).json({ response });
    } catch (error) {
      console.error("Error with voice assistant:", error);
      res.status(500).json({ message: "Failed to process with voice assistant" });
    }
  });
  app2.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const result = newsletterSubscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid email format",
          errors: result.error.flatten().fieldErrors
        });
      }
      const { email } = result.data;
      const isSubscribed = await storage.isEmailSubscribed(email);
      if (isSubscribed) {
        return res.status(200).json({
          message: "Email already subscribed",
          alreadySubscribed: true
        });
      }
      const subscriber = await storage.subscribeToNewsletter(email);
      if (req.isAuthenticated()) {
        await storage.logUserActivity(req.user.id, "NEWSLETTER_SUBSCRIBED", {
          email
        });
      }
      res.status(201).json({
        message: "Successfully subscribed to newsletter"
      });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });
  app2.get("/api/analytics/activities", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!req.user.isPremium) {
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({
            message: "Analytics are only available for premium users",
            error: "PREMIUM_REQUIRED"
          });
        }
      }
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const activities = await storage.getUserActivities(userId, limit);
      await storage.logUserActivity(userId, "ANALYTICS_ACTIVITY_VIEWED", {
        limit
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.analyticsViews) {
        featureUsage.analyticsViews = {
          activity: 1,
          usage: 0,
          diseaseStats: 0
        };
      } else if (!featureUsage.analyticsViews.activity) {
        featureUsage.analyticsViews.activity = 1;
      } else {
        featureUsage.analyticsViews.activity++;
      }
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      res.status(200).json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });
  app2.get("/api/analytics/usage", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!req.user.isPremium) {
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({
            message: "Analytics are only available for premium users",
            error: "PREMIUM_REQUIRED"
          });
        }
      }
      const userId = req.user.id;
      let startDate;
      let endDate;
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate);
      }
      const metrics = await storage.getUsageMetricsForUser(userId, startDate, endDate);
      await storage.logUserActivity(userId, "ANALYTICS_USAGE_VIEWED", {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null
      });
      const today = /* @__PURE__ */ new Date();
      const usageMetrics2 = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = usageMetrics2.featureUsage || {};
      if (!featureUsage.analyticsViews) {
        featureUsage.analyticsViews = {
          activity: 0,
          usage: 1,
          diseaseStats: 0
        };
      } else if (!featureUsage.analyticsViews.usage) {
        featureUsage.analyticsViews.usage = 1;
      } else {
        featureUsage.analyticsViews.usage++;
      }
      await storage.updateUsageMetrics(usageMetrics2.id, { featureUsage });
      res.status(200).json(metrics);
    } catch (error) {
      console.error("Error fetching usage metrics:", error);
      res.status(500).json({ message: "Failed to fetch usage metrics" });
    }
  });
  app2.get("/api/analytics/metrics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!req.user.isPremium) {
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({
            message: "Analytics are only available for premium users",
            error: "PREMIUM_REQUIRED"
          });
        }
      }
      const userId = req.user.id;
      let startDate;
      let endDate;
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate);
      }
      const metrics = await storage.getUsageMetricsForUser(userId, startDate, endDate);
      await storage.logUserActivity(userId, "ANALYTICS_USAGE_VIEWED", {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null
      });
      const today = /* @__PURE__ */ new Date();
      const usageMetrics2 = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = usageMetrics2.featureUsage || {};
      if (!featureUsage.analyticsViews) {
        featureUsage.analyticsViews = {
          activity: 0,
          usage: 1,
          diseaseStats: 0
        };
      } else if (!featureUsage.analyticsViews.usage) {
        featureUsage.analyticsViews.usage = 1;
      } else {
        featureUsage.analyticsViews.usage++;
      }
      await storage.updateUsageMetrics(usageMetrics2.id, { featureUsage });
      res.status(200).json(metrics);
    } catch (error) {
      console.error("Error fetching usage metrics:", error);
      res.status(500).json({ message: "Failed to fetch usage metrics" });
    }
  });
  app2.get("/api/analytics/disease-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!req.user.isPremium) {
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({
            message: "Analytics are only available for premium users",
            error: "PREMIUM_REQUIRED"
          });
        }
      }
      const limit = parseInt(req.query.limit) || 10;
      const topDiseases = await storage.getTopDiseases(limit);
      await storage.logUserActivity(req.user.id, "ANALYTICS_DISEASE_STATS_VIEWED", {
        limit
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(req.user.id, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.analyticsViews) {
        featureUsage.analyticsViews = {
          activity: 0,
          usage: 0,
          diseaseStats: 1
        };
      } else if (!featureUsage.analyticsViews.diseaseStats) {
        featureUsage.analyticsViews.diseaseStats = 1;
      } else {
        featureUsage.analyticsViews.diseaseStats++;
      }
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      res.status(200).json(topDiseases);
    } catch (error) {
      console.error("Error fetching disease statistics:", error);
      res.status(500).json({ message: "Failed to fetch disease statistics" });
    }
  });
  app2.get("/api/analytics/top-diseases", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!req.user.isPremium) {
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({
            message: "Analytics are only available for premium users",
            error: "PREMIUM_REQUIRED"
          });
        }
      }
      const limit = parseInt(req.query.limit) || 10;
      const topDiseases = await storage.getTopDiseases(limit);
      await storage.logUserActivity(req.user.id, "ANALYTICS_DISEASE_STATS_VIEWED", {
        limit
      });
      const today = /* @__PURE__ */ new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(req.user.id, today);
      const featureUsage = metrics.featureUsage || {};
      if (!featureUsage.analyticsViews) {
        featureUsage.analyticsViews = {
          activity: 0,
          usage: 0,
          diseaseStats: 1
        };
      } else if (!featureUsage.analyticsViews.diseaseStats) {
        featureUsage.analyticsViews.diseaseStats = 1;
      } else {
        featureUsage.analyticsViews.diseaseStats++;
      }
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      res.status(200).json(topDiseases);
    } catch (error) {
      console.error("Error fetching disease statistics:", error);
      res.status(500).json({ message: "Failed to fetch disease statistics" });
    }
  });
  app2.post("/api/analytics/log-activity", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;
      const { activityType, details } = req.body;
      if (!activityType) {
        return res.status(400).json({ message: "Activity type is required" });
      }
      const activity = await storage.logUserActivity(userId, activityType, details);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error logging user activity:", error);
      res.status(500).json({ message: "Failed to log user activity" });
    }
  });
  app2.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not properly configured" });
    }
    const payload = req.body;
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      try {
        event = JSON.parse(payload);
      } catch (err) {
        console.error(`Webhook payload parsing failed: ${err.message}`);
        return res.status(400).send(`Webhook payload parsing failed: ${err.message}`);
      }
    }
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log(`Payment intent ${paymentIntent.id} succeeded`);
        if (paymentIntent.metadata && paymentIntent.metadata.type === "subscription_payment") {
          const userId = parseInt(paymentIntent.metadata.userId);
          if (userId) {
            const premiumUntil = /* @__PURE__ */ new Date();
            premiumUntil.setDate(premiumUntil.getDate() + 30);
            await storage.updateUserPremiumStatus(userId, true, premiumUntil);
            await storage.logUserActivity(userId, "PAYMENT_INTENT_SUCCEEDED", {
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount / 100
              // Convert cents to dollars
            });
          }
        }
        break;
      case "customer.subscription.created":
        const subscriptionCreated = event.data.object;
        console.log(`Subscription ${subscriptionCreated.id} created`);
        break;
      case "customer.subscription.updated":
        const subscriptionUpdated = event.data.object;
        console.log(`Subscription ${subscriptionUpdated.id} updated`);
        const customerInUpdated = await stripe.customers.retrieve(subscriptionUpdated.customer);
        if (customerInUpdated.metadata && customerInUpdated.metadata.userId) {
          const userId = parseInt(customerInUpdated.metadata.userId);
          if (subscriptionUpdated.status === "active") {
            const premiumUntil = new Date(subscriptionUpdated.current_period_end * 1e3);
            await storage.updateUserPremiumStatus(userId, true, premiumUntil);
            await storage.logUserActivity(userId, "SUBSCRIPTION_RENEWED", {
              subscriptionId: subscriptionUpdated.id,
              premiumUntil
            });
          } else if (subscriptionUpdated.status === "canceled" || subscriptionUpdated.status === "unpaid" || subscriptionUpdated.status === "incomplete_expired") {
            await storage.updateUserPremiumStatus(userId, false, null);
            await storage.logUserActivity(userId, "SUBSCRIPTION_ENDED", {
              subscriptionId: subscriptionUpdated.id,
              reason: subscriptionUpdated.status
            });
          }
        }
        break;
      case "invoice.payment_succeeded":
        const invoice = event.data.object;
        console.log(`Invoice ${invoice.id} payment succeeded`);
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(invoice.customer);
          if (customer.metadata && customer.metadata.userId) {
            const userId = parseInt(customer.metadata.userId);
            const premiumUntil = new Date(subscription.current_period_end * 1e3);
            await storage.updateUserPremiumStatus(userId, true, premiumUntil);
            await storage.logUserActivity(userId, "SUBSCRIPTION_PAYMENT_SUCCEEDED", {
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              premiumUntil
            });
          }
        }
        break;
      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        console.log(`Invoice ${failedInvoice.id} payment failed`);
        if (failedInvoice.customer) {
          const customer = await stripe.customers.retrieve(failedInvoice.customer);
          if (customer.metadata && customer.metadata.userId) {
            const userId = parseInt(customer.metadata.userId);
            await storage.logUserActivity(userId, "SUBSCRIPTION_PAYMENT_FAILED", {
              invoiceId: failedInvoice.id
            });
          }
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    res.status(200).json({ received: true });
  });
  app2.use("/uploads", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }, (req, res, next) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    res.sendFile(path.join(uploadDir, path.basename(req.url)), (err) => {
      if (err) next(err);
    });
  });
  app2.post("/api/reset-premium-status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const updatedUser = await storage.updateUserPremiumStatus(userId, false);
      if (updatedUser) {
        res.json({ success: true, message: "Premium status reset", user: updatedUser });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import { fileURLToPath } from "url";
import fs3 from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
var viteConfig;
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  if (!viteConfig) {
    const configPath = "../vite.config";
    const mod = await import(configPath);
    viteConfig = mod.default ?? mod;
  }
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname, "../dist/public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://127.0.0.1:61253 https://127.0.0.1:61253 https://newassets.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://api.hcaptcha.com https://www.google-analytics.com https://analytics.google.com https://play.google.com https://www.recaptcha.net https://www.gstatic.com https://*.ingest.sentry.io https://api.segment.io https://csp.withgoogle.com https://js.stripe.com https://api.stripe.com https://checkout.stripe.com https://*.stripe.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://newassets.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://www.google-analytics.com https://www.recaptcha.net https://www.gstatic.com https://js.stripe.com https://api.stripe.com https://*.stripe.com; style-src 'self' 'unsafe-inline' https://newassets.hcaptcha.com; img-src 'self' data: https:; font-src 'self' data:; frame-src 'self' https://newassets.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://www.recaptcha.net https://js.stripe.com https://api.stripe.com https://checkout.stripe.com https://*.stripe.com;"
  );
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 3e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: false
  }, () => {
    log(`serving on port ${port}`);
  });
})();
