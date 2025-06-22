#!/usr/bin/env python3
"""
End-to-End Plant Leaf Disease Detection System
Part 1: Dataset & Model Training
Part 2: Prediction Function
Part 3: GPT Integration
Part 4: Output Display
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import cv2
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import keras as standalone_keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from openai import OpenAI
import kaggle
import zipfile
import shutil
from pathlib import Path
import json
from dotenv import load_dotenv
load_dotenv()

# Set up OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class PlantDiseaseDetector:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.class_names = []
        self.img_size = (128, 128)
        
    def download_dataset(self):
        """Download PlantVillage dataset from Kaggle"""
        print("Downloading PlantVillage dataset...")
        
        try:
            # Set up Kaggle API credentials from environment variables if available
            if os.getenv('KAGGLE_USERNAME') and os.getenv('KAGGLE_KEY'):
                os.environ['KAGGLE_USERNAME'] = os.getenv('KAGGLE_USERNAME')
                os.environ['KAGGLE_KEY'] = os.getenv('KAGGLE_KEY')
            
            # Ensure the Kaggle module is available
            import kaggle
            
            # Download the dataset
            kaggle.api.dataset_download_files('emmarex/plantdisease', path='./data', unzip=True)
            
            print("Dataset downloaded successfully!")
            return Path('./data/PlantVillage').as_posix()
            
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            print("Please make sure you have set up Kaggle API credentials.")
            print("You can get your API credentials from https://www.kaggle.com/account")
            print("Then create a ~/.kaggle/kaggle.json file or set KAGGLE_USERNAME and KAGGLE_KEY environment variables.")
            return None
    
    def load_and_preprocess_data(self, data_path):
        """Load and preprocess images from the dataset"""
        print("Loading and preprocessing data...")
        
        images = []
        labels = []
        
        # Get all class directories
        class_dirs = [d for d in os.listdir(data_path) if os.path.isdir(os.path.join(data_path, d))]
        self.class_names = sorted(class_dirs)
        
        print(f"Found {len(self.class_names)} classes:")
        for i, class_name in enumerate(self.class_names):
            print(f"{i}: {class_name}")
        
        # Load images from each class
        for class_idx, class_name in enumerate(self.class_names):
            class_path = os.path.join(data_path, class_name)
            image_files = [f for f in os.listdir(class_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            print(f"Loading {len(image_files)} images from {class_name}...")
            
            for img_file in image_files[:500]:  # Limit to 500 images per class for faster training
                img_path = os.path.join(class_path, img_file)
                
                try:
                    # Load and resize image
                    img = cv2.imread(img_path)
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    img = cv2.resize(img, self.img_size)
                    
                    # Normalize pixel values
                    img = img.astype('float32') / 255.0
                    
                    images.append(img)
                    labels.append(class_name)
                    
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
                    continue
        
        # Convert to numpy arrays
        images = np.array(images)
        labels = np.array(labels)
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        labels_encoded = self.label_encoder.fit_transform(labels)
        labels_categorical = keras.utils.to_categorical(labels_encoded, num_classes=len(self.class_names))
        
        print(f"Loaded {len(images)} images with shape {images.shape}")
        print(f"Number of classes: {len(self.class_names)}")
        
        return images, labels_categorical
    
    def build_cnn_model(self, num_classes):
        """Build CNN model for plant disease classification"""
        print("Building CNN model...")
        
        model = keras.Sequential([
            # First Convolutional Block
            layers.Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 3)),
            layers.MaxPooling2D((2, 2)),
            layers.BatchNormalization(),
            
            # Second Convolutional Block
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.BatchNormalization(),
            
            # Third Convolutional Block
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.BatchNormalization(),
            
            # Fourth Convolutional Block
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.BatchNormalization(),
            
            # Flatten and Dense layers
            layers.Flatten(),
            layers.Dropout(0.5),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print("Model architecture:")
        model.summary()
        
        return model
    
    def train_model(self, X, y, epochs=10):
        """Train the CNN model"""
        print(f"Training model for {epochs} epochs...")
        
        # Split data into training and validation sets
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        
        # Build model
        self.model = self.build_cnn_model(len(self.class_names))
        
        # Define callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(factor=0.2, patience=2)
        ]
        
        # Train model
        history = self.model.fit(
            X_train, y_train,
            batch_size=32,
            epochs=epochs,
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        # Save the trained model
        self.model.save('leafdoctor_model.h5')
        
        # Save class names and label encoder
        with open('class_names.json', 'w') as f:
            json.dump(self.class_names, f)
        
        print("Model saved as 'leafdoctor_model.h5'")
        
        return history
    
    def load_model(self, model_path='leafdoctor_model.h5', class_names_path='class_names.json'):
        """Load a pre-trained model"""
        if os.path.exists(model_path) and os.path.exists(class_names_path):
            print("Loading pre-trained model...")
            self.model = keras.models.load_model(model_path)
            
            with open(class_names_path, 'r') as f:
                self.class_names = json.load(f)
            
            # Recreate label encoder
            self.label_encoder = LabelEncoder()
            self.label_encoder.fit(self.class_names)
            
            print("Model loaded successfully!")
            return True
        return False
    
    def preprocess_image(self, image_path):
        """Preprocess a single image for prediction"""
        try:
            # Load image
            img = cv2.imread(image_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Resize to model input size
            img = cv2.resize(img, self.img_size)
            
            # Normalize
            img = img.astype('float32') / 255.0
            
            # Add batch dimension
            img = np.expand_dims(img, axis=0)
            
            return img
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def predict_leaf_disease(self, image_path):
        """
        Part 2: Prediction Function
        Loads a user-provided image, preprocesses it, and predicts the disease class
        """
        if self.model is None:
            print("Model not loaded. Please train or load a model first.")
            return None
        
        # Preprocess image
        processed_img = self.preprocess_image(image_path)
        if processed_img is None:
            return None
        
        # Make prediction
        predictions = self.model.predict(processed_img)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = np.max(predictions[0])
        
        # Get class name
        predicted_class = self.class_names[predicted_class_idx]
        
        print(f"Predicted disease: {predicted_class}")
        print(f"Confidence: {confidence:.2%}")
        
        return {
            'predicted_class': predicted_class,
            'confidence': confidence,
            'all_predictions': predictions[0]
        }
    
    def get_gpt_explanation(self, predicted_class):
        """
        Part 3: GPT Integration
        Get farmer-friendly explanation and treatment advice from GPT-4
        """
        try:
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
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {"role": "system", "content": "You are an expert agricultural extension officer helping smallholder farmers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error getting GPT explanation: {e}")
            return f"Unable to get detailed explanation for {predicted_class}. Please consult with a local agricultural extension officer."
    
    def display_results(self, image_path, prediction_result, gpt_explanation):
        """
        Part 4: Output Display
        Display original image, predicted disease name, and GPT explanation
        """
        # Load and display original image
        original_img = cv2.imread(image_path)
        original_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        
        plt.figure(figsize=(15, 10))
        
        # Display original image
        plt.subplot(2, 2, 1)
        plt.imshow(original_img)
        plt.title('Original Image', fontsize=14, fontweight='bold')
        plt.axis('off')
        
        # Display prediction results
        plt.subplot(2, 2, 2)
        plt.text(0.1, 0.9, 'PREDICTION RESULTS', fontsize=16, fontweight='bold', transform=plt.gca().transAxes)
        plt.text(0.1, 0.7, f"Disease: {prediction_result['predicted_class']}", fontsize=12, transform=plt.gca().transAxes)
        plt.text(0.1, 0.6, f"Confidence: {prediction_result['confidence']:.2%}", fontsize=12, transform=plt.gca().transAxes)
        
        # Show top 3 predictions
        top_3_indices = np.argsort(prediction_result['all_predictions'])[-3:][::-1]
        plt.text(0.1, 0.4, 'Top 3 Predictions:', fontsize=12, fontweight='bold', transform=plt.gca().transAxes)
        for i, idx in enumerate(top_3_indices):
            class_name = self.class_names[idx]
            confidence = prediction_result['all_predictions'][idx]
            plt.text(0.1, 0.3-i*0.05, f"{i+1}. {class_name}: {confidence:.2%}", fontsize=10, transform=plt.gca().transAxes)
        
        plt.axis('off')
        
        # Display GPT explanation (split into two parts if too long)
        plt.subplot(2, 1, 2)
        plt.text(0.02, 0.98, 'EXPERT AGRICULTURAL ADVICE', fontsize=14, fontweight='bold', transform=plt.gca().transAxes, va='top')
        
        # Wrap text for better display
        import textwrap
        wrapped_text = textwrap.fill(gpt_explanation, width=120)
        plt.text(0.02, 0.92, wrapped_text, fontsize=10, transform=plt.gca().transAxes, va='top', wrap=True)
        plt.axis('off')
        
        plt.tight_layout()
        plt.savefig('disease_diagnosis_result.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("\n" + "="*80)
        print("PLANT DISEASE DIAGNOSIS COMPLETE")
        print("="*80)
        print(f"Predicted Disease: {prediction_result['predicted_class']}")
        print(f"Confidence: {prediction_result['confidence']:.2%}")
        print("\nExpert Advice:")
        print(gpt_explanation)
        print("="*80)

def main():
    """Main function to demonstrate the complete system"""
    detector = PlantDiseaseDetector()
    
    # Check if model already exists
    if not detector.load_model():
        print("No pre-trained model found. Starting training process...")
        
        # Part 1: Download dataset and train model
        try:
            data_path = detector.download_dataset()
            if not data_path:
                print("Dataset download failed – aborting training.")
                return
            X, y = detector.load_and_preprocess_data(data_path)
            history = detector.train_model(X, y, epochs=10)
            
            # Plot training history
            plt.figure(figsize=(12, 4))
            
            plt.subplot(1, 2, 1)
            plt.plot(history.history['accuracy'], label='Training Accuracy')
            plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
            plt.title('Model Accuracy')
            plt.xlabel('Epoch')
            plt.ylabel('Accuracy')
            plt.legend()
            
            plt.subplot(1, 2, 2)
            plt.plot(history.history['loss'], label='Training Loss')
            plt.plot(history.history['val_loss'], label='Validation Loss')
            plt.title('Model Loss')
            plt.xlabel('Epoch')
            plt.ylabel('Loss')
            plt.legend()
            
            plt.tight_layout()
            plt.savefig('training_history.png')
            plt.show()
            
        except Exception as e:
            print(f"Error during training: {e}")
            return
    
    # Example usage with a test image
    print("\nSystem ready for plant disease detection!")
    print("To use the system:")
    print("1. Call detector.predict_leaf_disease('path_to_image.jpg')")
    print("2. The system will display the original image, prediction, and expert advice")
    
    return detector

if __name__ == "__main__":
    detector = main()