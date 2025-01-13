class BackgroundScript {
    constructor() {
        this.setupMessageListener();
        this.productCache = new Map();
        this.rapidApiKey = '78fd557f25mshe39c0d4c5c2851cp15794cjsn9b95dbf86b42';
        this.amazonApiHost = 'real-time-amazon-data.p.rapidapi.com';
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
            // Only proceed with Amazon search if the source is from Snapdeal
            if (sourceProduct.domain !== 'snapdeal.com') {
                sendResponse([]);
                return;
            }

            const amazonProducts = await this.searchAmazonProducts(sourceProduct);

            // Enhanced similarity calculation for Snapdeal products
            const productsWithScores = amazonProducts.map(product => ({
                ...product,
                similarityScore: this.calculateSnapdealAmazonSimilarity(sourceProduct, product)
            }));

            // Filter and sort by similarity
            const similarProducts = productsWithScores
                .filter(product => product.similarityScore > 0.4) // Higher threshold for better matches
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
            // Clean and optimize the search query for better matches
            const searchQuery = this.optimizeSearchQuery(sourceProduct.title);
            
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

            return products.map(item => ({
                title: item.product_title || '',
                price: this.extractPrice(item.product_price),
                image: item.product_photo,
                url: item.product_url,
                domain: 'amazon.in',
                category: sourceProduct.category,
                rating: item.product_star_rating,
                reviews: item.product_num_ratings,
                originalPrice: this.extractPrice(item.original_price)
            })).filter(product => 
                product.title && 
                product.price && 
                product.image && 
                this.isPriceInRange(product.price, sourceProduct.price)
            );
        } catch (error) {
            console.error('Error fetching Amazon products:', error);
            return [];
        }
    }

    optimizeSearchQuery(title) {
        // Remove common Snapdeal-specific terms and noise
        return title
            .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
            .replace(/snapdeal|free shipping|sale|discount/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .slice(0, 4) // Take first 4 words for more focused search
            .join(' ');
    }

    isPriceInRange(price1, price2) {
        if (!price1 || !price2) return true;
        const margin = 0.5; // 50% price difference threshold
        const ratio = price1 / price2;
        return ratio >= (1 - margin) && ratio <= (1 + margin);
    }

    calculateSnapdealAmazonSimilarity(snapdealProduct, amazonProduct) {
        let score = 0;
        
        // Brand and model matching (higher weight)
        const snapdealBrand = this.extractBrand(snapdealProduct.title);
        const amazonBrand = this.extractBrand(amazonProduct.title);
        if (snapdealBrand && amazonBrand && 
            snapdealBrand.toLowerCase() === amazonBrand.toLowerCase()) {
            score += 0.4;
        }

        // Price similarity (adjusted weight)
        const priceDiff = Math.abs(snapdealProduct.price - amazonProduct.price);
        const priceScore = Math.max(0, 0.3 - (priceDiff / snapdealProduct.price) * 0.3);
        score += priceScore;

        // Title similarity (focusing on key terms)
        const keywordsScore = this.calculateKeywordSimilarity(
            snapdealProduct.title,
            amazonProduct.title
        );
        score += keywordsScore * 0.3;

        return Math.min(1, score);
    }

    extractBrand(title) {
        // Common brand extraction logic
        const words = title.split(' ');
        return words[0]; // Usually, the brand is the first word
    }

    calculateKeywordSimilarity(title1, title2) {
        const keywords1 = this.getKeywords(title1);
        const keywords2 = this.getKeywords(title2);
        
        const commonWords = keywords1.filter(word => 
            keywords2.some(w2 => 
                w2.includes(word) || word.includes(w2)
            )
        );

        return commonWords.length / Math.max(keywords1.length, keywords2.length);
    }

    getKeywords(text) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
            'for', 'with', 'free', 'shipping', 'sale', 'discount', 'new', 
            'latest', 'best', 'buy', 'shop', 'online'
        ]);

        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => 
                !stopWords.has(word) && 
                word.length > 2
            );
    }

    extractPrice(priceString) {
        if (!priceString) return null;
        const numericPrice = priceString.replace(/[^0-9.]/g, '');
        return parseFloat(numericPrice) || null;
    }
}

new BackgroundScript();