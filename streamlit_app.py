#!/usr/bin/env python3
"""
Streamlit Web Interface for Plant Disease Detection System
"""

import streamlit as st
import os
import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
from tensorflow import keras
import matplotlib.pyplot as plt
import openai
import json
from io import BytesIO
import base64
from dotenv import load_dotenv
load_dotenv()

# Configure Streamlit page
st.set_page_config(
    page_title="Plant Disease Detection",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Set up OpenAI client
@st.cache_resource
def get_openai_client():
    return openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

client = get_openai_client()

class StreamlitPlantDetector:
    def __init__(self):
        self.model = None
        self.class_names = []
        self.img_size = (128, 128)
        
    @st.cache_resource
    def load_model(_self, model_path='leafdoctor_model.h5', class_names_path='class_names.json'):
        """Load a pre-trained model"""
        if os.path.exists(model_path) and os.path.exists(class_names_path):
            try:
                _self.model = keras.models.load_model(model_path)
                with open(class_names_path, 'r') as f:
                    _self.class_names = json.load(f)
                return True
            except Exception as e:
                st.error(f"Error loading model: {e}")
                return False
        return False
    
    def preprocess_image(self, image):
        """Preprocess PIL image for prediction"""
        try:
            # Convert PIL to numpy array
            img_array = np.array(image)
            
            # Resize to model input size
            img_resized = cv2.resize(img_array, self.img_size)
            
            # Normalize
            img_normalized = img_resized.astype('float32') / 255.0
            
            # Add batch dimension
            img_batch = np.expand_dims(img_normalized, axis=0)
            
            return img_batch
        except Exception as e:
            st.error(f"Error preprocessing image: {e}")
            return None
    
    def predict_disease(self, image):
        """Predict disease from PIL image"""
        if self.model is None:
            st.error("Model not loaded. Please train or load a model first.")
            return None
        
        # Preprocess image
        processed_img = self.preprocess_image(image)
        if processed_img is None:
            return None
        
        # Make prediction
        with st.spinner("Analyzing image..."):
            predictions = self.model.predict(processed_img, verbose=0)
            predicted_class_idx = np.argmax(predictions[0])
            confidence = np.max(predictions[0])
        
        # Get class name
        predicted_class = self.class_names[predicted_class_idx]
        
        return {
            'predicted_class': predicted_class,
            'confidence': confidence,
            'all_predictions': predictions[0]
        }
    
    def get_gpt_explanation(self, predicted_class):
        """Get farmer-friendly explanation from GPT-4"""
        try:
            with st.spinner("Getting expert advice..."):
                prompt = f"""Explain what {predicted_class} is and how to treat it in organic and non-organic ways. 
                Provide step-by-step advice for a smallholder farmer. Include:
                
                1. What is this disease/condition?
                2. What causes it?
                3. Organic treatment methods
                4. Non-organic treatment methods
                5. Prevention strategies
                6. When to seek professional help
                
                Please provide practical, actionable advice that a farmer can implement."""
                
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are an expert agricultural extension officer helping smallholder farmers."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.7
                )
                
                return response.choices[0].message.content
                
        except Exception as e:
            st.error(f"Error getting expert advice: {e}")
            return f"Unable to get detailed explanation for {predicted_class}. Please consult with a local agricultural extension officer."

# Initialize detector
@st.cache_resource
def get_detector():
    return StreamlitPlantDetector()

detector = get_detector()

