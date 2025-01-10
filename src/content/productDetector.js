class ProductDetector {
    constructor() {
        this.SUPPORTED_SITES = {
            'amazon.in': {
                titleSelector: '#productTitle',
                priceSelector: '.a-price-whole',
                imageSelector: '#landingImage',
                alternativePriceSelectors: [
                    '#priceblock_ourprice',
                    '#priceblock_dealprice',
                    '.a-price .a-offscreen'
                ],
                searchResults: {
                    container: '.s-result-item[data-asin]',
                    title: 'h2 .a-link-normal',
                    price: '.a-price-whole',
                    image: '.s-image',
                    link: 'h2 .a-link-normal'
                }
            },
            'flipkart.com': {
                titleSelector: '.B_NuCI',
                priceSelector: '._30jeq3._16Jk6d',
                imageSelector: '._396cs4',
                alternativePriceSelectors: [
                    '._30jeq3'
                ],
                searchResults: {
                    container: '._1AtVbE',
                    title: '._4rR01T',
                    price: '._30jeq3',
                    image: '._396cs4',
                    link: '._1fQZEK'
                }
            },
            'myntra.com': {
                titleSelector: '.pdp-title',
                priceSelector: '.pdp-price strong',
                imageSelector: '.image-grid-image',
                alternativePriceSelectors: [
                    '.pdp-mrp strong'
                ],
                searchResults: {
                    container: '.product-base',
                    title: '.product-brand',
                    price: '.product-price',
                    image: '.product-image',
                    link: 'a'
                }
            },
            'ajio.com': {
                titleSelector: '.prod-name',
                priceSelector: '.prod-sp',
                imageSelector: '.zoom-wrap img',
                alternativePriceSelectors: [
                    '.prod-cp'
                ],
                searchResults: {
                    container: '.item',
                    title: '.nameCls',
                    price: '.price',
                    image: '.img-radius',
                    link: 'a'
                }
            },
            'snapdeal.com': {
                titleSelector: '.pdp-e-i-head',
                priceSelector: '.payBlkBig',
                imageSelector: '#bx-slider-left-image-panel img',
                alternativePriceSelectors: [
                    '.pdpCutPrice'
                ],
                searchResults: {
                    container: '.product-tuple-listing',
                    title: '.product-title',
                    price: '.product-price',
                    image: '.product-image img',
                    link: '.product-title'
                }
            }
        };

        this.site = this.SUPPORTED_SITES[this.getCurrentDomain()];
    }

    detectSearchResults() {
        if (!this.site?.searchResults) return [];
        
        const results = [];
        const containers = document.querySelectorAll(this.site.searchResults.container);
        let count = 0;
        
        containers.forEach(container => {
            try {
                if (count >= 10) return;
                
                const titleElem = container.querySelector(this.site.searchResults.title);
                const priceElem = container.querySelector(this.site.searchResults.price);
                const imageElem = container.querySelector(this.site.searchResults.image);
                const linkElem = container.querySelector(this.site.searchResults.link);

                if (titleElem && (priceElem || linkElem)) {
                    const title = this.cleanText(titleElem.textContent);
                    const price = this.extractPrice(priceElem?.textContent);
                    const url = linkElem?.href || '';
                    
                    if (title && title.length > 5 && url && !url.includes('javascript:')) {
                        results.push({
                            title,
                            price,
                            image: imageElem?.src || '',
                            url,
                            domain: this.getCurrentDomain()
                        });
                        count++;
                    }
                }
            } catch (error) {
                console.error('Error extracting search result:', error);
            }
        });

        return results;
    }

    getCurrentDomain() {
        return window.location.hostname.replace('www.', '');
    }

    cleanText(text) {
        if (!text) return '';
        return text.trim().replace(/\s+/g, ' ');
    }

    extractPrice(text) {
        if (!text) return null;
        
        text = text.toLowerCase()
            .replace(/[₹₨rs.]/gi, '')
            .replace(/,/g, '')
            .replace(/[^0-9.]/g, '')
            .trim();
        
        const price = parseFloat(text);
        return isNaN(price) ? null : price;
    }

    detectProduct() {
        if (!this.site) return null;

        const productInfo = {
            title: this.getProductTitle(),
            price: this.getProductPrice(),
            image: this.getProductImage(),
            url: window.location.href,
            domain: this.getCurrentDomain()
        };

        return productInfo.title ? productInfo : null;
    }

    getProductTitle() {
        try {
            const element = document.querySelector(this.site.titleSelector);
            return this.cleanText(element?.textContent);
        } catch (error) {
            console.error('Error getting product title:', error);
            return '';
        }
    }

    getProductPrice() {
        try {
            let priceElement = document.querySelector(this.site.priceSelector);
            let price = null;

            if (priceElement) {
                price = this.extractPrice(priceElement.textContent);
            }

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

window.ProductDetector = ProductDetector;