class ProductDetector {
    constructor() {
        this.siteDetectors = {
            'amazon.in': this.detectAmazonProduct.bind(this),
            'flipkart.com': this.detectFlipkartProduct.bind(this)
        };
        this.maxRetries = 10; // Maximum number of retries
        this.retryInterval = 1000; // Time between retries in milliseconds
    }

    async detectProduct() {
        const domain = window.location.hostname;
        const detector = this.getDetectorForDomain(domain);
        
        if (!detector) {
            return null;
        }

        try {
            const product = await detector();
            if (product) {
                product.domain = domain;
                product.url = window.location.href;
            }
            return product;
        } catch (error) {
            console.error('Error detecting product:', error);
            return null;
        }
    }

    getDetectorForDomain(domain) {
        return Object.entries(this.siteDetectors)
            .find(([key]) => domain.includes(key))?.[1];
    }

    // Helper function to wait for an element
    waitForElement(selector, maxRetries = this.maxRetries) {
        return new Promise((resolve) => {
            let retries = 0;

            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                retries++;
                if (retries < maxRetries) {
                    setTimeout(checkElement, this.retryInterval);
                } else {
                    resolve(null); // Resolve with null if element is not found after max retries
                }
            };

            checkElement();
        });
    }

    // Helper function to wait for any of the provided selectors
    async waitForAnyElement(selectors, maxRetries = this.maxRetries) {
        for (let retry = 0; retry < maxRetries; retry++) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element;
                }
            }
            await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        }
        return null;
    }

    async detectAmazonProduct() {
        // Main product title
        const title = document.getElementById('productTitle')?.textContent.trim();
        if (!title) return null;

        // Price - handle different price element structures
        let price = null;
        const priceElement = document.querySelector('.a-price-whole, #priceblock_ourprice, #priceblock_dealprice');
        if (priceElement) {
            price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
        }

        // Get the main product image
        const image = document.getElementById('landingImage')?.src ||
                     document.getElementById('imgBlkFront')?.src;

        // Get category from breadcrumb
        const categoryElement = document.querySelector('#wayfinding-breadcrumbs_feature_div .a-link-normal');
        const category = categoryElement?.textContent.trim() || '';

        return { title, price, image, category };
    }

    async detectFlipkartProduct() {
        try {
            // Wait for the page to load by checking for any of these title selectors
            const titleSelectors = [
                'span[class*="B_NuCI"]',
                'span[class*="_35KyD6"]',
                'h1[class*="yhB1nd"]',
                'h1.page-title'
            ];

            const titleElement = await this.waitForAnyElement(titleSelectors);
            if (!titleElement) {
                console.log('Title element not found after retries');
                return null;
            }

            const title = titleElement.textContent.trim();

            // Price selectors
            const priceSelectors = [
                'div[class*="_30jeq3"]',
                'div[class*="_1vC4OE"]',
                'div._16Jk6d'
            ];

            const priceElement = await this.waitForAnyElement(priceSelectors);
            let price = null;
            if (priceElement) {
                price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
            }

            // Image selectors
            const imageSelectors = [
                'img[class*="_396cs4"]',
                'img[class*="q6DClP"]',
                'img._396QI4',
                'img[class*="_2r_T1I"]'
            ];

            const imageElement = await this.waitForAnyElement(imageSelectors);
            const image = imageElement?.src;

            // Category selectors
            const categorySelectors = [
                'a[class*="_2whKao"]',
                'a[class*="_1KHd47"]',
                'div._3GIHBu a',
                'div[class*="path"] a'
            ];

            const categoryElement = await this.waitForAnyElement(categorySelectors);
            const category = categoryElement?.textContent.trim() || '';

            // Verify we have the minimum required data
            if (title && (price || image)) {
                return { title, price, image, category };
            }

            console.log('Missing required product data');
            return null;
        } catch (error) {
            console.error('Error detecting Flipkart product:', error);
            return null;
        }
    }

    // Helper method to observe DOM changes for a specific selector
    observeForElement(selector, callback, timeout = 10000) {
        return new Promise((resolve) => {
            // First, check if element already exists
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                resolve();
                return;
            }

            // Set up mutation observer
            const observer = new MutationObserver((mutations) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    callback(element);
                    resolve();
                }
            });

            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Set timeout
            setTimeout(() => {
                observer.disconnect();
                resolve();
            }, timeout);
        });
    }
}

// Export for use in other modules
window.ProductDetector = ProductDetector;