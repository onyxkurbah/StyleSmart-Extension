// This script runs in the background and manages data for the extension
console.log('StyleSmart: Background script initialized');

// Store information about products we've detected
let detectedProducts = [];

// Maximum number of products to remember
const MAX_STORED_PRODUCTS = 50;

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // When we find a new product
    if (message.type === 'PRODUCT_FOUND') {
        console.log('StyleSmart: New product detected:', message.data);
        
        // Add the new product to our list
        detectedProducts.push({
            ...message.data,
            dateDetected: new Date().toISOString()
        });
        
        // Keep only the most recent products
        if (detectedProducts.length > MAX_STORED_PRODUCTS) {
            detectedProducts.shift(); // Remove oldest product
        }

        // Save products to Chrome's storage for persistence
        chrome.storage.local.set({
            detectedProducts: detectedProducts
        });
    }
});

// When the extension starts, load any previously saved products
chrome.storage.local.get(['detectedProducts'], (result) => {
    if (result.detectedProducts) {
        detectedProducts = result.detectedProducts;
        console.log('StyleSmart: Loaded', detectedProducts.length, 'saved products');
    }
});