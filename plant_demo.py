#!/usr/bin/env python3
"""
Plant Disease Detection Demo using OpenAI Vision API
This demo works without requiring dataset download or model training
"""

import os
import base64
import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import openai
from pathlib import Path
import argparse
from dotenv import load_dotenv
load_dotenv()

# Set up OpenAI client
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class PlantDiseaseDemo:
    def __init__(self):
        self.results_dir = Path("demo_results")
        self.results_dir.mkdir(exist_ok=True)
    
    def encode_image_to_base64(self, image_path):
        """Convert image file to base64 string"""
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None
    
    def analyze_plant_with_vision(self, image_path):
        """
        Part 2: Prediction Function using OpenAI Vision API
        Analyzes plant image and identifies disease
        """
        print("Analyzing plant image with AI...")
        
        # Encode image
        base64_image = self.encode_image_to_base64(image_path)
        if not base64_image:
            return None
        
        try:
            # First, detect if image contains a plant and identify the disease
            response = client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert plant pathologist. Analyze plant images to identify the plant type and any diseases present."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Analyze this plant image and provide:
1. Plant type (e.g., Tomato, Potato, Pepper, etc.)
2. Disease name if any (be specific, e.g., "Early Blight", "Late Blight", "Bacterial Spot")
3. Confidence level (High/Medium/Low)
4. Key visual symptoms observed

Format your response as:
Plant: [plant type]
Disease: [disease name or "Healthy"]
Confidence: [High/Medium/Low]
Symptoms: [description of visual symptoms]"""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ],
                    },
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            analysis = response.choices[0].message.content
            print("AI Analysis Complete!")
            return self.parse_analysis(analysis)
            
        except Exception as e:
            print(f"Error during AI analysis: {e}")
            return None
    
    def parse_analysis(self, analysis_text):
        """Parse the structured analysis response"""
        try:
            lines = analysis_text.split('\n')
            result = {}
            
            for line in lines:
                if line.startswith('Plant:'):
                    result['plant_type'] = line.replace('Plant:', '').strip()
                elif line.startswith('Disease:'):
                    result['disease'] = line.replace('Disease:', '').strip()
                elif line.startswith('Confidence:'):
                    result['confidence'] = line.replace('Confidence:', '').strip()
                elif line.startswith('Symptoms:'):
                    result['symptoms'] = line.replace('Symptoms:', '').strip()
            
            # Set defaults if parsing fails
            result.setdefault('plant_type', 'Unknown Plant')
            result.setdefault('disease', 'Unable to determine')
            result.setdefault('confidence', 'Medium')
            result.setdefault('symptoms', 'Analysis incomplete')
            
            return result
            
        except Exception as e:
            print(f"Error parsing analysis: {e}")
            return {
                'plant_type': 'Unknown Plant',
                'disease': 'Analysis failed',
                'confidence': 'Low',
                'symptoms': 'Unable to analyze'
            }
    
    def get_treatment_advice(self, plant_type, disease):
        """
        Part 3: GPT Integration
        Get comprehensive treatment advice from agricultural expert
        """
        print("Getting expert treatment advice...")
        
        if disease.lower() == 'healthy':
            prompt = f"""The {plant_type} plant appears healthy. Provide preventive care advice including:
1. Optimal growing conditions
2. Preventive measures for common diseases
3. Nutrition and watering guidelines
4. Monitoring tips for early disease detection"""
        else:
            prompt = f"""A {plant_type} plant has been diagnosed with {disease}. Provide comprehensive treatment advice including:

1. Disease Overview: What is {disease} and what causes it?
2. Organic Treatment Methods: Natural and eco-friendly solutions
3. Non-Organic Treatment Methods: Chemical treatments and fungicides
4. Prevention Strategies: How to prevent future occurrences
5. Timeline: Expected recovery time and treatment schedule
6. When to Seek Help: Signs that professional intervention is needed

