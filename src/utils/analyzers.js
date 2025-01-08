// src/utils/analyzers.js
class ProductAnalyzer {
    constructor() {
        this.imageAnalyzer = new ImageAnalyzer();
        this.textAnalyzer = new TextAnalyzer();
    }

    async analyzeSimilarity(product1, product2) {
        // Calculate text similarity for title
        const titleSimilarity = this.textAnalyzer.compareTwoTexts(
            product1.title,
            product2.title
        );

        // Calculate image similarity if both products have images
        let imageSimilarity = 0;
        if (product1.image && product2.image) {
            imageSimilarity = await this.imageAnalyzer.compareTwoImages(
                product1.image,
                product2.image
            );
        }

        // Combine scores (giving more weight to image similarity)
        return (imageSimilarity * 0.7) + (titleSimilarity * 0.3);
    }
}