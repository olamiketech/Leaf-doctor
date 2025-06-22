#!/usr/bin/env python3
"""
Flask Web Interface for Plant Disease Detection System
"""

from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import os
import base64
from io import BytesIO
from PIL import Image
import numpy as np
try:
    from plant_disease_detection import PlantDiseaseDetector
    KAGGLE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import PlantDiseaseDetector: {e}")
    KAGGLE_AVAILABLE = False
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize detector
detector = None
if KAGGLE_AVAILABLE:
    try:
        detector = PlantDiseaseDetector()
        # Try to load model if available
        if not detector.load_model():
            print("Warning: No pre-trained model found. Model-based predictions will not be available.")
    except Exception as e:
        print(f"Warning: Failed to initialize PlantDiseaseDetector: {e}")
        detector = None
else:
    print("Warning: Kaggle is not available. Model-based predictions will not be available.")

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory('uploads', filename)

@app.route('/')
def index():
    """Main page with upload interface"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and disease prediction"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Save uploaded file
            filename = 'uploaded_image.jpg'
            filepath = os.path.join('uploads', filename)
            os.makedirs('uploads', exist_ok=True)
            file.save(filepath)
            
            response = {}
            
            if detector is not None:
                try:
                    # Make prediction
                    prediction_result = detector.predict_leaf_disease(filepath)
                    
                    # Get GPT explanation
                    gpt_explanation = ""
                    if prediction_result and 'predicted_class' in prediction_result:
                        try:
                            gpt_explanation = detector.get_gpt_explanation(
                                prediction_result['predicted_class']
                            )
                        except Exception as e:
                            print(f"Warning: Could not get GPT explanation: {e}")
                            gpt_explanation = "Explanation not available."
                    
                    # Add prediction to response
                    response.update({
                        'prediction': prediction_result,
                        'explanation': gpt_explanation,
                        'has_model': True
                    })
                    
                    # Generate result image
                    try:
                        result_image_path = generate_result_image(filepath, prediction_result, gpt_explanation)
                        with open(result_image_path, 'rb') as img_file:
                            img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                        response['result_image'] = img_base64
                    except Exception as e:
                        print(f"Warning: Could not generate result image: {e}")
                        response['result_image'] = None
                        
                except Exception as e:
                    print(f"Error during prediction: {e}")
                    response.update({
                        'error': 'Prediction failed',
                        'details': str(e),
                        'has_model': False
                    })
            else:
                response.update({
                    'message': 'Model not available. Only image upload is working.',
                    'has_model': False
                })
            
            response['success'] = True
            return jsonify(response)
        
        return jsonify({'error': 'Invalid file type. Please upload JPG, JPEG, or PNG files.'}), 400
        
    except Exception as e:
        print(f"Error processing upload: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_result_image(image_path, prediction_result, gpt_explanation):
    """Generate a result visualization image"""
    # Load original image
    original_img = plt.imread(image_path)
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    
    # Original image
    ax1.imshow(original_img)
    ax1.set_title('Original Image', fontsize=14, fontweight='bold')
    ax1.axis('off')
    
    # Prediction results
    ax2.text(0.1, 0.9, 'PREDICTION RESULTS', fontsize=16, fontweight='bold', transform=ax2.transAxes)
    ax2.text(0.1, 0.7, f"Disease: {prediction_result['predicted_class']}", fontsize=12, transform=ax2.transAxes)
    ax2.text(0.1, 0.6, f"Confidence: {prediction_result['confidence']:.2%}", fontsize=12, transform=ax2.transAxes)
    
    # Top 3 predictions
    top_3_indices = np.argsort(prediction_result['all_predictions'])[-3:][::-1]
    ax2.text(0.1, 0.4, 'Top 3 Predictions:', fontsize=12, fontweight='bold', transform=ax2.transAxes)
    for i, idx in enumerate(top_3_indices):
        class_name = detector.class_names[idx]
        confidence = prediction_result['all_predictions'][idx]
        ax2.text(0.1, 0.3-i*0.05, f"{i+1}. {class_name}: {confidence:.2%}", fontsize=10, transform=ax2.transAxes)
    
    ax2.axis('off')
    
    # Confidence bar chart
    top_5_indices = np.argsort(prediction_result['all_predictions'])[-5:][::-1]
    top_5_classes = [detector.class_names[i][:20] + '...' if len(detector.class_names[i]) > 20 else detector.class_names[i] for i in top_5_indices]
    top_5_confidences = [prediction_result['all_predictions'][i] for i in top_5_indices]
    
    ax3.barh(range(len(top_5_classes)), top_5_confidences)
    ax3.set_yticks(range(len(top_5_classes)))
    ax3.set_yticklabels(top_5_classes, fontsize=8)
    ax3.set_xlabel('Confidence')
    ax3.set_title('Top 5 Predictions', fontsize=12, fontweight='bold')
    
    # GPT explanation (truncated for visualization)
    import textwrap
    explanation_lines = textwrap.wrap(gpt_explanation[:500] + "...", width=50)
    ax4.text(0.02, 0.98, 'EXPERT ADVICE (Excerpt)', fontsize=12, fontweight='bold', transform=ax4.transAxes, va='top')
    
    y_pos = 0.9
    for line in explanation_lines[:15]:  # Show first 15 lines
        ax4.text(0.02, y_pos, line, fontsize=8, transform=ax4.transAxes, va='top')
        y_pos -= 0.05
    
    ax4.axis('off')
    
    plt.tight_layout()
    result_path = 'static/result.png'
    os.makedirs('static', exist_ok=True)
    plt.savefig(result_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    return result_path

if __name__ == '__main__':
    # Ensure upload directory exists
    os.makedirs('uploads', exist_ok=True)
    app.run(host='0.0.0.0', port=5001, debug=True)