import * as fs from 'fs/promises';
import { loadImage } from 'canvas';
import { analyzePlantImageWithAI } from './openai';

// Map model class names to more user-friendly disease names 
// Enhanced to include a wider variety of plants and diseases
const CLASS_MAPPING: Record<string, string> = {
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

// Disease confidence mapping - updated with expanded range of plants and diseases
const DISEASE_CONFIDENCE: Record<string, number> = {
  // Original confidence values
  "Pepper Bacterial Spot": 0.94,
  "Potato Early Blight": 0.92,
  "Potato Late Blight": 0.93,
  "Tomato Bacterial Spot": 0.91,
  "Tomato Early Blight": 0.90,
  "Tomato Late Blight": 0.93,
  "Tomato Leaf Mold": 0.89,
  "Tomato Septoria Leaf Spot": 0.92,
  "Tomato Spider Mites": 0.88,
  "Tomato Target Spot": 0.87,
  "Tomato Yellow Leaf Curl Virus": 0.95,
  "Tomato Mosaic Virus": 0.92,
  
  // Additional vegetables
  "Cucumber Downy Mildew": 0.90,
  "Cucumber Powdery Mildew": 0.91,
  "Cucumber Angular Leaf Spot": 0.89,
  "Lettuce Downy Mildew": 0.90,
  "Lettuce Drop": 0.88,
  "Spinach Downy Mildew": 0.90,
  "Carrot Leaf Blight": 0.87,
  "Onion Purple Blotch": 0.88,
  "Garlic Rust": 0.88,
  "Broccoli Black Rot": 0.89,
  "Cauliflower Black Rot": 0.89,
  "Cabbage Black Rot": 0.89,
  
  // Cereal crops
  "Corn Northern Leaf Blight": 0.90,
  "Corn Southern Rust": 0.91,
  "Corn Common Rust": 0.91,
  "Wheat Leaf Rust": 0.91,
  "Wheat Stripe Rust": 0.90,
  "Wheat Powdery Mildew": 0.89,
  "Rice Blast": 0.92,
  "Rice Brown Spot": 0.90,
  
  // Legumes
  "Soybean Rust": 0.90,
  "Soybean Bacterial Blight": 0.89,
  "Bean Rust": 0.91,
  "Bean Anthracnose": 0.90,
  
  // Common disease patterns
  "Powdery Mildew": 0.89,
  "Downy Mildew": 0.89,
  "Leaf Spot": 0.87,
  "Anthracnose": 0.88,
  "Bacterial Wilt": 0.88,
  "Rust": 0.90,
  "Viral Infection": 0.82,
  "Nutrient Deficiency": 0.85,
};

// Function to convert image to base64
async function imageToBase64(imagePath: string): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  return imageBuffer.toString('base64');
}

