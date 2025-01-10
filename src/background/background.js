// Enhanced background.js with improved product analysis and search functionality

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

    compareTexts(text1, text2) {
        if (!text1 || !text2) return 0;
        
        const tokens1 = this.tokenize(text1);
        const tokens2 = this.tokenize(text2);
        
        const tf1 = this.calculateTermFrequency(tokens1);
        const tf2 = this.calculateTermFrequency(tokens2);
        
        return this.calculateCosineSimilarity(tf1, tf2);
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .map(word => this.stemWord(word));
    }

    stemWord(word) {
        return word
            .replace(/ing$/, '')
            .replace(/ed$/, '')
            .replace(/s$/, '')
            .replace(/ly$/, '');
    }

    calculateTermFrequency(tokens) {
        const tf = {};
        tokens.forEach(token => {
            tf[token] = (tf[token] || 0) + 1;
        });
        return tf;
    }

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

    comparePrices(price1, price2) {
        if (!price1 || !price2) return 0.5;
        
        const maxPrice = Math.max(price1, price2);
        const minPrice = Math.min(price1, price2);
        const priceDiffPercent = (maxPrice - minPrice) / maxPrice;
        
        if (priceDiffPercent <= 0.1) return 1;
        if (priceDiffPercent <= 0.2) return 0.8;
        if (priceDiffPercent <= 0.3) return 0.6;
        if (priceDiffPercent <= 0.5) return 0.4;
        return 0.2;
    }

    async compareImages(imageUrl1, imageUrl2) {
        try {
            if (!imageUrl1 || !imageUrl2) return 0.5;

            const offscreenCanvas = new OffscreenCanvas(32, 32);
            const ctx = offscreenCanvas.getContext('2d');

            const hash1 = await this.getImageHash(imageUrl1, offscreenCanvas, ctx);
            const hash2 = await this.getImageHash(imageUrl2, offscreenCanvas, ctx);

            if (!hash1 || !hash2) return 0.5;

            const distance = this.calculateHammingDistance(hash1, hash2);
            return 1 - (distance / (32 * 32));
        } catch (error) {
            console.error('Error comparing images:', error);
            return 0.5;
        }
    }

    async getImageHash(imageUrl, canvas, ctx) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            
            ctx.drawImage(bitmap, 0, 0, 32, 32);
            const imageData = ctx.getImageData(0, 0, 32, 32).data;
            
            let hash = '';
            for (let i = 0; i < imageData.length; i += 4) {
                const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
                hash += avg < 128 ? '0' : '1';
            }
            return hash;
        } catch (error) {
            console.error('Error generating image hash:', error);
            return null;
        }
    }

    calculateHammingDistance(str1, str2) {
        let distance = 0;
        for (let i = 0; i < str1.length; i++) {
            if (str1[i] !== str2[i]) distance++;
        }
        return distance;
    }
}

// Enhanced background.js with improved product analysis and search functionality
class ProductSearchManager {
    constructor() {
        this.analyzer = new ProductAnalyzer();
        this.SEARCH_TIMEOUT = 15000;
        this.MAX_RETRIES = 3;
        this.SHOPPING_SITES = {
            'amazon.in': {
                searchUrl: 'https://www.amazon.in/s?k=',
                urlEncode: (term) => encodeURIComponent(term)
            },
            'flipkart.com': {
                searchUrl: 'https://www.flipkart.com/search?q=',
                urlEncode: (term) => encodeURIComponent(term)
            },
            'myntra.com': {
                searchUrl: 'https://www.myntra.com/search?q=',
                urlEncode: (term) => encodeURIComponent(term)
            },
            'ajio.com': {
                searchUrl: 'https://www.ajio.com/search/?text=',
                urlEncode: (term) => encodeURIComponent(term)
            },
            'snapdeal.com': {
                searchUrl: 'https://www.snapdeal.com/search?keyword=',
                urlEncode: (term) => encodeURIComponent(term)
            }
        };
    }

    async findSimilarProducts(product) {
        const searchResults = await this.searchAllSites(product);
        return this.filterAndRankResults(product, searchResults);
    }

    async searchAllSites(product) {
        const searchTerms = this.generateSearchKeywords(product);
        const currentDomain = new URL(product.url).hostname;
        const allResults = [];

        for (const [domain, siteConfig] of Object.entries(this.SHOPPING_SITES)) {
            try {
                const results = await this.searchSingleSiteWithRetry(domain, siteConfig, searchTerms);
                allResults.push(...results);
            } catch (error) {
                console.error(`Error searching ${domain}:`, error);
            }
        }

        return allResults;
    }

    async searchSingleSiteWithRetry(domain, siteConfig, searchTerms, retryCount = 0) {
        try {
            const tab = await chrome.tabs.create({
                url: siteConfig.searchUrl + siteConfig.urlEncode(searchTerms),
                active: false
            });

            await new Promise(resolve => setTimeout(resolve, 5000));

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [
                    'src/utils/textAnalyzer.js',
                    'src/utils/productAnalyzer.js',
                    'src/content/productDetector.js'
                ]
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const detector = new ProductDetector();
                    return detector.detectSearchResults();
                }
            });

            await chrome.tabs.remove(tab.id);
            return results[0]?.result || [];

        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.searchSingleSiteWithRetry(domain, siteConfig, searchTerms, retryCount + 1);
            }
            throw error;
        }
    }

    generateSearchKeywords(product) {
        const title = product.title.toLowerCase();
        
        const brandMatch = title.match(/^([\w\-]+)/);
        const brand = brandMatch ? brandMatch[1] : '';
        
        const words = title
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['with', 'for', 'from', 'the', 'and', 'buy', 'online'].includes(word));
        
        const keyTerms = words
            .filter(word => !word.includes(brand))
            .filter((word, index, self) => self.indexOf(word) === index)
            .slice(0, 4);
        
        return brand ? `${brand} ${keyTerms.join(' ')}` : keyTerms.join(' ');
    }

    async filterAndRankResults(originalProduct, searchResults) {
        const textFilteredResults = searchResults.filter(product => {
            const titleSimilarity = this.analyzer.compareTexts(originalProduct.title, product.title);
            return titleSimilarity >= 0.2;
        });

        const analyzedResults = await Promise.all(
            textFilteredResults.map(async product => {
                const titleSimilarity = this.analyzer.compareTexts(originalProduct.title, product.title);
                const priceSimilarity = this.analyzer.comparePrices(originalProduct.price, product.price);
                
                const similarityScore = (titleSimilarity * 0.7) + (priceSimilarity * 0.3);
                
                return {
                    ...product,
                    similarityScore
                };
            })
        );

        return analyzedResults
            .filter(product => product.similarityScore >= 0.25)
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, 6);
    }
}

const searchManager = new ProductSearchManager();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FIND_SIMILAR_PRODUCTS') {
        searchManager.findSimilarProducts(message.data)
            .then(results => sendResponse(results))
            .catch(error => {
                console.error('Error finding similar products:', error);
                sendResponse([]);
            });
        return true;
    }

    if (message.type === 'GET_COUPONS') {
        sendResponse([]);
        return true;
    }
});

// Ok does it search multiple fashion shopping websites for similar products too?