# Main app
def main():
    st.title("🌱 Plant Disease Detection System")
    st.markdown("### AI-Powered Plant Health Analysis with Expert Agricultural Advice")
    
    # Sidebar
    st.sidebar.title("Instructions")
    st.sidebar.markdown("""
    1. **Upload Image**: Choose a clear photo of a plant leaf
    2. **Analysis**: Our AI will identify the plant and detect any diseases
    3. **Expert Advice**: Get professional treatment recommendations
    4. **Results**: View detailed analysis and save recommendations
    """)
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Supported formats:** JPG, JPEG, PNG")
    st.sidebar.markdown("**Max file size:** 200MB")
    
    # Check if model is loaded
    model_loaded = detector.load_model()
    
    if not model_loaded:
        st.warning("⚠️ No pre-trained model found. Please train the model first.")
        st.markdown("""
        To train the model:
        1. Run `python plant_disease_detection.py` in the terminal
        2. Wait for training to complete (this may take some time)
        3. Refresh this page
        """)
        
        # Option to create a demo without trained model
        st.markdown("---")
        st.markdown("### Demo Mode (Using OpenAI Vision)")
        st.markdown("Upload an image to get AI-powered analysis without the trained model:")
        
        uploaded_file = st.file_uploader("Choose an image...", type=['jpg', 'jpeg', 'png'])
        
        if uploaded_file is not None:
            # Display image
            image = Image.open(uploaded_file)
            col1, col2 = st.columns(2)
            
            with col1:
                st.image(image, caption="Uploaded Image", use_column_width=True)
            
            with col2:
                # Convert to base64 for OpenAI
                buffered = BytesIO()
                image.save(buffered, format="JPEG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode()
                
                # Get OpenAI analysis
                try:
                    with st.spinner("Analyzing with AI..."):
                        response = client.chat.completions.create(
                            model="gpt-4o",
                            messages=[
                                {
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "text",
                                            "text": "Analyze this plant image and identify any diseases or health issues. Provide the plant type and disease name if any."
                                        },
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": f"data:image/jpeg;base64,{img_base64}"
                                            }
                                        }
                                    ],
                                },
                            ],
                            max_tokens=500,
                        )
                    
                    ai_analysis = response.choices[0].message.content
                    st.success("✅ Analysis Complete")
                    st.write("**AI Analysis:**")
                    st.write(ai_analysis)
                    
                    # Get treatment advice
                    treatment_advice = detector.get_gpt_explanation(ai_analysis.split('\n')[0])
                    st.write("**Treatment Advice:**")
                    st.write(treatment_advice)
                    
                except Exception as e:
                    st.error(f"Error analyzing image: {e}")
        
        return
    
    # Main interface when model is loaded
    st.success("✅ Model loaded successfully!")
    st.markdown(f"**Available classes:** {len(detector.class_names)} plant diseases")
    
    # File uploader
    uploaded_file = st.file_uploader("Choose an image...", type=['jpg', 'jpeg', 'png'])
    
    if uploaded_file is not None:
        # Display uploaded image
        image = Image.open(uploaded_file)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📷 Uploaded Image")
            st.image(image, caption="Your plant image", use_column_width=True)
        
        with col2:
            st.subheader("🔬 Analysis Results")
            
            # Make prediction
            prediction_result = detector.predict_disease(image)
            
            if prediction_result:
                # Display prediction
                st.metric("Predicted Disease", prediction_result['predicted_class'])
                st.metric("Confidence", f"{prediction_result['confidence']:.2%}")
                
                # Top predictions chart
                st.subheader("📊 Top Predictions")
                top_5_indices = np.argsort(prediction_result['all_predictions'])[-5:][::-1]
                top_5_classes = [detector.class_names[i] for i in top_5_indices]
                top_5_confidences = [prediction_result['all_predictions'][i] for i in top_5_indices]
                
                # Create horizontal bar chart
                fig, ax = plt.subplots(figsize=(10, 6))
                bars = ax.barh(range(len(top_5_classes)), top_5_confidences, color='green', alpha=0.7)
                ax.set_yticks(range(len(top_5_classes)))
                ax.set_yticklabels([cls[:30] + '...' if len(cls) > 30 else cls for cls in top_5_classes])
                ax.set_xlabel('Confidence')
                ax.set_title('Top 5 Disease Predictions')
                
                # Add value labels on bars
                for i, bar in enumerate(bars):
                    width = bar.get_width()
                    ax.text(width + 0.01, bar.get_y() + bar.get_height()/2, 
                           f'{width:.2%}', ha='left', va='center')
                
                plt.tight_layout()
                st.pyplot(fig)
        
        # Expert advice section
        if prediction_result:
            st.markdown("---")
            st.subheader("🌾 Expert Agricultural Advice")
            
            # Get GPT explanation
            explanation = detector.get_gpt_explanation(prediction_result['predicted_class'])
            
            # Display in expandable sections
            with st.expander("📖 Disease Information & Treatment", expanded=True):
                st.write(explanation)
            
            # Download results
            st.markdown("---")
            st.subheader("💾 Save Results")
            
            # Create downloadable report
            report = f"""
PLANT DISEASE ANALYSIS REPORT
=============================

Image: {uploaded_file.name}
Date: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

DIAGNOSIS:
- Predicted Disease: {prediction_result['predicted_class']}
- Confidence: {prediction_result['confidence']:.2%}

TOP 5 PREDICTIONS:
"""
            for i, idx in enumerate(top_5_indices):
                class_name = detector.class_names[idx]
                confidence = prediction_result['all_predictions'][idx]
                report += f"{i+1}. {class_name}: {confidence:.2%}\n"
            
            report += f"""
EXPERT ADVICE:
{explanation}

---
Generated by Plant Disease Detection System
"""
            
            st.download_button(
                label="📄 Download Report",
                data=report,
                file_name=f"plant_diagnosis_{uploaded_file.name.split('.')[0]}.txt",
                mime="text/plain"
            )

if __name__ == "__main__":
    # Import pandas for timestamp
    import pandas as pd
    main()