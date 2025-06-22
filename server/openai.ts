import OpenAI from "openai";
import { diseaseInfo } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeWithVoiceAssistant(question: string, diseaseContext?: string): Promise<string> {
  try {
    // Prepare system message with disease information if provided
    let systemContent = "You are an expert plant pathologist and agricultural advisor specialized in diagnosing and treating plant diseases. ";
    systemContent += "Provide detailed, accurate, and helpful advice to gardeners and farmers about plant diseases, treatments, and best practices. ";
    systemContent += "Keep your responses clear, practical, and actionable. ";
    
    // If we have context about a specific disease, add it
    if (diseaseContext) {
      const diseaseData = diseaseInfo.find(d => d.name === diseaseContext);
      if (diseaseData) {
        systemContent += `The user is asking about ${diseaseData.name}, which has the following characteristics: `;
        systemContent += `Description: ${diseaseData.description} `;
        systemContent += `Severity: ${diseaseData.severity} `;
        systemContent += `Common treatments include: ${diseaseData.treatments.join(', ')}. `;
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
    console.error('Error with OpenAI voice assistant:', error);
    throw new Error('Failed to generate voice assistant response');
  }
}

export async function analyzePlantImageWithAI(base64Image: string): Promise<string> {
  try {
    // First, detect if the image contains a plant or not - with enhanced plant detection capabilities
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
              text: "Analyze this image and determine if it contains any type of plant matter - including any leaf, vegetable, fruit, plant stem, flower, or plant with disease pigmentation. Be inclusive - if ANY part of the image shows plant material, even if it's partial or being held by hands or alongside other objects like tables, soil, pots, or garden tools, mark is_plant=true. Ignore the presence of hands or other objects and focus only on whether plant material is visible. If you can identify the type of plant, include that in plant_type. Respond with structured JSON: {\"is_plant\": boolean, \"contains_non_plant_objects\": boolean, \"plant_type\": \"specific plant type or 'unknown' if uncertain\", \"explanation\": \"your detailed reasoning here\"}."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.2, // Lower temperature for more consistent, deterministic output
      response_format: { type: "json_object" }
    });
    
    let plantDetectionResult;
    try {
      const content = plantDetectionResponse.choices[0].message.content || '{"is_plant": false, "contains_non_plant_objects": true, "explanation": "Failed to analyze image"}';
      plantDetectionResult = JSON.parse(content);
      console.log("Plant detection result:", JSON.stringify(plantDetectionResult, null, 2));
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      plantDetectionResult = { 
        is_plant: false, 
        contains_non_plant_objects: true, 
        explanation: "Error parsing detection result" 
      };
    }
    
    // Only return NOT_A_PLANT if there's no plant in the image at all
    if (!plantDetectionResult.is_plant) {
      const explanation = plantDetectionResult.explanation || "The image does not appear to contain plant leaves";
      let prefix = "NOT_A_PLANT: ";
      return `${prefix}${explanation}`;
    }
    
    // If it contains a plant (even with other objects like hands), proceed with analysis
    
    // If it is a plant, proceed with enhanced disease analysis for a wider range of plants
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
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more precise analysis
    });

    return visionResponse.choices[0].message.content || "I couldn't analyze the image properly.";
  } catch (error) {
    console.error('Error with OpenAI image analysis:', error);
    throw new Error('Failed to analyze image with AI');
  }
}
