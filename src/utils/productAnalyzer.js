// src/utils/productAnalyzer.js
class ProductAnalyzer {
    constructor() {
        this.imageAnalyzer = new ImageAnalyzer();
        this.textAnalyzer = new TextAnalyzer();
    }

    async analyzeSimilarity(product1, product2) {
        const titleSimilarity = this.textAnalyzer.compareTwoTexts(
            product1.title,
            product2.title
        );

        let imageSimilarity = 0;
        if (product1.image && product2.image) {
            imageSimilarity = await this.imageAnalyzer.compareTwoImages(
                product1.image,
                product2.image
            );
        }

        return (imageSimilarity * 0.7) + (titleSimilarity * 0.3);
    }
}

// Export to window object
window.ProductAnalyzer = ProductAnalyzer;