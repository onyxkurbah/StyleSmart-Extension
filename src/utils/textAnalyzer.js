// src/utils/textAnalyzer.js
class TextAnalyzer {
    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
                  .replace(/[^\w\s]/g, '')
                  .split(/\s+/)
                  .filter(word => word.length > 2);
    }

    compareTwoTexts(text1, text2) {
        if (!text1 || !text2) return 0;
        
        const words1 = new Set(this.tokenize(text1));
        const words2 = new Set(this.tokenize(text2));
        
        const intersection = new Set(
            [...words1].filter(word => words2.has(word))
        );
        
        return intersection.size / Math.max(words1.size, words2.size);
    }
}

// Export to window object
window.TextAnalyzer = TextAnalyzer;