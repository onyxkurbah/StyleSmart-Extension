// Enhanced product analyzer that combines both image and text similarity
class ProductAnalyzer {
    constructor() {
        this.SIMILARITY_THRESHOLD = 0.3;
        this.WEIGHTS = {
            title: 0.4,
            description: 0.2,
            price: 0.1,
            image: 0.3
        };
    }

    // Calculate similarity between two products
    async analyzeSimilarity(product1, product2) {
        try {
            // Get individual similarity scores
            const titleSimilarity = this.compareTexts(product1.title, product2.title);
            const priceSimilarity = this.comparePrices(product1.price, product2.price);
            const imageSimilarity = await this.compareImages(product1.image, product2.image);

            // Calculate weighted average
            const weightedScore = (
                (titleSimilarity * this.WEIGHTS.title) +
                (priceSimilarity * this.WEIGHTS.price) +
                (imageSimilarity * this.WEIGHTS.image)
            );

            return weightedScore;
        } catch (error) {
            console.error('Error analyzing similarity:', error);
            return 0;
        }
    }

    // Compare text similarity using improved tokenization and TF-IDF inspired approach
    compareTexts(text1, text2) {
        if (!text1 || !text2) return 0;
        
        // Tokenize and clean texts
        const tokens1 = this.tokenize(text1);
        const tokens2 = this.tokenize(text2);
        
        // Calculate term frequencies
        const tf1 = this.calculateTermFrequency(tokens1);
        const tf2 = this.calculateTermFrequency(tokens2);
        
        // Calculate similarity using cosine similarity
        return this.calculateCosineSimilarity(tf1, tf2);
    }

    // Enhanced tokenization with better cleaning and normalization
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')  // Keep hyphens as they're often meaningful in product names
            .split(/\s+/)
            .filter(word => word.length > 2)
            .map(word => this.stemWord(word));  // Basic stemming
    }

    // Basic word stemming (simplified Porter stemmer-like approach)
    stemWord(word) {
        return word
            .replace(/ing$/, '')
            .replace(/ed$/, '')
            .replace(/s$/, '')
            .replace(/ly$/, '');
    }

    // Calculate term frequency
    calculateTermFrequency(tokens) {
        const tf = {};
        tokens.forEach(token => {
            tf[token] = (tf[token] || 0) + 1;
        });
        return tf;
    }

    // Calculate cosine similarity between term frequency vectors
    calculateCosineSimilarity(tf1, tf2) {
        const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        allTerms.forEach(term => {
            const freq1 = tf1[term] || 0;
            const freq2 = tf2[term] || 0;
            dotProduct += freq1 * freq2;
            magnitude1 += freq1 * freq1;
            magnitude2 += freq2 * freq2;
        });

        const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    // Compare prices with a tolerance range
    comparePrices(price1, price2) {
        if (!price1 || !price2) return 0.5;  // Neutral score if price missing
        
        const maxPrice = Math.max(price1, price2);
        const minPrice = Math.min(price1, price2);
        const priceDiffPercent = (maxPrice - minPrice) / maxPrice;
        
        // Score based on price difference percentage
        if (priceDiffPercent <= 0.1) return 1;     // Within 10%
        if (priceDiffPercent <= 0.2) return 0.8;   // Within 20%
        if (priceDiffPercent <= 0.3) return 0.6;   // Within 30%
        if (priceDiffPercent <= 0.5) return 0.4;   // Within 50%
        return 0.2;  // More than 50% difference
    }

    // Compare images using perceptual hashing
    async compareImages(imageUrl1, imageUrl2) {
        try {
            if (!imageUrl1 || !imageUrl2) return 0.5;  // Neutral score if images missing

            // Create canvas for image processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 32;   // Small size for hash
            canvas.height = 32;

            // Get image hashes
            const hash1 = await this.getImageHash(imageUrl1, canvas, ctx);
            const hash2 = await this.getImageHash(imageUrl2, canvas, ctx);

            if (!hash1 || !hash2) return 0.5;

            // Calculate hamming distance between hashes
            const distance = this.calculateHammingDistance(hash1, hash2);
            
            // Convert distance to similarity score (0-1)
            return 1 - (distance / (32 * 32));
        } catch (error) {
            console.error('Error comparing images:', error);
            return 0.5;  // Neutral score on error
        }
    }

    // Generate perceptual hash for an image
    async getImageHash(imageUrl, canvas, ctx) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Draw and get pixel data
                ctx.drawImage(img, 0, 0, 32, 32);
                const imageData = ctx.getImageData(0, 0, 32, 32).data;
                
                // Convert to binary hash string
                let hash = '';
                for (let i = 0; i < imageData.length; i += 4) {
                    const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
                    hash += avg < 128 ? '0' : '1';
                }
                resolve(hash);
            };
            
            img.onerror = () => resolve(null);
            img.src = imageUrl;
        });
    }

    // Calculate Hamming distance between two binary strings
    calculateHammingDistance(str1, str2) {
        let distance = 0;
        for (let i = 0; i < str1.length; i++) {
            if (str1[i] !== str2[i]) distance++;
        }
        return distance;
    }
}

// Make available globally
window.ProductAnalyzer = ProductAnalyzer;