// src/utils/productAnalyzer.js

class ProductAnalyzer {
    constructor() {
        this.imageAnalyzer = new ImageAnalyzer();
        this.textAnalyzer = new TextAnalyzer();
    }

    async analyzeProduct(product) {
        const imageEmbedding = await this.imageAnalyzer.getImageEmbedding(product.image);
        const textFeatures = this.textAnalyzer.extractFeatures(product.title);

        return {
            ...product,
            imageEmbedding,
            textFeatures
        };
    }

    calculateSimilarity(product1, product2) {
        if (!product1 || !product2) return 0;

        // Calculate image similarity (40% weight)
        const imageSimilarity = this.imageAnalyzer.calculateImageSimilarity(
            product1.imageEmbedding,
            product2.imageEmbedding
        );

        // Calculate text similarity (60% weight)
        const textSimilarity = this.textAnalyzer.calculateTextSimilarity(
            product1.textFeatures,
            product2.textFeatures
        );

        // Weighted average
        return (imageSimilarity * 0.4) + (textSimilarity * 0.6);
    }
}

// Export for use in other modules
window.ProductAnalyzer = ProductAnalyzer;