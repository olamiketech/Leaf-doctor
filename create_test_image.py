#!/usr/bin/env python3
"""
Create a test plant leaf image for demonstration
"""

import numpy as np
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt

def create_diseased_leaf_image():
    """Create a synthetic diseased leaf image for testing"""
    
    # Create a leaf-shaped image
    width, height = 400, 300
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw leaf shape (oval with pointed ends)
    leaf_color = (34, 139, 34)  # Forest green
    draw.ellipse([50, 50, 350, 250], fill=leaf_color)
    
    # Add leaf texture with darker green veins
    vein_color = (0, 100, 0)
    # Central vein
    draw.line([200, 60, 200, 240], fill=vein_color, width=4)
    # Side veins
    for i in range(70, 230, 20):
        draw.line([200, i, 120, i+30], fill=vein_color, width=2)
        draw.line([200, i, 280, i+30], fill=vein_color, width=2)
    
    # Add disease spots (brown spots for leaf spot disease)
    spot_color = (139, 69, 19)  # Saddle brown
    spot_positions = [(120, 100), (180, 140), (260, 120), (150, 180), (240, 200)]
    
    for x, y in spot_positions:
        # Create irregular spots
        draw.ellipse([x-15, y-10, x+15, y+10], fill=spot_color)
        draw.ellipse([x-10, y-8, x+12, y+8], fill=(160, 82, 45))  # Lighter brown center
    
    # Add some yellowing around spots
    yellow_color = (255, 255, 0)
    for x, y in spot_positions:
        draw.ellipse([x-20, y-15, x+20, y+15], fill=None, outline=yellow_color, width=2)
    
    # Save the image
    img.save('test_diseased_leaf.jpg', 'JPEG', quality=95)
    print("Test diseased leaf image created: test_diseased_leaf.jpg")
    
    return 'test_diseased_leaf.jpg'

def create_healthy_leaf_image():
    """Create a healthy leaf image for testing"""
    
    width, height = 400, 300
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw healthy leaf shape
    leaf_color = (50, 205, 50)  # Lime green
    draw.ellipse([50, 50, 350, 250], fill=leaf_color)
    
    # Add healthy leaf texture
    vein_color = (34, 139, 34)  # Forest green
    # Central vein
    draw.line([200, 60, 200, 240], fill=vein_color, width=4)
    # Side veins
    for i in range(70, 230, 20):
        draw.line([200, i, 120, i+30], fill=vein_color, width=2)
        draw.line([200, i, 280, i+30], fill=vein_color, width=2)
    
    # Add subtle shading for depth
    for i in range(10):
        shade_color = (50 - i*2, 205 - i*5, 50 - i*2)
        draw.ellipse([50+i*2, 50+i*2, 350-i*2, 250-i*2], outline=shade_color)
    
    # Save the image
    img.save('test_healthy_leaf.jpg', 'JPEG', quality=95)
    print("Test healthy leaf image created: test_healthy_leaf.jpg")
    
    return 'test_healthy_leaf.jpg'

if __name__ == "__main__":
    diseased_path = create_diseased_leaf_image()
    healthy_path = create_healthy_leaf_image()
    
    # Display both images
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    
    # Diseased leaf
    diseased_img = plt.imread(diseased_path)
    ax1.imshow(diseased_img)
    ax1.set_title('Test Diseased Leaf\n(Brown spots indicating leaf spot disease)')
    ax1.axis('off')
    
    # Healthy leaf
    healthy_img = plt.imread(healthy_path)
    ax2.imshow(healthy_img)
    ax2.set_title('Test Healthy Leaf\n(Vibrant green with no symptoms)')
    ax2.axis('off')
    
    plt.tight_layout()
    plt.savefig('test_images_preview.png', dpi=150, bbox_inches='tight')
    plt.show()
    
    print("\nTest images created successfully!")
    print("Use these for testing the plant disease detection system:")
    print(f"- Diseased leaf: {diseased_path}")
    print(f"- Healthy leaf: {healthy_path}")