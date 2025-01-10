// src/content/content.js
const MESSAGE_TYPES = {
    PRODUCT_FOUND: 'PRODUCT_FOUND',
    GET_PRODUCT_DETAILS: 'GET_PRODUCT_DETAILS',
    PING: 'PING'
};

// Function to initialize our product detection
function init() {
    console.log('StyleSmart: Initializing product detection...');
    
    try {
        // Create a new product detector
        const detector = new ProductDetector();
        
        // Try to detect a product on the page
        const productInfo = detector.detectProduct();

        // If we found a product, send it to the background script
        if (productInfo) {
            console.log('StyleSmart: Product found:', productInfo);
            chrome.runtime.sendMessage({
                type: MESSAGE_TYPES.PRODUCT_FOUND,
                data: productInfo
            });
        }
    } catch (error) {
        console.error('StyleSmart: Error in product detection:', error);
    }
}

// Start detection when the page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        switch (message.type) {
            case MESSAGE_TYPES.GET_PRODUCT_DETAILS:
                const detector = new ProductDetector();
                const productInfo = detector.detectProduct();
                sendResponse(productInfo);
                break;

            case MESSAGE_TYPES.PING:
                // Respond to ping to confirm content scripts are loaded
                sendResponse(true);
                break;

            default:
                sendResponse(null);
        }
    } catch (error) {
        console.error('StyleSmart: Error handling message:', error);
        sendResponse(null);
    }
    return true; // Keep the message channel open for async responses
});