import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzePlantDisease } from "./plantDiseaseModel";
import { diseaseInfo } from "@shared/schema";
import { newsletterSubscriptionSchema } from "../shared/newsletter-schema";
import multer from "multer";
import path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { analyzeWithVoiceAssistant, analyzePlantImageWithAI } from "./openai";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Stripe payment functionality will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept all image formats
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  // Upload and analyze plant image
  app.post('/api/diagnose', upload.single('image'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }

      const userId = req.user.id;
      
      // Increment the diagnosis count and check if the user can make a diagnosis
      const { canDiagnose, user } = await storage.incrementDiagnosisCount(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If the user is not premium and cannot diagnose
      if (!canDiagnose) {
        // Check if user is in trial period
        const { isInTrial, daysLeft, trialEnded } = await storage.checkTrialStatus(userId);
        
        // If not in trial, offer to start trial or upgrade
        if (!isInTrial) {
          // Check if trial has been used before
          if (user.trialStartedAt) {
            return res.status(403).json({ 
              message: 'Your trial period has ended. Upgrade to Premium for unlimited diagnoses.',
              error: 'TRIAL_ENDED',
              trialUsed: true
            });
          } else {
            return res.status(403).json({ 
              message: 'Start your 30-day free trial to diagnose plant diseases or upgrade to Premium for unlimited access.',
              error: 'NO_ACCESS',
              canStartTrial: true
            });
          }
        } else {
          // This shouldn't happen as trial users should have canDiagnose=true,
          // but just in case there's a logic error
          return res.status(403).json({ 
            message: `You are currently in your trial period with ${daysLeft} days remaining.`,
            error: 'TRIAL_ACTIVE',
            trialDaysLeft: daysLeft
          });
        }
      }

      const imagePath = req.file.path;
      const imageUrl = `/uploads/${req.file.filename}`;

      // Analyze the image using OpenAI
      // Convert image to base64 for advanced AI analysis
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // First use OpenAI for enhanced analysis to identify all types of plants
      let plantAnalysis;
      let plantType = "Unknown";
      try {
        plantAnalysis = await analyzePlantImageWithAI(base64Image);
        console.log("Enhanced AI analysis result:", plantAnalysis);
        
        // Try to determine the plant type from the AI response
        const plantTypeMatch = plantAnalysis.match(/(?:This is|I identify this as|The plant is|This appears to be)(?: a)? ([\w\s-]+?)(?:plant| leaf| stem| flower|\.|,)/i);
        
        if (plantTypeMatch && plantTypeMatch[1]) {
          plantType = plantTypeMatch[1].trim();
        } else {
          // Try alternative patterns for plant type
          const altPlantMatch = plantAnalysis.match(/(?:The image shows|This image contains|In the image|identifies as)(?: a)? ([\w\s-]+?)(?:plant| leaf| stem| flower|\.|,)/i);
          if (altPlantMatch) {
            plantType = altPlantMatch[1].trim();
          }
        }
        
        // Format plant type (capitalize first letter of each word)
        plantType = plantType.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      } catch (error) {
        console.error("Error with OpenAI analysis:", error);
        // Fallback to traditional analysis if OpenAI fails
      }
      
      // Also get traditional analysis as a backup
      const analysisResult = await analyzePlantDisease(imagePath);
      
      // Generate custom treatments based on the AI analysis
      let diseaseData;
      let treatmentsFromAI = [];
      let severityFromAI = "Medium";
      let descriptionFromAI = "";
      let diseaseName = analysisResult.disease;
      
      // If we have plant analysis from OpenAI, extract the disease name
      if (plantAnalysis) {
        // Try multiple patterns to extract the disease name from AI analysis
        let diseaseMatch = plantAnalysis.match(/(?:I identify|I detect|appears to be|suffering from|affected by|shows symptoms of|diagnosed with) ([\w\s-]+)(?: disease| infection| virus| bacteria)?/i);
        
        if (!diseaseMatch) {
          // Try to match "disease known as X" pattern
          diseaseMatch = plantAnalysis.match(/disease(?:s)? known as ([^\.]+)/i);
        }
        
        if (!diseaseMatch) {
          // Try to find direct disease mentions
          for (const possibleDisease of ["leaf curl", "powdery mildew", "downy mildew", "leaf spot", "blight", "rust", "mosaic virus", "anthracnose", "bacterial wilt", "leaf miners", "fire blight"]) {
            if (plantAnalysis.toLowerCase().includes(possibleDisease)) {
              diseaseMatch = [null, possibleDisease];
              break;
            }
          }
        }
        
        if (diseaseMatch && diseaseMatch[1]) {
          diseaseName = diseaseMatch[1].trim();
          // Format disease name (capitalize first letter of each word)
          diseaseName = diseaseName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        // If it's healthy, mark it as such
        if (plantAnalysis.toLowerCase().includes("healthy") && !plantAnalysis.toLowerCase().includes("not healthy")) {
          diseaseName = "Healthy";
        }
        
        // If we still have "Unidentified Disease", try to extract from entire AI analysis
        if (diseaseName.includes("Unidentified")) {
          // Additional fallback detection patterns
          const additionalPatterns = [
            /identified as ([^\.]+)/i,
            /diagnosed as ([^\.]+)/i,
            /suffering from ([^\.]+)/i,
            /affected by ([^\.]+)/i,
            /infected with ([^\.]+)/i,
          ];
          
          for (const pattern of additionalPatterns) {
            const match = plantAnalysis.match(pattern);
            if (match && match[1]) {
              diseaseName = match[1].trim()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              break;
            }
          }
        }
      }
      
      // First, check if this is a known disease in our database
      diseaseData = diseaseInfo.find(d => d.name === diseaseName);
      
      // If direct match not found, try to match based on keywords
      if (!diseaseData) {
        diseaseData = diseaseInfo.find(d => 
          diseaseName.toLowerCase().includes(d.name.toLowerCase()) || 
          d.name.toLowerCase().includes(diseaseName.toLowerCase())
        );
      }
      
      // If the disease is not in our database or it's an "Unidentified Disease", 
      // generate custom treatments based on the AI analysis
      if (!diseaseData || analysisResult.disease.includes("Unidentified") || 
          (analysisResult.analysis.toLowerCase().includes("symptom") && !analysisResult.disease.includes("Healthy"))) {
        const aiAnalysis = analysisResult.analysis;
        
        // Determine severity based on symptom descriptions
        if (aiAnalysis.toLowerCase().includes("severe") || 
            aiAnalysis.toLowerCase().includes("advanced") ||
            aiAnalysis.toLowerCase().includes("widespread")) {
          severityFromAI = "High";
        } else if (aiAnalysis.toLowerCase().includes("mild") || 
                  aiAnalysis.toLowerCase().includes("early stage") ||
                  aiAnalysis.toLowerCase().includes("beginning")) {
          severityFromAI = "Low";
        } else {
          severityFromAI = "Medium";
        }
        
        // Generate custom treatments based on detected disease or symptoms
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
        } else if (aiAnalysis.toLowerCase().includes("spot") || 
                  aiAnalysis.toLowerCase().includes("lesion") || 
                  aiAnalysis.toLowerCase().includes("discolor")) {
          // Generic treatments for spotted/lesioned leaves
          treatmentsFromAI = [
            "Remove affected parts of the plant",
            "Improve air circulation around plants",
            "Avoid overhead watering",
            "Apply appropriate fungicide for the symptoms observed",
            "Consider a broad-spectrum organic treatment like neem oil"
          ];
          descriptionFromAI = "The spotted pattern on the leaves suggests a fungal or bacterial infection. These pathogens typically thrive in humid conditions and may spread through water or contact.";
        } else {
          // Generic treatments for unidentified issues
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
      
      // If we still don't have data and it's not explicitly a symptom-based diagnosis,
      // try to use generic healthy condition
      if (!diseaseData && !treatmentsFromAI.length) {
        diseaseData = diseaseInfo.find(d => d.name === "Healthy");
      }
      
      // If still no match and no AI-generated treatments, return error
      if (!diseaseData && !treatmentsFromAI.length) {
        return res.status(500).json({ message: 'Failed to match disease data or generate treatments' });
      }

      // Choose whether to use database info or AI-generated info
      const description = treatmentsFromAI.length > 0 ? descriptionFromAI : diseaseData.description;
      const severity = treatmentsFromAI.length > 0 ? severityFromAI : diseaseData.severity;
      const treatments = treatmentsFromAI.length > 0 ? treatmentsFromAI : diseaseData.treatments;

      // Enhanced description combining AI analysis with either database info or AI-generated info
      const enhancedDescription = `AI Analysis: ${analysisResult.analysis}\n\nDatabase Description: ${description}`;
      
      // For non-plant images, the disease name will explicitly say "Non-Plant Image"
      // In this case, we'll use custom content for database info and treatments
      if (analysisResult.disease === "Non-Plant Image") {
        // Custom description and treatments for non-plant images
        const enhancedDescription = `AI Analysis: ${analysisResult.analysis}\n\nDatabase Description: This is not a plant image. Our system works best with clear, close-up photos of tomato, potato, or pepper plant leaves.`;
        
        const treatments = [
          "Please upload a clear image of tomato, potato, or pepper plant leaves",
          "Ensure good lighting when taking photos of plants",
          "Position the camera close to the leaf to capture details",
          "Try to include only the plant in the frame",
          "Avoid uploading non-plant images for diagnosis"
        ];
        
        // Create a special diagnosis record for the non-plant image
        const diagnosis = await storage.createDiagnosis({
          userId,
          imageUrl,
          disease: "Non-Plant Image",
          confidence: analysisResult.confidence,
          severity: "Not Applicable",
          description: enhancedDescription,
          treatments: treatments,
          metadata: {
            plantType: "None",
            aiAnalysis: plantAnalysis ? true : false,
            aiModel: "gpt-4o"
          }
        });
        
        // Track disease statistics for non-plant images too
        await storage.getOrUpdateDiseaseStats("Non-Plant Image", analysisResult.confidence);
        
        // Track user activity
        await storage.logUserActivity(userId, 'NON_PLANT_IMAGE_UPLOADED', {
          diagnosisId: diagnosis.id,
          confidence: analysisResult.confidence
        });
        
        // Update usage metrics
        const today = new Date();
        const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
        
        // Update feature usage information
        const featureUsage = metrics.featureUsage || {};
        
        // Track non-plant image uploads
        if (!featureUsage.nonPlantImages) {
          featureUsage.nonPlantImages = 1;
        } else {
          featureUsage.nonPlantImages++;
        }
        
        // Track confidence levels in metrics
        if (!featureUsage.confidenceLevels) {
          featureUsage.confidenceLevels = {
            low: 0,
            medium: 0,
            high: 0
          };
        }
        
        // Categorize confidence
        const confidenceLevel = 
          analysisResult.confidence < 0.4 ? 'low' : 
          analysisResult.confidence < 0.7 ? 'medium' : 'high';
        
        featureUsage.confidenceLevels[confidenceLevel]++;
        
        await storage.updateUsageMetrics(metrics.id, {
          diagnosisCount: metrics.diagnosisCount + 1,
          featureUsage
        });
        
        res.status(200).json(diagnosis);
        return; // Return early to skip the regular plant disease logic
      }
      
      // Create diagnosis record with either database info or AI-generated treatments
      const diagnosis = await storage.createDiagnosis({
        userId,
        imageUrl,
        disease: diseaseName || analysisResult.disease,
        confidence: analysisResult.confidence,
        severity: severity,
        description: enhancedDescription,
        treatments: treatments,
        metadata: {
          plantType: plantType || 'Unknown',
          aiAnalysis: plantAnalysis ? true : false,
          aiModel: "gpt-4o"
        }
      });
      
      // Track disease statistics
      await storage.getOrUpdateDiseaseStats(analysisResult.disease, analysisResult.confidence);
      
      // Track user activity
      await storage.logUserActivity(userId, 'DIAGNOSIS_CREATED', {
        diagnosisId: diagnosis.id,
        disease: analysisResult.disease,
        confidence: analysisResult.confidence
      });
      
      // Update usage metrics
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      
      // Update feature usage information
      const featureUsage = metrics.featureUsage || {};
      
      // Track disease types in metrics
      if (!featureUsage.diseaseTypes) {
        featureUsage.diseaseTypes = {};
      }
      
      if (!featureUsage.diseaseTypes[analysisResult.disease]) {
        featureUsage.diseaseTypes[analysisResult.disease] = 1;
      } else {
        featureUsage.diseaseTypes[analysisResult.disease]++;
      }
      
      // Track confidence levels in metrics
      if (!featureUsage.confidenceLevels) {
        featureUsage.confidenceLevels = {
          low: 0,
          medium: 0,
          high: 0
        };
      }
      
      // Categorize confidence
      const confidenceLevel = 
        analysisResult.confidence < 0.4 ? 'low' : 
        analysisResult.confidence < 0.7 ? 'medium' : 'high';
      
      featureUsage.confidenceLevels[confidenceLevel]++;
      
      await storage.updateUsageMetrics(metrics.id, {
        diagnosisCount: metrics.diagnosisCount + 1,
        featureUsage
      });

      res.status(200).json(diagnosis);
    } catch (error) {
      console.error('Error during diagnosis:', error);
      res.status(500).json({ message: 'Failed to process diagnosis' });
    }
  });

  // Get diagnosis history for user
  app.get('/api/diagnoses', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const userId = req.user.id;
      const diagnoses = await storage.getDiagnosesByUserId(userId);
      
      // Track history viewing
      await storage.logUserActivity(userId, 'DIAGNOSIS_HISTORY_VIEWED', {
        diagnosisCount: diagnoses.length
      });
      
      // Update metrics for history views
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Track history views
      if (!featureUsage.historyViews) {
        featureUsage.historyViews = 1;
      } else {
        featureUsage.historyViews++;
      }
      
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      
      res.status(200).json(diagnoses);
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      res.status(500).json({ message: 'Failed to fetch diagnoses' });
    }
  });

  // Get recent diagnoses for user (limit to N results)
  app.get('/api/diagnoses/recent', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      const diagnoses = await storage.getRecentDiagnosesByUserId(userId, limit);
      
      // Track recent diagnoses viewing
      await storage.logUserActivity(userId, 'RECENT_DIAGNOSES_VIEWED', {
        limit,
        diagnosisCount: diagnoses.length
      });
      
      // Update metrics for recent diagnoses views
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Track recent diagnoses views
      if (!featureUsage.recentDiagnosesViews) {
        featureUsage.recentDiagnosesViews = 1;
      } else {
        featureUsage.recentDiagnosesViews++;
      }
      
      await storage.updateUsageMetrics(metrics.id, { featureUsage });
      
      res.status(200).json(diagnoses);
    } catch (error) {
      console.error('Error fetching recent diagnoses:', error);
      res.status(500).json({ message: 'Failed to fetch recent diagnoses' });
    }
  });

  // Get specific diagnosis by ID
  app.get('/api/diagnoses/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const diagnosisId = parseInt(req.params.id);
      const diagnosis = await storage.getDiagnosis(diagnosisId);
      
      if (!diagnosis) {
        return res.status(404).json({ message: 'Diagnosis not found' });
      }

      // Check if the diagnosis belongs to the user
      if (diagnosis.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Track diagnosis view
      await storage.logUserActivity(req.user.id, 'DIAGNOSIS_VIEWED', {
        diagnosisId: diagnosis.id,
        disease: diagnosis.disease
      });
      
      // Update metrics for diagnosis views
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(req.user.id, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Track diagnosis views
      if (!featureUsage.diagnosisViews) {
        featureUsage.diagnosisViews = 1;
      } else {
        featureUsage.diagnosisViews++;
      }
      
      // Track which diseases are most viewed
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
      console.error('Error fetching diagnosis:', error);
      res.status(500).json({ message: 'Failed to fetch diagnosis' });
    }
  });

  // Create a Stripe payment intent for subscription
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not properly configured' });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        // Create new customer in Stripe
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: userId.toString()
          }
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(userId, customerId);
      }
      
      // Create a payment intent (for one-time payment of 1-month premium)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500, // $5.00 in cents
        currency: 'usd',
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          type: 'premium_payment',
          plan: 'monthly',
          description: 'Plant Health AI Premium - 1 month'
        }
      });
      
      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Create a Stripe subscription
  app.post('/api/create-subscription', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not properly configured' });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If user already has a subscription, return the details
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          if (subscription.status === 'active') {
            return res.status(200).json({
              message: 'Subscription already active',
              subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              }
            });
          }
        } catch (err) {
          // If the subscription doesn't exist anymore, continue to create a new one
          console.warn('Failed to retrieve subscription, creating new one', err);
        }
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        // Create new customer in Stripe
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: userId.toString()
          }
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(userId, customerId);
      }
      
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            // Using a predefined price for the premium subscription
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Plant Health AI Premium Subscription',
                description: 'Unlimited diagnoses and premium features',
              },
              unit_amount: 500, // $5.00 per month
              recurring: {
                interval: 'month',
              },
            },
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user with subscription ID
      await storage.updateStripeSubscriptionId(userId, subscription.id);
      
      // Use a subscription, set user as premium
      const premiumUntil = new Date((subscription.current_period_end as number) * 1000);
      const updatedUser = await storage.updateUserPremiumStatus(userId, true, premiumUntil);
      
      // Track subscription creation
      await storage.logUserActivity(userId, 'PREMIUM_SUBSCRIPTION_CREATED', {
        subscriptionId: subscription.id,
        premiumUntil: premiumUntil
      });
      
      // Return the client secret for the subscription's invoice payment intent
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      res.status(200).json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret
      });
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Update user's premium status after successful payment
  app.post('/api/subscription/confirm', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const userId = req.user.id;
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment intent ID is required' });
      }
      
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not properly configured' });
      }
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: 'Payment has not been completed',
          paymentStatus: paymentIntent.status
        });
      }
      
      // Set premium expiration to 30 days from now for one-time payment
      // For subscriptions, this would be handled by the webhook
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 30);
      
      const updatedUser = await storage.updateUserPremiumStatus(userId, true, premiumUntil);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Track premium subscription
      await storage.logUserActivity(userId, 'PREMIUM_SUBSCRIPTION_ACTIVATED', {
        paymentIntentId,
        premiumUntil: premiumUntil
      });
      
      res.status(200).json({
        isPremium: updatedUser.isPremium,
        premiumUntil: updatedUser.premiumUntil
      });
    } catch (error) {
      console.error('Error confirming subscription payment:', error);
      res.status(500).json({ message: 'Failed to confirm subscription payment' });
    }
  });
  
  // Start 30-day trial
  app.post('/api/trial/start', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      
      // Check if user is eligible for trial
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If user is already premium, no need for trial
      if (user.isPremium) {
        return res.status(400).json({ 
          message: 'You already have premium access',
          isPremium: true 
        });
      }
      
      // If user already started trial, return trial status
      if (user.trialStartedAt) {
        const { isInTrial, trialEnded, daysLeft } = await storage.checkTrialStatus(userId);
        
        if (isInTrial) {
          return res.status(400).json({ 
            message: `You are already in your 30-day trial period. ${daysLeft} days remaining.`,
            isInTrial: true,
            daysLeft
          });
        } else if (trialEnded) {
          return res.status(400).json({ 
            message: 'Your trial period has ended. Please upgrade to premium for full access.',
            trialEnded: true
          });
        }
      }
      
      // Start the trial
      const updatedUser = await storage.startTrial(userId);
      
      // Check trial status to get days left
      const { daysLeft } = await storage.checkTrialStatus(userId);
      
      // Track trial activation
      await storage.logUserActivity(userId, 'TRIAL_STARTED', {
        daysLeft: daysLeft
      });
      
      return res.status(200).json({ 
        message: 'Your 30-day trial has started!',
        user: updatedUser,
        daysLeft
      });
      
    } catch (error) {
      console.error('Error starting trial:', error);
      res.status(500).json({ message: 'Failed to start trial' });
    }
  });
  
  // Get trial status
  app.get('/api/trial/status', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const trialStatus = await storage.checkTrialStatus(userId);
      
      return res.status(200).json(trialStatus);
    } catch (error) {
      console.error('Error checking trial status:', error);
      res.status(500).json({ message: 'Failed to check trial status' });
    }
  });

  // Voice assistant API (Premium or trial feature)
  app.post('/api/voice-assistant', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = req.user;
      const userId = user.id;
      
      // Check if user is premium
      if (!user.isPremium) {
        // Check if user is in trial period
        const { isInTrial, trialEnded } = await storage.checkTrialStatus(userId);
        
        // If not premium and not in trial, deny access
        if (!isInTrial) {
          if (trialEnded) {
            return res.status(403).json({ 
              message: 'Your trial has ended. Upgrade to Premium to continue using the voice assistant.',
              error: 'TRIAL_ENDED'
            });
          } else {
            return res.status(403).json({ 
              message: 'Premium subscription or active trial required for voice assistant.',
              error: 'PREMIUM_REQUIRED'
            });
          }
        }
        // If in trial, continue to allow access
      }

      const { question, diseaseContext } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }

      const response = await analyzeWithVoiceAssistant(question, diseaseContext);
      
      // Track voice assistant usage
      await storage.logUserActivity(userId, 'VOICE_ASSISTANT_USED', {
        diseaseContext: diseaseContext || null,
        questionLength: question.length
      });
      
      // Update feature usage metrics
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Initialize or increment voice assistant count
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
      console.error('Error with voice assistant:', error);
      res.status(500).json({ message: 'Failed to process with voice assistant' });
    }
  });

  // Subscribe to newsletter
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const result = newsletterSubscriptionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Invalid email format',
          errors: result.error.flatten().fieldErrors 
        });
      }
      
      const { email } = result.data;
      
      // Check if email is already subscribed
      const isSubscribed = await storage.isEmailSubscribed(email);
      if (isSubscribed) {
        return res.status(200).json({ 
          message: 'Email already subscribed',
          alreadySubscribed: true
        });
      }
      
      // Add email to subscribers
      const subscriber = await storage.subscribeToNewsletter(email);
      
      // Track newsletter subscription
      // If user is logged in, associate the subscription with their account
      if (req.isAuthenticated()) {
        await storage.logUserActivity(req.user.id, 'NEWSLETTER_SUBSCRIBED', {
          email
        });
      }
      
      res.status(201).json({ 
        message: 'Successfully subscribed to newsletter'
      });
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      res.status(500).json({ message: 'Failed to subscribe to newsletter' });
    }
  });
  
  // --- Analytics and History API Routes ---
  
  // Get user activity history - premium only
  app.get('/api/analytics/activities', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Check if user is premium or in trial
      if (!req.user.isPremium) {
        // Check if in trial period
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({ 
            message: 'Analytics are only available for premium users',
            error: 'PREMIUM_REQUIRED'
          });
        }
      }
      
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getUserActivities(userId, limit);
      
      // Track activity history viewing
      await storage.logUserActivity(userId, 'ANALYTICS_ACTIVITY_VIEWED', {
        limit
      });
      
      // Update metrics for analytics views
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Track activity analytics views
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
      console.error('Error fetching user activities:', error);
      res.status(500).json({ message: 'Failed to fetch user activities' });
    }
  });
  
  // Get usage metrics - premium only
  app.get('/api/analytics/usage', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Check if user is premium or in trial
      if (!req.user.isPremium) {
        // Check if in trial period
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({ 
            message: 'Analytics are only available for premium users',
            error: 'PREMIUM_REQUIRED'
          });
        }
      }
      
      const userId = req.user.id;
      
      // Parse date parameters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const metrics = await storage.getUsageMetricsForUser(userId, startDate, endDate);
      
      // Track usage metrics viewing
      await storage.logUserActivity(userId, 'ANALYTICS_USAGE_VIEWED', {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null
      });
      
      // Update metrics for analytics views
      const today = new Date();
      const usageMetrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = usageMetrics.featureUsage || {};
      
      // Track usage analytics views
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
      
      await storage.updateUsageMetrics(usageMetrics.id, { featureUsage });
      
      res.status(200).json(metrics);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      res.status(500).json({ message: 'Failed to fetch usage metrics' });
    }
  });
  
  // Same endpoint with a different URL for client compatibility
  app.get('/api/analytics/metrics', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Check if user is premium or in trial
      if (!req.user.isPremium) {
        // Check if in trial period
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({ 
            message: 'Analytics are only available for premium users',
            error: 'PREMIUM_REQUIRED'
          });
        }
      }
      
      const userId = req.user.id;
      
      // Parse date parameters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const metrics = await storage.getUsageMetricsForUser(userId, startDate, endDate);
      
      // Track usage metrics viewing
      await storage.logUserActivity(userId, 'ANALYTICS_USAGE_VIEWED', {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null
      });
      
      // Update metrics for analytics views
      const today = new Date();
      const usageMetrics = await storage.getOrCreateUsageMetricsForDate(userId, today);
      const featureUsage = usageMetrics.featureUsage || {};
      
      // Track usage analytics views
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
      
      await storage.updateUsageMetrics(usageMetrics.id, { featureUsage });
      
      res.status(200).json(metrics);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      res.status(500).json({ message: 'Failed to fetch usage metrics' });
    }
  });
  
  // Get disease statistics - premium only
  app.get('/api/analytics/disease-stats', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Check if user is premium or in trial
      if (!req.user.isPremium) {
        // Check if in trial period
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({ 
            message: 'Analytics are only available for premium users',
            error: 'PREMIUM_REQUIRED'
          });
        }
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const topDiseases = await storage.getTopDiseases(limit);
      
      // Track disease stats viewing
      await storage.logUserActivity(req.user.id, 'ANALYTICS_DISEASE_STATS_VIEWED', {
        limit
      });
      
      // Update metrics for analytics views
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(req.user.id, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Track disease stats analytics views
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
      console.error('Error fetching disease statistics:', error);
      res.status(500).json({ message: 'Failed to fetch disease statistics' });
    }
  });
  
  // Same endpoint but with different URL for better client matching
  app.get('/api/analytics/top-diseases', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Check if user is premium or in trial
      if (!req.user.isPremium) {
        // Check if in trial period
        const { isInTrial } = await storage.checkTrialStatus(req.user.id);
        if (!isInTrial) {
          return res.status(403).json({ 
            message: 'Analytics are only available for premium users',
            error: 'PREMIUM_REQUIRED'
          });
        }
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const topDiseases = await storage.getTopDiseases(limit);
      
      // Track disease stats viewing
      await storage.logUserActivity(req.user.id, 'ANALYTICS_DISEASE_STATS_VIEWED', {
        limit
      });
      
      // Update metrics for analytics views
      const today = new Date();
      const metrics = await storage.getOrCreateUsageMetricsForDate(req.user.id, today);
      const featureUsage = metrics.featureUsage || {};
      
      // Track disease stats analytics views
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
      console.error('Error fetching disease statistics:', error);
      res.status(500).json({ message: 'Failed to fetch disease statistics' });
    }
  });
  
  // Log user activity
  app.post('/api/analytics/log-activity', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = req.user.id;
      const { activityType, details } = req.body;
      
      if (!activityType) {
        return res.status(400).json({ message: 'Activity type is required' });
      }
      
      const activity = await storage.logUserActivity(userId, activityType, details);
      
      res.status(201).json(activity);
    } catch (error) {
      console.error('Error logging user activity:', error);
      res.status(500).json({ message: 'Failed to log user activity' });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not properly configured' });
    }

    // This is the raw request body as a Buffer
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    // In production, you would set this in your environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // Verify the event with the webhook secret
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      // For development only, without signature verification
      try {
        event = JSON.parse(payload);
      } catch (err) {
        console.error(`Webhook payload parsing failed: ${err.message}`);
        return res.status(400).send(`Webhook payload parsing failed: ${err.message}`);
      }
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment intent ${paymentIntent.id} succeeded`);
        
        // If this payment was for a subscription, handle it
        if (paymentIntent.metadata && paymentIntent.metadata.type === 'subscription_payment') {
          const userId = parseInt(paymentIntent.metadata.userId);
          if (userId) {
            // Set premium status
            const premiumUntil = new Date();
            premiumUntil.setDate(premiumUntil.getDate() + 30); // 30 days for one-time payment
            await storage.updateUserPremiumStatus(userId, true, premiumUntil);
            
            // Log activity
            await storage.logUserActivity(userId, 'PAYMENT_INTENT_SUCCEEDED', {
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount / 100 // Convert cents to dollars
            });
          }
        }
        break;
        
      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object;
        console.log(`Subscription ${subscriptionCreated.id} created`);
        break;
        
      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object;
        console.log(`Subscription ${subscriptionUpdated.id} updated`);
        
        // Find user by Stripe customer ID
        const customerInUpdated = await stripe.customers.retrieve(subscriptionUpdated.customer as string);
        if (customerInUpdated.metadata && customerInUpdated.metadata.userId) {
          const userId = parseInt(customerInUpdated.metadata.userId);
          
          // If subscription is active, update premium status
          if (subscriptionUpdated.status === 'active') {
            const premiumUntil = new Date(subscriptionUpdated.current_period_end * 1000);
            await storage.updateUserPremiumStatus(userId, true, premiumUntil);
            
            // Log activity
            await storage.logUserActivity(userId, 'SUBSCRIPTION_RENEWED', {
              subscriptionId: subscriptionUpdated.id,
              premiumUntil: premiumUntil
            });
          } else if (subscriptionUpdated.status === 'canceled' || 
                    subscriptionUpdated.status === 'unpaid' || 
                    subscriptionUpdated.status === 'incomplete_expired') {
            // Handle canceled, unpaid, or incomplete_expired subscriptions
            // Optionally keep premium until the end of the current period
            await storage.updateUserPremiumStatus(userId, false, null);
            
            // Log activity
            await storage.logUserActivity(userId, 'SUBSCRIPTION_ENDED', {
              subscriptionId: subscriptionUpdated.id,
              reason: subscriptionUpdated.status
            });
          }
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log(`Invoice ${invoice.id} payment succeeded`);
        
        // If this invoice has a subscription, update premium status
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          
          if (customer.metadata && customer.metadata.userId) {
            const userId = parseInt(customer.metadata.userId);
            const premiumUntil = new Date(subscription.current_period_end * 1000);
            await storage.updateUserPremiumStatus(userId, true, premiumUntil);
            
            // Log activity
            await storage.logUserActivity(userId, 'SUBSCRIPTION_PAYMENT_SUCCEEDED', {
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              premiumUntil: premiumUntil
            });
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log(`Invoice ${failedInvoice.id} payment failed`);
        
        // Optionally notify user about payment failure
        if (failedInvoice.customer) {
          const customer = await stripe.customers.retrieve(failedInvoice.customer as string);
          if (customer.metadata && customer.metadata.userId) {
            const userId = parseInt(customer.metadata.userId);
            
            // Log activity
            await storage.logUserActivity(userId, 'SUBSCRIPTION_PAYMENT_FAILED', {
              invoiceId: failedInvoice.id
            });
          }
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  });

  // Serve uploaded images
  app.use('/uploads', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
  }, (req, res, next) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    res.sendFile(path.join(uploadDir, path.basename(req.url)), err => {
      if (err) next(err);
    });
  });

  // Add a testing endpoint to remove premium status (for development only)
  app.post("/api/reset-premium-status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const updatedUser = await storage.updateUserPremiumStatus(userId, false);
      
      if (updatedUser) {
        res.json({ success: true, message: "Premium status reset", user: updatedUser });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
