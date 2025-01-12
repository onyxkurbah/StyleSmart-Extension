// src/utils/textAnalyzer.js
class TextAnalyzer {
    constructor() {
        this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']);
    }

    preprocessText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => !this.stopWords.has(word));
    }

    extractFeatures(text) {
        const words = this.preprocessText(text);
        
        // Extract key product features
        const features = {
            brand: this.extractBrand(words),
            category: this.extractCategory(words),
            color: this.extractColor(words),
            material: this.extractMaterial(words),
            keywords: words
        };

        return features;
    }

    calculateTextSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;

        // Calculate Jaccard similarity for keywords
        const keywords1 = new Set(features1.keywords);
        const keywords2 = new Set(features2.keywords);
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        const union = new Set([...keywords1, ...keywords2]);
        
        const keywordSimilarity = intersection.size / union.size;

        // Calculate exact matches for other features
        const exactMatches = ['brand', 'category', 'color', 'material']
            .filter(feature => features1[feature] && features2[feature])
            .filter(feature => features1[feature].toLowerCase() === features2[feature].toLowerCase())
            .length;

        // Weighted average (keywords: 60%, exact matches: 40%)
        return (keywordSimilarity * 0.6) + (exactMatches / 4 * 0.4);
    }

    extractBrand(words) {
        // Simplified brand extraction (would need a comprehensive brand database)
        const commonBrands = new Set(['nike', 'adidas', 'puma', 'levis', 'zara']);
        return words.find(word => commonBrands.has(word)) || '';
    }

    extractCategory(words) {
        const categories = new Set(['shirt', 'pants', 'dress', 'shoes', 'jacket']);
        return words.find(word => categories.has(word)) || '';
    }

    extractColor(words) {
        const colors = new Set(['red', 'blue', 'green', 'black', 'white', 'yellow']);
        return words.find(word => colors.has(word)) || '';
    }

    extractMaterial(words) {
        const materials = new Set(['cotton', 'polyester', 'wool', 'leather', 'denim']);
        return words.find(word => materials.has(word)) || '';
    }
}


window.TextAnalyzer = TextAnalyzer;