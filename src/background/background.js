// src/background/background.js
class BackgroundScript {
    constructor() {
        this.setupMessageListener();
        this.productCache = new Map();
        this.rapidApiKey = '78fd557f25mshe39c0d4c5c2851cp15794cjsn9b95dbf86b42';
        this.amazonApiHost = 'real-time-amazon-data.p.rapidapi.com';
        this.flipkartApiHost = 'real-time-flipkart-api.p.rapidapi.com';
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'FIND_SIMILAR_PRODUCTS') {
                this.handleFindSimilarProducts(message.data, sendResponse);
                return true;
            }
        });
    }

    async handleFindSimilarProducts(sourceProduct, sendResponse) {
        try {
            // Get products from both Amazon and Flipkart
            const amazonProducts = await this.searchAmazonProducts(sourceProduct);
            const flipkartProducts = await this.searchFlipkartProducts(sourceProduct);

            // Combine all products
            let allProducts = [...amazonProducts, ...flipkartProducts];

            // Calculate similarity scores and sort
            const productsWithScores = allProducts.map(product => ({
                ...product,
                similarityScore: this.calculateSimilarity(sourceProduct, product)
            }));

            // Filter and sort by similarity
            const similarProducts = productsWithScores
                .filter(product => product.similarityScore > 0.3)
                .sort((a, b) => b.similarityScore - a.similarityScore)
                .slice(0, 6);

            sendResponse(similarProducts);
        } catch (error) {
            console.error('Error finding similar products:', error);
            sendResponse([]);
        }
    }

    async searchAmazonProducts(sourceProduct) {
        try {
            const searchQuery = sourceProduct.title.split(' ').slice(0, 3).join(' ');
            
            const url = `https://${this.amazonApiHost}/search?query=${encodeURIComponent(searchQuery)}&country=IN`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.rapidApiKey,
                    'X-RapidAPI-Host': this.amazonApiHost
                }
            });

            if (!response.ok) {
                throw new Error('Amazon API request failed');
            }

            const data = await response.json();
            const products = data.data?.products || [];

            // Transform Amazon API response to match our format
            return products.map(item => ({
                title: item.product_title || '',
                price: this.extractPrice(item.product_price),
                image: item.product_photo,
                url: item.product_url,
                domain: 'amazon.in',
                category: sourceProduct.category,
                rating: item.product_star_rating,
                reviews: item.product_num_ratings
            })).filter(product => product.title && product.price && product.image);
        } catch (error) {
            console.error('Error fetching Amazon products:', error);
            return [];
        }
    }

    async searchFlipkartProducts(sourceProduct) {
        try {
            const searchQuery = sourceProduct.title.split(' ').slice(0, 3).join(' ');

            const url = `https://${this.flipkartApiHost}/search-products?query=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.rapidApiKey,
                    'X-RapidAPI-Host': this.flipkartApiHost
                }
            });

            if (!response.ok) {
                throw new Error('Flipkart API request failed');
            }

            const data = await response.json();
            const products = data.data || [];

            // Transform Flipkart API response to match our format
            return products.map(item => ({
                title: item.name || '',
                price: this.extractPrice(item.price),
                image: item.thumbnail,
                url: item.url,
                domain: 'flipkart.com',
                category: sourceProduct.category,
                rating: item.rating,
                reviews: item.reviews_count
            })).filter(product => product.title && product.price && product.image);
        } catch (error) {
            console.error('Error fetching Flipkart products:', error);
            return [];
        }
    }

    extractPrice(priceString) {
        if (!priceString) return null;
        // Extract numeric price from strings like "₹1,234" or "1,234.00"
        const numericPrice = priceString.replace(/[^0-9.]/g, '');
        return parseFloat(numericPrice) || null;
    }

    calculateSimilarity(product1, product2) {
        let score = 0;
        
        // Category match (0.3)
        if (product1.category && product2.category && 
            product1.category.toLowerCase() === product2.category.toLowerCase()) {
            score += 0.3;
        }

        // Price similarity (0.2)
        const priceDiff = Math.abs(product1.price - product2.price);
        const priceScore = Math.max(0, 0.2 - (priceDiff / product1.price) * 0.2);
        score += priceScore;

        // Title similarity (0.5)
        const words1 = this.getKeywords(product1.title);
        const words2 = this.getKeywords(product2.title);
        const commonWords = words1.filter(word => words2.includes(word));
        const titleScore = (commonWords.length / Math.max(words1.length, words2.length)) * 0.5;
        score += titleScore;

        return score;
    }

    getKeywords(text) {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']);
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => !stopWords.has(word));
    }
}

// Initialize background script
new BackgroundScript();