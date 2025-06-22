import { 
  users, 
  diagnoses, 
  newsletterSubscribers,
  userActivity,
  usageMetrics,
  diagnosisStats,
  type User, 
  type InsertUser, 
  type Diagnosis, 
  type InsertDiagnosis,
  type InsertNewsletterSubscriber,
  type NewsletterSubscriber,
  type InsertUserActivity,
  type UserActivity,
  type InsertUsageMetrics,
  type UsageMetrics,
  type InsertDiagnosisStats,
  type DiagnosisStats
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, desc, gte, lte } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: number, isPremium: boolean, premiumUntil?: Date): Promise<User | undefined>;
  
  // Stripe subscription management
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined>;
  
  // Trial and diagnosis tracking
  startTrial(userId: number): Promise<User | undefined>;
  checkTrialStatus(userId: number): Promise<{ isInTrial: boolean, trialEnded: boolean, daysLeft: number | null }>;
  incrementDiagnosisCount(userId: number): Promise<{ canDiagnose: boolean, user: User | undefined }>;
  resetMonthlyDiagnosisCount(userId: number): Promise<User | undefined>;
  
  createDiagnosis(diagnosis: InsertDiagnosis): Promise<Diagnosis>;
  getDiagnosis(id: number): Promise<Diagnosis | undefined>;
  getDiagnosesByUserId(userId: number): Promise<Diagnosis[]>;
  getRecentDiagnosesByUserId(userId: number, limit: number): Promise<Diagnosis[]>;
  
  subscribeToNewsletter(email: string): Promise<NewsletterSubscriber>;
  isEmailSubscribed(email: string): Promise<boolean>;
  
  // Analytics methods
  logUserActivity(userId: number, activityType: string, details?: Record<string, any>): Promise<UserActivity>;
  getUserActivities(userId: number, limit?: number): Promise<UserActivity[]>;
  getOrCreateUsageMetricsForDate(userId: number, date: Date): Promise<UsageMetrics>;
  updateUsageMetrics(id: number, updates: Partial<Omit<InsertUsageMetrics, 'id' | 'userId' | 'date'>>): Promise<UsageMetrics>;
  getUsageMetricsForUser(userId: number, startDate?: Date, endDate?: Date): Promise<UsageMetrics[]>;
  getOrUpdateDiseaseStats(diseaseType: string, confidence: number): Promise<DiagnosisStats>;
  getTopDiseases(limit?: number): Promise<DiagnosisStats[]>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use memory store for sessions to avoid WebSocket issues, but keep database for data
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPremiumStatus(userId: number, isPremium: boolean, premiumUntil?: Date): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        isPremium,
        premiumUntil: premiumUntil || null
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeSubscriptionId: subscriptionId })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: info.customerId,
        stripeSubscriptionId: info.subscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  // Start a 30-day trial for a user
  async startTrial(userId: number): Promise<User | undefined> {
    // Check if user already is or was on a trial
    const existingUser = await this.getUser(userId);
    if (!existingUser) return undefined;
    
    // If user is already premium or already started a trial, don't start a new trial
    if (existingUser.isPremium || existingUser.trialStartedAt) {
      return existingUser;
    }
    
    // Set the trial start date to now
    const trialStartedAt = new Date();
    
    // Update the user with the trial start date
    const [updatedUser] = await db
      .update(users)
      .set({ trialStartedAt })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  // Check if a user is in an active trial period
  async checkTrialStatus(userId: number): Promise<{ isInTrial: boolean, trialEnded: boolean, daysLeft: number | null }> {
    const user = await this.getUser(userId);
    
    // Default values
    const defaultResult = { isInTrial: false, trialEnded: false, daysLeft: null };
    
    if (!user) return defaultResult;
    
    // Premium users don't need trial status
    if (user.isPremium) return defaultResult;
    
    // If trial hasn't started, not in trial
    if (!user.trialStartedAt) return defaultResult;
    
    const trialStartDate = new Date(user.trialStartedAt);
    const currentDate = new Date();
    
    // Calculate trial end date (30 days after start)
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    // Calculate days left in trial
    const daysLeft = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Trial is active if current date is before trial end date
    const isInTrial = currentDate < trialEndDate;
    
    // Trial has ended if it started but is no longer active
    const trialEnded = !!user.trialStartedAt && !isInTrial;
    
    return {
      isInTrial,
      trialEnded,
      daysLeft: isInTrial ? daysLeft : null
    };
  }
  
  // Track diagnosis count and check if user can make a diagnosis
  async incrementDiagnosisCount(userId: number): Promise<{ canDiagnose: boolean, user: User | undefined }> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return { canDiagnose: false, user: undefined };
    }
    
    // Premium users can always diagnose
    if (user.isPremium) {
      // Still increment their count for analytics but always allow diagnosis
      const [updatedUser] = await db
        .update(users)
        .set({ 
          diagnosisCount: user.diagnosisCount + 1,
          lastDiagnosisDate: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return { canDiagnose: true, user: updatedUser };
    }
    
    // Check trial status
    const { isInTrial } = await this.checkTrialStatus(userId);
    
    // Only users in trial can diagnose without premium
    const canDiagnose = isInTrial;
    
    // Track diagnoses for all users (for analytics purposes)
    const now = new Date();
    
    if (canDiagnose) {
      // Increment the diagnosis count
      const [updatedUser] = await db
        .update(users)
        .set({ 
          diagnosisCount: user.diagnosisCount + 1,
          lastDiagnosisDate: now
        })
        .where(eq(users.id, userId))
        .returning();
      
      return { canDiagnose: true, user: updatedUser };
    }
    
    return { canDiagnose: false, user };
  }
  
  // Reset the user's monthly diagnosis count
  async resetMonthlyDiagnosisCount(userId: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ diagnosisCount: 0 })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async createDiagnosis(insertDiagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const [diagnosis] = await db
      .insert(diagnoses)
      .values(insertDiagnosis)
      .returning();
    
    return diagnosis;
  }

  async getDiagnosis(id: number): Promise<Diagnosis | undefined> {
    const [diagnosis] = await db.select().from(diagnoses).where(eq(diagnoses.id, id));
    return diagnosis;
  }

  async getDiagnosesByUserId(userId: number): Promise<Diagnosis[]> {
    return await db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.userId, userId))
      .orderBy(desc(diagnoses.id));  // Order by id, newest first (since IDs are sequential)
  }

  async getRecentDiagnosesByUserId(userId: number, limit: number): Promise<Diagnosis[]> {
    return await db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.userId, userId))
      .orderBy(desc(diagnoses.id))  // Order by id, newest first (since IDs are sequential)
      .limit(limit);
  }

  async subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
    const [subscriber] = await db
      .insert(newsletterSubscribers)
      .values({ email })
      .returning();
    
    return subscriber;
  }

  async isEmailSubscribed(email: string): Promise<boolean> {
    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email));
    
    return !!subscriber;
  }

  // Analytics methods
  async logUserActivity(userId: number, activityType: string, details?: Record<string, any>): Promise<UserActivity> {
    const [activity] = await db
      .insert(userActivity)
      .values({
        userId,
        activityType,
        details: details ? details : null
      })
      .returning();
    
    return activity;
  }

  async getUserActivities(userId: number, limit?: number): Promise<UserActivity[]> {
    let result = await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt));
    
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  async getOrCreateUsageMetricsForDate(userId: number, date: Date): Promise<UsageMetrics> {
    // Format date to YYYY-MM-DD to ensure we're comparing dates only (not time)
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    const dateString = formattedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Try to find existing metrics for this date
    const existingMetrics = await db
      .select()
      .from(usageMetrics)
      .where(eq(usageMetrics.userId, userId))
      .where(eq(usageMetrics.date, dateString));
    
    if (existingMetrics.length > 0) {
      return existingMetrics[0];
    }
    
    // Create new metrics for this date
    const [newMetrics] = await db
      .insert(usageMetrics)
      .values({
        userId,
        date: dateString,
        diagnosisCount: 0,
        loginCount: 0,
        featureUsage: {}
      })
      .returning();
    
    return newMetrics;
  }

  async updateUsageMetrics(
    id: number, 
    updates: Partial<Omit<InsertUsageMetrics, 'id' | 'userId' | 'date'>>
  ): Promise<UsageMetrics> {
    const [updatedMetrics] = await db
      .update(usageMetrics)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(usageMetrics.id, id))
      .returning();
    
    return updatedMetrics;
  }

  async getUsageMetricsForUser(
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<UsageMetrics[]> {
    let queryBase = db
      .select()
      .from(usageMetrics)
      .where(eq(usageMetrics.userId, userId));
    
    if (startDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      queryBase = queryBase.where(gte(usageMetrics.date, startDateStr));
    }
    
    if (endDate) {
      const endDateStr = endDate.toISOString().split('T')[0];
      queryBase = queryBase.where(lte(usageMetrics.date, endDateStr));
    }
    
    const result = await queryBase.orderBy(desc(usageMetrics.date));
    return result;
  }

  async getOrUpdateDiseaseStats(diseaseType: string, confidence: number): Promise<DiagnosisStats> {
    // Try to find existing stats for this disease
    const [existingStats] = await db
      .select()
      .from(diagnosisStats)
      .where(eq(diagnosisStats.diseaseType, diseaseType));
    
    if (existingStats) {
      // Update existing stats
      const newCount = existingStats.count + 1;
      const newAvgConfidence = (existingStats.avgConfidence * existingStats.count + confidence) / newCount;
      
      const [updatedStats] = await db
        .update(diagnosisStats)
        .set({
          count: newCount,
          avgConfidence: newAvgConfidence,
          updatedAt: new Date()
        })
        .where(eq(diagnosisStats.id, existingStats.id))
        .returning();
      
      return updatedStats;
    }
    
    // Create new stats for this disease
    const [newStats] = await db
      .insert(diagnosisStats)
      .values({
        diseaseType,
        count: 1,
        avgConfidence: confidence
      })
      .returning();
    
    return newStats;
  }

  async getTopDiseases(limit: number = 5): Promise<DiagnosisStats[]> {
    return await db
      .select()
      .from(diagnosisStats)
      .orderBy(desc(diagnosisStats.count))
      .limit(limit);
  }
}

