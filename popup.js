//this is also a placeholder dawgs
const coupons = [
    { code: "SAVE10", description: "10% Off", link: "#" },
    { code: "FREESHIP", description: "Free Shipping", link: "#" }
];
//this is just a placeholder broskis
const similarProducts = [
    { image: "https://via.placeholder.com/150", name: "Product 1", price: "$50", store: "Store A", link: "#" },
    { image: "https://via.placeholder.com/150", name: "Product 2", price: "$40", store: "Store B", link: "#" }
];

// Populate Coupons Section
const couponsList = document.getElementById("coupons-list");
const noCoupons = document.getElementById("no-coupons");

if (coupons.length > 0) {
    coupons.forEach((coupon) => {
        const couponItem = document.createElement("div");
        couponItem.className = "coupon-item";
        couponItem.innerHTML = `
            <div class="columns is-vcentered is-mobile">
                <div class="column">
                    <p class="has-text-weight-semibold">${coupon.description}</p>
                    <p class="has-text-grey is-size-7">Code: ${coupon.code}</p>
                </div>
                <div class="column is-narrow">
                    <div class="buttons are-small">
                        <button class="button is-light" onclick="copyCode('${coupon.code}')">
                            <span class="icon"><i class="fas fa-copy"></i></span>
                        </button>
                        <a href="${coupon.link}" class="button is-primary">
                            <span class="icon"><i class="fas fa-external-link-alt"></i></span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        couponsList.appendChild(couponItem);
    });
} else {
    noCoupons.classList.remove("is-hidden");
}

// Populate Similar Products Section
const productsGrid = document.getElementById("products-grid");
const noProducts = document.getElementById("no-products");

if (similarProducts.length > 0) {
    similarProducts.forEach((product) => {
        const productCard = document.createElement("div");
        productCard.className = "column is-6";
        productCard.innerHTML = `
            <div class="card product-card">
                <div class="card-image">
                    <figure class="image product-image">
                        <img src="${product.image}" alt="${product.name}">
                        <span class="store-badge">${product.store}</span>
                    </figure>
                </div>
                <div class="card-content">
                    <p class="title is-6">${product.name}</p>
                    <p class="subtitle is-6 has-text-primary has-text-weight-bold">${product.price}</p>
                    <a href="${product.link}" class="button is-primary is-fullwidth is-small">
                        View Details
                    </a>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
} else {
    noProducts.classList.remove("is-hidden");
}

function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        // Show Bulma notification
        const notification = document.createElement("div");
        notification.className = "notification is-success is-light";
        notification.innerHTML = `Coupon code "${code}" copied!`;
        document.querySelector(".section").prepend(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }).catch(() => {
        // Show error notification
        const notification = document.createElement("div");
        notification.className = "notification is-danger is-light";
        notification.innerHTML = "Failed to copy code.";
        document.querySelector(".section").prepend(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    });
}