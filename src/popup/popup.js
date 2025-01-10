// src/popup/popup.js
class PopupManager {
    constructor() {
        this.elements = {
            loading: document.getElementById('loading'),
            currentProduct: document.getElementById('current-product'),
            productImage: document.getElementById('product-image'),
            productTitle: document.getElementById('product-title'),
            productPrice: document.getElementById('product-price'),
            productStore: document.getElementById('product-store'),
            couponsSection: document.getElementById('coupons-section'),
            couponsList: document.getElementById('coupons-list'),
            noCoupons: document.getElementById('no-coupons'),
            similarProductsSection: document.getElementById('similar-products-section'),
            productsGrid: document.getElementById('products-grid'),
            noProducts: document.getElementById('no-products'),
            errorMessage: document.getElementById('error-message')
        };

        this.init();
    }

    async init() {
        try {
            // Get the current tab
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });

            if (!tab) {
                throw new Error('No active tab found');
            }

            // Ensure content scripts are loaded
            await this.ensureContentScriptsLoaded(tab);

            // Try to get product details
            const productDetails = await this.getProductDetails(tab);
            this.handleProductDetails(productDetails);
        } catch (error) {
            console.error('Error initializing popup:', error);
            this.showError();
        }
    }

    async ensureContentScriptsLoaded(tab) {
        try {
            // Check if we can communicate with the content scripts
            await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        } catch (error) {
            // If content scripts aren't loaded, inject them manually
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [
                    'src/utils/imageAnalyzer.js',
                    'src/utils/textAnalyzer.js',
                    'src/utils/productAnalyzer.js',
                    'src/content/productDetector.js',
                    'src/content/content.js'
                ]
            });

            // Wait a bit for scripts to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async getProductDetails(tab) {
        try {
            return await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout getting product details'));
                }, 5000);

                chrome.tabs.sendMessage(
                    tab.id,
                    { type: 'GET_PRODUCT_DETAILS' },
                    response => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error getting product details:', error);
            throw error;
        }
    }

    handleProductDetails(productDetails) {
        // Hide the loading message
        this.elements.loading.classList.add('is-hidden');

        if (!productDetails) {
            this.showError();
            return;
        }

        // Show the product information
        this.displayCurrentProduct(productDetails);
        
        // Start loading coupons and similar products
        this.fetchCoupons(productDetails.domain);
        this.fetchSimilarProducts(productDetails);
    }

    displayCurrentProduct(product) {
        this.elements.currentProduct.classList.remove('is-hidden');
        this.elements.productImage.src = product.image || '';
        this.elements.productTitle.textContent = product.title || 'Product Title Not Available';
        this.elements.productPrice.textContent = product.price ? 
            `₹${product.price.toLocaleString('en-IN')}` : 'Price not available';
        this.elements.productStore.textContent = `Found on ${product.domain || 'this site'}`;
    }

    async fetchCoupons(domain) {
        this.elements.couponsSection.classList.remove('is-hidden');

        try {
            const coupons = await new Promise((resolve) => {
                const timeout = setTimeout(() => resolve([]), 5000);
                chrome.runtime.sendMessage({
                    type: 'GET_COUPONS',
                    domain: domain
                }, response => {
                    clearTimeout(timeout);
                    resolve(response || []);
                });
            });

            this.displayCoupons(coupons);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            this.elements.noCoupons.classList.remove('is-hidden');
        }
    }

    async fetchSimilarProducts(product) {
        this.elements.similarProductsSection.classList.remove('is-hidden');

        try {
            const similarProducts = await new Promise((resolve) => {
                const timeout = setTimeout(() => resolve([]), 10000);
                chrome.runtime.sendMessage({
                    type: 'FIND_SIMILAR_PRODUCTS',
                    data: product
                }, response => {
                    clearTimeout(timeout);
                    resolve(response || []);
                });
            });

            this.displaySimilarProducts(similarProducts);
        } catch (error) {
            console.error('Error finding similar products:', error);
            this.elements.noProducts.classList.remove('is-hidden');
        }
    }

    displayCoupons(coupons) {
        if (!coupons || coupons.length === 0) {
            this.elements.noCoupons.classList.remove('is-hidden');
            return;
        }

        this.elements.couponsList.innerHTML = coupons.map(coupon => `
            <div class="coupon-item">
                <div class="columns is-vcentered is-mobile">
                    <div class="column">
                        <p class="has-text-weight-semibold">${coupon.description}</p>
                        <p class="has-text-grey is-size-7">Code: ${coupon.code}</p>
                    </div>
                    <div class="column is-narrow">
                        <button class="button is-primary is-small copy-code" 
                                data-code="${coupon.code}">
                            Copy Code
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.couponsList.querySelectorAll('.copy-code').forEach(button => {
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(button.dataset.code);
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy Code';
                }, 2000);
            });
        });
    }

    displaySimilarProducts(products) {
        if (!products || products.length === 0) {
            this.elements.noProducts.classList.remove('is-hidden');
            return;
        }

        this.elements.productsGrid.innerHTML = products.map(product => `
            <div class="column is-6">
                <a href="${product.url}" target="_blank" class="card product-card">
                    <div class="card-image">
                        <figure class="image">
                            <img src="${product.image || ''}" alt="${product.title || 'Product Image'}" 
                                 onerror="this.src='../../assets/icons/placeholder.png'">
                        </figure>
                    </div>
                    <div class="card-content">
                        <p class="title is-6">${product.title || 'Product Title'}</p>
                        <p class="subtitle is-6 has-text-primary">
                            ${product.price ? `₹${product.price.toLocaleString('en-IN')}` : 'Price N/A'}
                        </p>
                        <p class="is-size-7 has-text-grey">${product.domain || 'Unknown Store'}</p>
                        <div class="mt-2">
                            <span class="tag is-info">
                                ${Math.round((product.similarityScore || 0) * 100)}% match
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
    }

    showError() {
        this.elements.loading.classList.add('is-hidden');
        this.elements.errorMessage.classList.remove('is-hidden');
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});