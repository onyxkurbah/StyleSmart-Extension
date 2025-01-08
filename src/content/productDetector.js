// This class is responsible for finding product information on shopping websites
class ProductDetector {
    constructor() {
        // List of supported shopping sites and their HTML selectors
        this.SUPPORTED_SITES = {
            'amazon.com': {
                titleSelector: '#productTitle',
                priceSelector: '.a-price-whole',
                imageSelector: '#landingImage'
            },
            'zara.com': {
                titleSelector: '.product-detail-info h1',
                priceSelector: '.price__amount',
                imageSelector: '.media-image img'
            }
            // You can add more sites here later
        };

        // Get the current website's configuration
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
        const match = text.match(/[\d,.]+/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : null;
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
            const element = document.querySelector(this.site.priceSelector);
            return this.extractPrice(element?.textContent);
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