Provide step-by-step, practical advice suitable for smallholder farmers."""
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert agricultural extension officer with 20+ years of experience helping smallholder farmers. Provide practical, actionable advice."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1200,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error getting treatment advice: {e}")
            return f"Unable to get detailed treatment advice. Please consult with a local agricultural extension officer for {disease} treatment."
    
    def create_visualization(self, image_path, analysis_result, treatment_advice):
        """
        Part 4: Output Display
        Create comprehensive visualization of results
        """
        # Load original image
        original_img = cv2.imread(image_path)
        original_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        
        # Create figure with subplots
        fig = plt.figure(figsize=(16, 12))
        
        # Original image (top left)
        ax1 = plt.subplot(2, 3, (1, 2))
        ax1.imshow(original_img)
        ax1.set_title('Original Plant Image', fontsize=16, fontweight='bold', pad=20)
        ax1.axis('off')
        
        # Analysis results (top right)
        ax2 = plt.subplot(2, 3, 3)
        ax2.text(0.1, 0.9, 'DIAGNOSIS RESULTS', fontsize=14, fontweight='bold', transform=ax2.transAxes)
        ax2.text(0.1, 0.75, f"Plant: {analysis_result['plant_type']}", fontsize=12, transform=ax2.transAxes, fontweight='bold')
        ax2.text(0.1, 0.65, f"Disease: {analysis_result['disease']}", fontsize=12, transform=ax2.transAxes, fontweight='bold')
        ax2.text(0.1, 0.55, f"Confidence: {analysis_result['confidence']}", fontsize=12, transform=ax2.transAxes)
        
        # Symptoms
        ax2.text(0.1, 0.4, 'Key Symptoms:', fontsize=11, fontweight='bold', transform=ax2.transAxes)
        symptoms_wrapped = self.wrap_text(analysis_result['symptoms'], 30)
        y_pos = 0.35
        for line in symptoms_wrapped:
            ax2.text(0.1, y_pos, line, fontsize=10, transform=ax2.transAxes)
            y_pos -= 0.05
        
        ax2.set_xlim(0, 1)
        ax2.set_ylim(0, 1)
        ax2.axis('off')
        
        # Treatment advice (bottom, spanning full width)
        ax3 = plt.subplot(2, 1, 2)
        ax3.text(0.02, 0.98, 'EXPERT AGRICULTURAL ADVICE', fontsize=14, fontweight='bold', transform=ax3.transAxes, va='top')
        
        # Wrap and display treatment text
        treatment_wrapped = self.wrap_text(treatment_advice, 120)
        y_pos = 0.92
        for line in treatment_wrapped[:25]:  # Limit to first 25 lines for space
            ax3.text(0.02, y_pos, line, fontsize=10, transform=ax3.transAxes, va='top')
            y_pos -= 0.035
        
        if len(treatment_wrapped) > 25:
            ax3.text(0.02, y_pos, '... (see full report for complete advice)', fontsize=10, 
                    transform=ax3.transAxes, va='top', style='italic')
        
        ax3.set_xlim(0, 1)
        ax3.set_ylim(0, 1)
        ax3.axis('off')
        
        plt.tight_layout()
        
        # Save visualization
        result_image_path = self.results_dir / f"diagnosis_{Path(image_path).stem}.png"
        plt.savefig(result_image_path, dpi=300, bbox_inches='tight', facecolor='white')
        plt.show()
        
        return result_image_path
    
    def wrap_text(self, text, width):
        """Simple text wrapping function"""
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= width:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def save_report(self, image_path, analysis_result, treatment_advice):
        """Save complete analysis report"""
        report_path = self.results_dir / f"report_{Path(image_path).stem}.txt"
        
        report_content = f"""
PLANT DISEASE ANALYSIS REPORT
=============================

Image File: {Path(image_path).name}
Analysis Date: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

DIAGNOSIS:
----------
Plant Type: {analysis_result['plant_type']}
Disease/Condition: {analysis_result['disease']}
Confidence Level: {analysis_result['confidence']}

OBSERVED SYMPTOMS:
-----------------
{analysis_result['symptoms']}

EXPERT TREATMENT ADVICE:
-----------------------
{treatment_advice}

=============================
Report generated by Plant Disease Detection System
Using OpenAI Vision API for analysis
"""
        
        with open(report_path, 'w') as f:
            f.write(report_content)
        
        print(f"Report saved to: {report_path}")
        return report_path
    
    def analyze_plant_image(self, image_path):
        """
        Complete analysis pipeline
        """
        print("="*60)
        print("PLANT DISEASE DETECTION SYSTEM")
        print("="*60)
        print(f"Analyzing image: {image_path}")
        
        # Part 2: Analyze image with AI
        analysis_result = self.analyze_plant_with_vision(image_path)
        if not analysis_result:
            print("Failed to analyze image")
            return
        
        print(f"\nDiagnosis: {analysis_result['disease']} on {analysis_result['plant_type']}")
        print(f"Confidence: {analysis_result['confidence']}")
        
        # Part 3: Get treatment advice
        treatment_advice = self.get_treatment_advice(
            analysis_result['plant_type'], 
            analysis_result['disease']
        )
        
        # Part 4: Create visualization and save results
        visualization_path = self.create_visualization(image_path, analysis_result, treatment_advice)
        report_path = self.save_report(image_path, analysis_result, treatment_advice)
        
        print("\n" + "="*60)
        print("ANALYSIS COMPLETE")
        print("="*60)
        print(f"Plant: {analysis_result['plant_type']}")
        print(f"Disease: {analysis_result['disease']}")
        print(f"Confidence: {analysis_result['confidence']}")
        print(f"\nFiles created:")
        print(f"- Visualization: {visualization_path}")
        print(f"- Report: {report_path}")
        print("\nTreatment Summary:")
        print(treatment_advice[:200] + "..." if len(treatment_advice) > 200 else treatment_advice)

def main():
    """Main function with command line interface"""
    parser = argparse.ArgumentParser(description='Plant Disease Detection Demo')
    parser.add_argument('image_path', help='Path to plant image file')
    parser.add_argument('--output-dir', default='demo_results', help='Output directory for results')
    
    args = parser.parse_args()
    
    # Check if image file exists
    if not os.path.exists(args.image_path):
        print(f"Error: Image file '{args.image_path}' not found")
        return
    
    # Check OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("Error: OPENAI_API_KEY environment variable not set")
        return
    
    # Initialize demo
    demo = PlantDiseaseDemo()
    demo.results_dir = Path(args.output_dir)
    demo.results_dir.mkdir(exist_ok=True)
    
    # Run analysis
    demo.analyze_plant_image(args.image_path)

if __name__ == "__main__":
    import pandas as pd
    
    # If no command line arguments, run interactive mode
    if len(os.sys.argv) == 1:
        print("Plant Disease Detection Demo")
        print("Usage: python plant_demo.py <image_path>")
        print("\nExample: python plant_demo.py sample_leaf.jpg")
        print("\nFor web interface, run: streamlit run streamlit_app.py")
    else:
        main()