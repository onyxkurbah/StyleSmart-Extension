// src/content/content.js

class ContentScript {
    constructor() {
        this.productDetector = new ProductDetector();
        this.productAnalyzer = new ProductAnalyzer();
        this.setupMessageListener();
    }

    

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'GET_PRODUCT_DETAILS') {
                this.handleGetProductDetails(sendResponse);
                return true;
            } else if (message.type === 'PING') {
                sendResponse({ status: 'ok' });
                return true;
            }
        });
    }

    async handleGetProductDetails(sendResponse) {
        try {
            const product = await this.productDetector.detectProduct();
            if (!product) {
                sendResponse(null);
                return;
            }

            const analyzedProduct = await this.productAnalyzer.analyzeProduct(product);
            sendResponse(analyzedProduct);
        } catch (error) {
            console.error('Error handling product details request:', error);
            sendResponse(null);
        }
    }
}

// Initialize content script
new ContentScript();