// Analyze plant disease using OpenAI's vision capabilities
export async function analyzePlantDisease(imagePath: string) {
  try {
    // Convert the image to base64
    const base64Image = await imageToBase64(imagePath);
    
    // Use OpenAI's Vision API to analyze the plant image
    const analysisText = await analyzePlantImageWithAI(base64Image);
    
    // Check if the image is not a plant - only check for the special NOT_A_PLANT prefix
    // and a more limited set of phrases that clearly indicate no plant is present
    const isNonPlantImage = 
      analysisText.startsWith('NOT_A_PLANT:') ||
      analysisText.toLowerCase().includes("not a plant") ||
      analysisText.toLowerCase().includes("doesn't contain a plant") ||
      analysisText.toLowerCase().includes("does not contain a plant") ||
      analysisText.toLowerCase().includes("not contain plant") ||
      analysisText.toLowerCase().includes("no plant") ||
      analysisText.toLowerCase().includes("cannot identify any plant") ||
      analysisText.toLowerCase().includes("not see any plant");
      
    // Note: We've removed checks for hands, people, furniture, and other objects
    // since we want to analyze plants even when held by hands or placed on furniture
      
    // Instead of throwing an error, we'll mark non-plant images with a special disease category
    if (isNonPlantImage) {
      // If it's a non-plant image, we'll return a special classifier
      return {
        disease: "Non-Plant Image",
        class: "Non-Plant",
        confidence: 0.99, // High confidence it's not a plant
        analysis: analysisText // Include the full analysis for reference
      };
    }
    
    // Parse the analysis to determine the disease
    // Look for known disease names in the response
    let detectedDisease = "Healthy"; // Default to healthy
    let confidence = 0.85; // Default confidence
    
    // If the response contains uncertainty indicators, set lower confidence
    if (
      analysisText.toLowerCase().includes("cannot make a confident") ||
      analysisText.toLowerCase().includes("uncertain") ||
      analysisText.toLowerCase().includes("not clear enough") ||
      analysisText.toLowerCase().includes("difficult to determine") ||
      analysisText.toLowerCase().includes("cannot provide a confident")
    ) {
      confidence = 0.65; // Lower confidence when uncertainty is expressed
    }
    
    // Check for each disease in the analysis text
    for (const [diseaseKey, friendlyName] of Object.entries(CLASS_MAPPING)) {
      // Skip the "Healthy" entry since it's our default
      if (diseaseKey.includes("Healthy")) continue;
      
      // If the disease is mentioned in the analysis
      if (analysisText.includes(diseaseKey)) {
        detectedDisease = friendlyName;
        confidence = DISEASE_CONFIDENCE[diseaseKey] || 0.89; // Use predefined confidence or default
        break;
      }
    }
    
    // Check for symptoms or diseases in the analysis, even if the plant is labeled as "healthy"
    const symptomIndicators = [
      "spot", "spots", "lesion", "lesions", "chlorosis", "necrosis", "wilting", 
      "yellowing", "browning", "discoloration", "mottling", "stunting", "blight",
      "rot", "mold", "mildew", "rust", "scab", "gall", "deficiency", "deficient",
      "symptom", "symptoms", "infected", "infection", "disease", "canker", "mosaic"
    ];
    
    const hasSymptoms = symptomIndicators.some(indicator => 
      analysisText.toLowerCase().includes(indicator)
    );
    
    // Extract disease information from AI analysis if symptoms are detected
    if (hasSymptoms && detectedDisease === "Healthy") {
      // Look for potential disease descriptions
      const lowerText = analysisText.toLowerCase();
      
      // Try to identify specific disease mentions
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
        // If we detected symptoms but not a specific disease, use a generic disease name
        detectedDisease = "Unidentified Disease";
      }
      
      // Lower confidence for symptom-based detection
      confidence = 0.80;
    }
    // Check for explicitly healthy plants with no symptoms
    else if (detectedDisease === "Healthy" && 
        (analysisText.toLowerCase().includes("healthy") || 
         analysisText.toLowerCase().includes("no disease") ||
         analysisText.toLowerCase().includes("not diseased")) && 
        !hasSymptoms) {
      detectedDisease = "Healthy";
      confidence = 0.93; // High confidence for healthy plants
    }
    
    // Look for plant types to ensure the right plant type is identified
    // Expanded list of plant types to match our enhanced detection capabilities
    const plantTypes = [
      "Tomato", "Potato", "Pepper", 
      "Cucumber", "Lettuce", "Spinach", "Carrot", "Onion", "Garlic",
      "Broccoli", "Cauliflower", "Cabbage",
      "Corn", "Wheat", "Rice",
      "Soybean", "Bean"
    ];
    let plantType = null;
    
    for (const type of plantTypes) {
      if (analysisText.includes(type)) {
        plantType = type;
        break;
      }
    }
    
    // If a plant type was detected but the disease is healthy, use the specific healthy type
    if (plantType && detectedDisease === "Healthy") {
      detectedDisease = `Healthy ${plantType}`;
    }
    
    // If we have a general disease like "Powdery Mildew" but also detected a plant type,
    // make the disease name more specific
    if (plantType && 
        (detectedDisease === "Powdery Mildew" || 
         detectedDisease === "Downy Mildew" || 
         detectedDisease === "Leaf Spot" || 
         detectedDisease === "Anthracnose" || 
         detectedDisease === "Bacterial Wilt" ||
         detectedDisease === "Rust" ||
         detectedDisease === "Viral Infection" ||
         detectedDisease === "Nutrient Deficiency")) {
      detectedDisease = `${plantType} ${detectedDisease}`;
    }
    
    // Make sure the disease name is in our mapping, or default to a generic result
    const finalDiseaseName = CLASS_MAPPING[detectedDisease] || detectedDisease;
    
    return {
      disease: finalDiseaseName,
      class: detectedDisease,
      confidence: confidence,
      analysis: analysisText // Include the full analysis for reference
    };
  } catch (error: any) {
    console.error('Error during image analysis:', error);
    
    // If the error is already a custom error from our code, throw it as is
    if (error.message && typeof error.message === 'string' && (
      error.message.includes("not appear to contain") || 
      error.message.includes("not a plant")
    )) {
      throw error;
    }
    
    // Otherwise, use a generic error message
    throw new Error('Failed to analyze plant image');
  }
}
