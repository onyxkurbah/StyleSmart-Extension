class ImageAnalyzer {
    constructor() {
        // Imagga API credentials
        this.apiKey = 'acc_895d4a3c0fb3060'; 
        this.apiSecret = 'db54618b6b2a15464198ec92058e5a8e';
        this.baseUrl = 'https://api.imagga.com/v2';
    }

    async getImageEmbedding(imageUrl) {
        try {
            // Get image tags and categories from Imagga
            const response = await fetch(
                `${this.baseUrl}/tags?image_url=${encodeURIComponent(imageUrl)}`,
                {
                    headers: {
                        'Authorization': 'Basic ' + btoa(`${this.apiKey}:${this.apiSecret}`)
                    }
                }
            );

            if (!response.ok) throw new Error('Imagga API request failed');
            
            const data = await response.json();
            const tags = data.result.tags;

            // Convert tags to a feature vector
            return this.convertTagsToVector(tags);
        } catch (error) {
            console.error('Error in image analysis:', error);
            return null;
        }
    }

    convertTagsToVector(tags) {
        // Create a 100-dimensional vector based on tag confidences
        const vector = new Float32Array(100).fill(0);
        
        tags.forEach((tag, index) => {
            if (index < 100) {
                vector[index] = tag.confidence / 100;
            }
        });

        return vector;
    }

    calculateImageSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2) return 0;

        // Cosine similarity calculation
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
}