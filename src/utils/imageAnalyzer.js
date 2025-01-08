// src/utils/imageAnalyzer.js
class ImageAnalyzer {
    async getImageFeatures(imageUrl) {
        try {
            // Create a small canvas to analyze the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Convert image to grayscale pixels for basic comparison
            return new Promise((resolve, reject) => {
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    canvas.width = 32;  // Small size for basic comparison
                    canvas.height = 32;
                    ctx.drawImage(img, 0, 0, 32, 32);
                    const imageData = ctx.getImageData(0, 0, 32, 32).data;
                    
                    // Convert to grayscale values
                    const features = [];
                    for(let i = 0; i < imageData.length; i += 4) {
                        const gray = (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
                        features.push(gray);
                    }
                    resolve(features);
                };
                img.onerror = () => resolve(null);
                img.src = imageUrl;
            });
        } catch (error) {
            console.error('Error analyzing image:', error);
            return null;
        }
    }

    async compareTwoImages(image1Url, image2Url) {
        const features1 = await this.getImageFeatures(image1Url);
        const features2 = await this.getImageFeatures(image2Url);
        
        if (!features1 || !features2) return 0;
        
        // Calculate similarity using pixel differences
        let similarity = 0;
        for(let i = 0; i < features1.length; i++) {
            const diff = Math.abs(features1[i] - features2[i]);
            similarity += 1 - (diff / 255);
        }
        
        return similarity / features1.length;
    }
}

// Export to window object
window.ImageAnalyzer = ImageAnalyzer;