// This class is responsible for finding product information on shopping websites
class ProductDetector {
    constructor() {
        // List of supported shopping sites and their HTML selectors
        this.SUPPORTED_SITES = {
            'amazon.in': {
                titleSelector: '#productTitle',
                priceSelector: '.a-price-whole',
                imageSelector: '#landingImage',
                // Additional selectors for different product page layouts
                alternativePriceSelectors: [
                    '#priceblock_ourprice',
                    '#priceblock_dealprice',
                    '.a-price .a-offscreen'
                ]
            },
            'flipkart.com': {
                titleSelector: '.B_NuCI',
                priceSelector: '._30jeq3._16Jk6d',
                imageSelector: '._396cs4',
                alternativePriceSelectors: [
                    '._30jeq3'
                ]
            },
            'myntra.com': {
                titleSelector: '.pdp-title',
                priceSelector: '.pdp-price strong',
                imageSelector: '.image-grid-image',
                alternativePriceSelectors: [
                    '.pdp-mrp strong'
                ]
            },
            'ajio.com': {
                titleSelector: '.prod-name',
                priceSelector: '.prod-sp',
                imageSelector: '.zoom-wrap img',
                alternativePriceSelectors: [
                    '.prod-cp'
                ]
            },
            'snapdeal.com': {
                titleSelector: '.pdp-e-i-head',
                priceSelector: '.payBlkBig',
                imageSelector: '#bx-slider-left-image-panel img',
                alternativePriceSelectors: [
                    '.pdpCutPrice'
                ]
            }
        };

        this.site = this.SUPPORTED_SITES[this.getCurrentDomain()];
    }

    // Helper function to get the current website's domain
    getCurrentDomain() {
        return window.location.hostname.replace('www.', '');
    }

    // Helper function to clean up text (remove extra spaces, etc.)
    cleanText(text) {
        if (!text) return '';
        return text.trim().replace(/\s+/g, ' ');
    }

    // Helper function to extract price from text
    extractPrice(text) {
        if (!text) return null;
        
        // Remove common Indian currency symbols and text
        text = text.replace(/^₹|,|rs\.?|rupees?/gi, '').trim();
        
        // Extract the number
        const match = text.match(/(\d+(?:\.\d+)?)/);
        if (!match) return null;
        
        return parseFloat(match[1]);
    }

    // Main function to detect product information
    detectProduct() {
        // If we're not on a supported shopping site, return null
        if (!this.site) return null;

        // Get all product information
        const productInfo = {
            title: this.getProductTitle(),
            price: this.getProductPrice(),
            image: this.getProductImage(),
            url: window.location.href,
            domain: this.getCurrentDomain()
        };

        // Only return the product if we found at least a title
        return productInfo.title ? productInfo : null;
    }

    // Function to find and get the product title
    getProductTitle() {
        try {
            const element = document.querySelector(this.site.titleSelector);
            return this.cleanText(element?.textContent);
        } catch (error) {
            console.error('Error getting product title:', error);
            return '';
        }
    }

    // Function to find and get the product price
    getProductPrice() {
        try {
            // Try the main price selector first
            let priceElement = document.querySelector(this.site.priceSelector);
            let price = null;

            if (priceElement) {
                price = this.extractPrice(priceElement.textContent);
            }

            // If main selector failed, try alternatives
            if (!price && this.site.alternativePriceSelectors) {
                for (let selector of this.site.alternativePriceSelectors) {
                    priceElement = document.querySelector(selector);
                    if (priceElement) {
                        price = this.extractPrice(priceElement.textContent);
                        if (price) break;
                    }
                }
            }

            return price;
        } catch (error) {
            console.error('Error getting product price:', error);
            return null;
        }
    }


    // Function to find and get the product image
    getProductImage() {
        try {
            const element = document.querySelector(this.site.imageSelector);
            return element?.src || '';
        } catch (error) {
            console.error('Error getting product image:', error);
            return '';
        }
    }
}

// Make the class available globally
window.ProductDetector = ProductDetector;