// This class manages everything that happens in the popup window
class PopupManager {
    constructor() {
        // Store references to DOM elements we'll need frequently
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

        // Initialize the popup
        this.init();
    }

    // Start the popup functionality
    async init() {
        try {
            // Get the current tab
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });

            // Ask the content script to detect any product on the page
            chrome.tabs.sendMessage(
                tab.id,
                { type: 'GET_PRODUCT_DETAILS' },
                this.handleProductDetails.bind(this)
            );
        } catch (error) {
            console.error('Error initializing popup:', error);
            this.showError();
        }
    }

    // Handle the product information we get back from the content script
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

    // Display the current product in the popup
    displayCurrentProduct(product) {
        // Show the product section
        this.elements.currentProduct.classList.remove('is-hidden');
        
        // Update the product information
        this.elements.productImage.src = product.image;
        this.elements.productTitle.textContent = product.title;
        this.elements.productPrice.textContent = 
            product.price ? `$${product.price.toFixed(2)}` : 'Price not available';
        this.elements.productStore.textContent = 
            `Found on ${product.domain}`;
    }

    // Fetch available coupons for the current store
    async fetchCoupons(domain) {
        // Show the coupons section
        this.elements.couponsSection.classList.remove('is-hidden');

        // For now, we'll use sample coupons
        // In a real extension, you would fetch these from an API
        const sampleCoupons = [
            { code: 'SAVE10', description: '10% off your purchase' },
            { code: 'FREESHIP', description: 'Free shipping on orders over $50' }
        ];

        this.displayCoupons(sampleCoupons);
    }

    // Display the coupons in the popup
    displayCoupons(coupons) {
        if (!coupons || coupons.length === 0) {
            this.elements.noCoupons.classList.remove('is-hidden');
            return;
        }

        // Create HTML for each coupon
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

        // Add click handlers for the copy buttons
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

    // Fetch similar products
    async fetchSimilarProducts(product) {
        // Show the similar products section
        this.elements.similarProductsSection.classList.remove('is-hidden');

        // For now, we'll use sample similar products
        // In a real extension, you would use an API to find similar products
        const sampleProducts = [
            {
                title: 'Similar Style Product',
                price: 49.99,
                store: 'OtherStore.com',
                image: product.image
            },
            {
                title: 'Alternative Option',
                price: 39.99,
                store: 'FashionStore.com',
                image: product.image
            }
        ];

        this.displaySimilarProducts(sampleProducts);
    }

    // Display similar products in the popup
    displaySimilarProducts(products) {
        if (!products || products.length === 0) {
            this.elements.noProducts.classList.remove('is-hidden');
            return;
        }

        // Create HTML for each similar product
        this.elements.productsGrid.innerHTML = products.map(product => `
            <div class="column is-6">
                <div class="card product-card">
                    <div class="card-image">
                        <figure class="image">
                            <img src="${product.image}" alt="${product.title}">
                        </figure>
                    </div>
                    <div class="card-content">
                        <p class="title is-6">${product.title}</p>
                        <p class="subtitle is-6 has-text-primary">$${product.price}</p>
                        <p class="is-size-7 has-text-grey">${product.store}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Show error message when something goes wrong
    showError() {
        this.elements.errorMessage.classList.remove('is-hidden');
    }
}

// When the popup HTML is loaded, create a new PopupManager
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});