// For fallback or testing purposes
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diagnoses: Map<number, Diagnosis>;
  private usernameIndex: Map<string, number>;
  private emailIndex: Map<string, number>;
  private newsletterSubscribers: Set<string>;
  sessionStore: session.Store;
  currentUserId: number;
  currentDiagnosisId: number;

  constructor() {
    this.users = new Map();
    this.diagnoses = new Map();
    this.usernameIndex = new Map();
    this.emailIndex = new Map();
    this.newsletterSubscribers = new Set();
    this.currentUserId = 1;
    this.currentDiagnosisId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const id = this.usernameIndex.get(username);
    if (id === undefined) return undefined;
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const id = this.emailIndex.get(email);
    if (id === undefined) return undefined;
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isPremium: false,
      premiumUntil: null,
      trialStartedAt: null,
      diagnosisCount: 0,
      lastDiagnosisDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: now
    };
    
    this.users.set(id, user);
    this.usernameIndex.set(user.username, id);
    this.emailIndex.set(user.email, id);
    
    return user;
  }

  async updateUserPremiumStatus(userId: number, isPremium: boolean, premiumUntil?: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      isPremium,
      premiumUntil: premiumUntil || null
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeSubscriptionId: subscriptionId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: info.customerId,
      stripeSubscriptionId: info.subscriptionId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async startTrial(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    if (user.isPremium || user.trialStartedAt) {
      return user;
    }
    
    const trialStartedAt = new Date();
    const updatedUser: User = {
      ...user,
      trialStartedAt
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async checkTrialStatus(userId: number): Promise<{ isInTrial: boolean, trialEnded: boolean, daysLeft: number | null }> {
    const user = this.users.get(userId);
    const defaultResult = { isInTrial: false, trialEnded: false, daysLeft: null };
    
    if (!user) return defaultResult;
    if (user.isPremium) return defaultResult;
    if (!user.trialStartedAt) return defaultResult;
    
    const trialStartDate = new Date(user.trialStartedAt);
    const currentDate = new Date();
    
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    const daysLeft = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isInTrial = currentDate < trialEndDate;
    const trialEnded = !!user.trialStartedAt && !isInTrial;
    
    return {
      isInTrial,
      trialEnded,
      daysLeft: isInTrial ? daysLeft : null
    };
  }
  
  async incrementDiagnosisCount(userId: number): Promise<{ canDiagnose: boolean, user: User | undefined }> {
    const user = this.users.get(userId);
    
    if (!user) {
      return { canDiagnose: false, user: undefined };
    }
    
    // Premium users can always diagnose
    if (user.isPremium) {
      const updatedUser: User = {
        ...user,
        diagnosisCount: (user.diagnosisCount || 0) + 1,
        lastDiagnosisDate: new Date()
      };
      
      this.users.set(userId, updatedUser);
      return { canDiagnose: true, user: updatedUser };
    }
    
    // Check trial status
    const { isInTrial } = await this.checkTrialStatus(userId);
    
    // Only users in trial can diagnose without premium
    const canDiagnose = isInTrial;
    
    // Track diagnoses for all users (for analytics purposes)
    const now = new Date();
    
    if (canDiagnose) {
      const updatedUser: User = {
        ...user,
        diagnosisCount: (user.diagnosisCount || 0) + 1,
        lastDiagnosisDate: now
      };
      
      this.users.set(userId, updatedUser);
      return { canDiagnose: true, user: updatedUser };
    }
    
    return { canDiagnose: false, user };
  }
  
  async resetMonthlyDiagnosisCount(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      diagnosisCount: 0
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createDiagnosis(insertDiagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const id = this.currentDiagnosisId++;
    const now = new Date();
    const diagnosis: Diagnosis = {
      ...insertDiagnosis,
      id,
      createdAt: now
    };

    this.diagnoses.set(id, diagnosis);
    return diagnosis;
  }

  async getDiagnosis(id: number): Promise<Diagnosis | undefined> {
    return this.diagnoses.get(id);
  }

  async getDiagnosesByUserId(userId: number): Promise<Diagnosis[]> {
    return Array.from(this.diagnoses.values())
      .filter(diagnosis => diagnosis.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentDiagnosesByUserId(userId: number, limit: number): Promise<Diagnosis[]> {
    return (await this.getDiagnosesByUserId(userId)).slice(0, limit);
  }

  async subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
    this.newsletterSubscribers.add(email);
    const now = new Date();
    
    return {
      id: 1, // In memory implementation, we don't need real IDs
      email,
      createdAt: now
    };
  }

  async isEmailSubscribed(email: string): Promise<boolean> {
    return this.newsletterSubscribers.has(email);
  }
  
  // Analytics methods for in-memory storage (simplified)
  private userActivities: Map<number, UserActivity[]> = new Map();
  private usageMetricsMap: Map<string, UsageMetrics> = new Map(); // userId-date as key
  private diseaseStatsMap: Map<string, DiagnosisStats> = new Map();
  private currentActivityId: number = 1;
  private currentMetricsId: number = 1;
  private currentStatsId: number = 1;
  
  async logUserActivity(userId: number, activityType: string, details?: Record<string, any>): Promise<UserActivity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: UserActivity = {
      id,
      userId,
      activityType,
      details: details || null,
      createdAt: now
    };
    
    const userActivities = this.userActivities.get(userId) || [];
    userActivities.push(activity);
    this.userActivities.set(userId, userActivities);
    
    return activity;
  }
  
  async getUserActivities(userId: number, limit?: number): Promise<UserActivity[]> {
    const activities = this.userActivities.get(userId) || [];
    const sorted = [...activities].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  async getOrCreateUsageMetricsForDate(userId: number, date: Date): Promise<UsageMetrics> {
    // Format date to YYYY-MM-DD for the key
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    const dateString = formattedDate.toISOString().split('T')[0];
    const key = `${userId}-${dateString}`;
    
    if (this.usageMetricsMap.has(key)) {
      return this.usageMetricsMap.get(key)!;
    }
    
    const id = this.currentMetricsId++;
    const now = new Date();
    const metrics: UsageMetrics = {
      id,
      userId,
      date: dateString,
      diagnosisCount: 0,
      loginCount: 0,
      featureUsage: {},
      createdAt: now,
      updatedAt: now
    };
    
    this.usageMetricsMap.set(key, metrics);
    return metrics;
  }
  
  async updateUsageMetrics(
    id: number, 
    updates: Partial<Omit<InsertUsageMetrics, 'id' | 'userId' | 'date'>>
  ): Promise<UsageMetrics> {
    // Find the metrics by id
    let foundMetrics: UsageMetrics | undefined;
    let foundKey: string | undefined;
    
    for (const [key, metrics] of this.usageMetricsMap.entries()) {
      if (metrics.id === id) {
        foundMetrics = metrics;
        foundKey = key;
        break;
      }
    }
    
    if (!foundMetrics || !foundKey) {
      throw new Error(`Metrics with id ${id} not found`);
    }
    
    const updatedMetrics: UsageMetrics = {
      ...foundMetrics,
      ...updates,
      updatedAt: new Date()
    };
    
    this.usageMetricsMap.set(foundKey, updatedMetrics);
    return updatedMetrics;
  }
  
  async getUsageMetricsForUser(
    userId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<UsageMetrics[]> {
    const metrics: UsageMetrics[] = [];
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;
    
    for (const m of this.usageMetricsMap.values()) {
      if (m.userId === userId) {
        const mDateStr = typeof m.date === 'string' ? m.date : (m.date as any).toISOString().split('T')[0];
        if (startDateStr && mDateStr < startDateStr) continue;
        if (endDateStr && mDateStr > endDateStr) continue;
        metrics.push(m);
      }
    }
    
    return metrics.sort((a, b) => {
      const aDateStr = typeof a.date === 'string' ? a.date : (a.date as any).toISOString().split('T')[0];
      const bDateStr = typeof b.date === 'string' ? b.date : (b.date as any).toISOString().split('T')[0];
      return bDateStr.localeCompare(aDateStr); // Newest first
    });
  }
  
  async getOrUpdateDiseaseStats(diseaseType: string, confidence: number): Promise<DiagnosisStats> {
    if (this.diseaseStatsMap.has(diseaseType)) {
      const existingStats = this.diseaseStatsMap.get(diseaseType)!;
      const newCount = existingStats.count + 1;
      const newAvgConfidence = (existingStats.avgConfidence * existingStats.count + confidence) / newCount;
      
      const updatedStats: DiagnosisStats = {
        ...existingStats,
        count: newCount,
        avgConfidence: newAvgConfidence,
        updatedAt: new Date()
      };
      
      this.diseaseStatsMap.set(diseaseType, updatedStats);
      return updatedStats;
    }
    
    const id = this.currentStatsId++;
    const now = new Date();
    const newStats: DiagnosisStats = {
      id,
      diseaseType,
      count: 1,
      avgConfidence: confidence,
      createdAt: now,
      updatedAt: now
    };
    
    this.diseaseStatsMap.set(diseaseType, newStats);
    return newStats;
  }
  
  async getTopDiseases(limit: number = 5): Promise<DiagnosisStats[]> {
    return Array.from(this.diseaseStatsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
