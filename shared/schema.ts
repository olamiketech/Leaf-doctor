import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
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

export const diagnoses = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  disease: text("disease").notNull(),
  confidence: real("confidence").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  treatments: jsonb("treatments").notNull(),
  metadata: jsonb("metadata"), // For additional data like plant type
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Analytics tables
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 'login', 'diagnosis', 'upgrade', etc.
  details: jsonb("details"), // Additional context about the activity
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const usageMetrics = pgTable("usage_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  diagnosisCount: integer("diagnosis_count").default(0).notNull(),
  loginCount: integer("login_count").default(0).notNull(),
  featureUsage: jsonb("feature_usage"), // Track which features were used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const diagnosisStats = pgTable("diagnosis_stats", {
  id: serial("id").primaryKey(),
  diseaseType: varchar("disease_type", { length: 100 }).notNull(),
  count: integer("count").default(0).notNull(),
  avgConfidence: real("avg_confidence").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertDiagnosisSchema = createInsertSchema(diagnoses).omit({
  id: true,
  createdAt: true
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true
});

export const insertUsageMetricsSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDiagnosisStatsSchema = createInsertSchema(diagnosisStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const diseaseInfo = [
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Analytics types
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUsageMetrics = z.infer<typeof insertUsageMetricsSchema>;
export type UsageMetrics = typeof usageMetrics.$inferSelect;
export type InsertDiagnosisStats = z.infer<typeof insertDiagnosisStatsSchema>;
export type DiagnosisStats = typeof diagnosisStats.$inferSelect;

export type DiseaseInfo = typeof diseaseInfo[0];
