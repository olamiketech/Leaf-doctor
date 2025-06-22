import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CSP middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "connect-src 'self' http://127.0.0.1:61253 https://127.0.0.1:61253 https://newassets.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://api.hcaptcha.com https://www.google-analytics.com https://analytics.google.com https://play.google.com https://www.recaptcha.net https://www.gstatic.com https://*.ingest.sentry.io https://api.segment.io https://csp.withgoogle.com https://js.stripe.com https://api.stripe.com https://checkout.stripe.com https://*.stripe.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://newassets.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://www.google-analytics.com https://www.recaptcha.net https://www.gstatic.com https://js.stripe.com https://api.stripe.com https://*.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://newassets.hcaptcha.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "frame-src 'self' https://newassets.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com https://www.recaptcha.net https://js.stripe.com https://api.stripe.com https://checkout.stripe.com https://*.stripe.com;"
  );
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 3000
  // this serves both the API and the client
  const port = process.env.PORT || 3000;
  server.listen({
    port,
    host: "localhost",
    reusePort: false,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
