// app.js - SPA Router and Logic

// Mock Data
const apartments = [
    {
        id: 1,
        title: "Skyline Luxury Suites",
        price: 3450,
        priceCategory: "luxury",
        type: "2br",
        location: "Downtown Metropolis",
        beds: 2, baths: 2, sqft: 1200,
        image: "img/apt1.png",
        badge: "Featured",
        desc: "Experience the pinnacle of luxury living with panoramic city views, floor-to-ceiling windows, and world-class amenities right in the heart of downtown."
    },
    {
        id: 2,
        title: "Urban Brick Loft",
        price: 1850,
        priceCategory: "mid",
        type: "1br",
        location: "Arts District",
        beds: 1, baths: 1, sqft: 850,
        image: "img/apt2.png",
        badge: "",
        desc: "A cozy, stylish loft featuring exposed brick walls, warm lighting, and a modern open-plan kitchen perfect for entertaining."
    },
    {
        id: 3,
        title: "Oceanfront Serenity",
        price: 4200,
        priceCategory: "luxury",
        type: "studio",
        location: "Malibu Coast",
        beds: "Studio", baths: 1, sqft: 700,
        image: "img/apt3.png",
        badge: "New",
        desc: "Wake up to the sound of waves in this serene luxury coastal apartment with light wood floors and a breezy, airy atmosphere."
    }
];

// State
let favorites = new Set();
let currentFilter = 'all';
let currentSearch = '';

// View Templates
const Views = {
    home: () => `
        <header class="hero">
            <div class="hero-content">
                <h1>Find Your Dream Apartment Today</h1>
                <p>Discover hand-picked, premium apartments tailored for your lifestyle in top cities.</p>
                <div class="search-bar glass">
                    <div class="search-input">
                        <i class="fa-solid fa-location-dot"></i>
                        <input type="text" id="searchInput" placeholder="Search by name or location..." onkeyup="app.handleSearch(event)">
                    </div>
                    <button class="btn btn-primary btn-search" onclick="app.renderList()"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
                </div>
            </div>
        </header>
        <div class="view-container">
            <div class="section-header">
                <h2>Trending Apartments</h2>
                <div class="filters">
                    <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="app.setFilter('all')">All</button>
                    <button class="filter-btn ${currentFilter === 'studio' ? 'active' : ''}" onclick="app.setFilter('studio')">Studio</button>
                    <button class="filter-btn ${currentFilter === '1br' ? 'active' : ''}" onclick="app.setFilter('1br')">1 Bedroom</button>
                    <button class="filter-btn ${currentFilter === '2br' ? 'active' : ''}" onclick="app.setFilter('2br')">2 Bedrooms</button>
                </div>
            </div>
            <div class="apartment-grid" id="grid"></div>
            <div id="emptyState" class="empty-state" style="display: none;">
                <i class="fa-solid fa-building-circle-xmark"></i>
                <h3>No apartments found</h3>
                <p>Try adjusting your search filters.</p>
            </div>
        </div>
    `,
    favorites: () => `
        <div class="view-container">
            <div class="section-header">
                <h2>Your Favorites</h2>
            </div>
            <div class="apartment-grid" id="grid"></div>
            <div id="emptyState" class="empty-state" style="display: none;">
                <i class="fa-solid fa-heart-crack"></i>
                <h3>No favorites yet</h3>
                <p>Browse our listings and click the heart icon to save them here.</p>
            </div>
        </div>
    `,
    detail: (apt) => `
        <div class="view-container">
            <a class="btn-back" onclick="window.history.back()"><i class="fa-solid fa-arrow-left"></i> Back to listings</a>
            <div class="detail-view">
                <div class="detail-img">
                    <img src="${apt.image}" alt="${apt.title}">
                </div>
                <div class="detail-info">
                    ${apt.badge ? `<span class="card-badge" style="position:relative; top:0; left:0; display:inline-block; margin-bottom:1rem;">${apt.badge}</span>` : ''}
                    <h1>${apt.title}</h1>
                    <p class="card-location" style="font-size: 1.2rem;"><i class="fa-solid fa-location-dot"></i> ${apt.location}</p>
                    <div class="price">$${apt.price.toLocaleString()} <span>/ month</span></div>
                    
                    <div class="card-amenities" style="font-size: 1.1rem; margin-bottom: 2rem;">
                        <span><i class="fa-solid fa-bed"></i> ${apt.beds} ${apt.beds==='Studio'?'':'Beds'}</span>
                        <span><i class="fa-solid fa-bath"></i> ${apt.baths} Baths</span>
                        <span><i class="fa-solid fa-vector-square"></i> ${apt.sqft} sqft</span>
                    </div>
                    
                    <h3>Description</h3>
                    <p style="color: var(--text-muted); margin-top: 1rem; margin-bottom: 2rem;">${apt.desc}</p>
                    
                    <button class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">Schedule a Tour</button>
                </div>
            </div>
        </div>
    `
};

// App Logic (Router & State Management)
const app = {
    init() {
        window.addEventListener('hashchange', this.router.bind(this));
        this.router();
        this.updateFavBadge();
    },

    router() {
        const hash = window.location.hash.slice(1) || '/';
        const root = document.getElementById('app');
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-path="${hash.split('/')[0] || '/'}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Route matching
        if (hash === '/' || hash === '') {
            root.innerHTML = Views.home();
            this.renderList();
        } else if (hash === '/favorites') {
            root.innerHTML = Views.favorites();
            this.renderList(true);
        } else if (hash.startsWith('/apartment/')) {
            const id = parseInt(hash.split('/')[2]);
            const apt = apartments.find(a => a.id === id);
            if (apt) {
                root.innerHTML = Views.detail(apt);
            } else {
                root.innerHTML = `<div class="view-container"><h1>Apartment not found</h1></div>`;
            }
        }
    },

    navigate(path) {
        window.location.hash = path;
    },

    setFilter(type) {
        currentFilter = type;
        this.router(); // Re-render view
    },

    handleSearch(e) {
        currentSearch = e.target.value.toLowerCase();
        if(e.key === 'Enter') this.renderList();
    },

    toggleFavorite(id, e) {
        e.stopPropagation();
        if (favorites.has(id)) {
            favorites.delete(id);
        } else {
            favorites.add(id);
        }
        this.updateFavBadge();
        // If in favorites view, remove it instantly
        if (window.location.hash === '#/favorites') {
            this.renderList(true);
        } else {
            // Just toggle the heart icon
            const btn = e.currentTarget;
            btn.classList.toggle('active');
            btn.innerHTML = favorites.has(id) ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
        }
    },

    updateFavBadge() {
        const badge = document.getElementById('fav-count');
        badge.innerText = favorites.size;
        badge.style.display = favorites.size > 0 ? 'inline-block' : 'none';
    },

    renderList(onlyFavorites = false) {
        const grid = document.getElementById('grid');
        const emptyState = document.getElementById('emptyState');
        if (!grid) return;

        let filtered = apartments;

        if (onlyFavorites) {
            filtered = filtered.filter(a => favorites.has(a.id));
        } else {
            if (currentFilter !== 'all') {
                filtered = filtered.filter(a => a.type === currentFilter);
            }
            if (currentSearch) {
                filtered = filtered.filter(a => 
                    a.title.toLowerCase().includes(currentSearch) || 
                    a.location.toLowerCase().includes(currentSearch)
                );
            }
        }

        if (filtered.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
            grid.innerHTML = filtered.map(apt => `
                <div class="apartment-card" onclick="app.navigate('/apartment/${apt.id}')">
                    <div class="card-img-wrapper">
                        <img src="${apt.image}" alt="${apt.title}">
                        ${apt.badge ? `<span class="card-badge">${apt.badge}</span>` : ''}
                        <button class="btn-favorite ${favorites.has(apt.id) ? 'active' : ''}" onclick="app.toggleFavorite(${apt.id}, event)">
                            ${favorites.has(apt.id) ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>'}
                        </button>
                    </div>
                    <div class="card-content">
                        <div class="card-price">$${apt.price.toLocaleString()} <span>/ month</span></div>
                        <h3 class="card-title">${apt.title}</h3>
                        <p class="card-location"><i class="fa-solid fa-location-dot"></i> ${apt.location}</p>
                        <div class="card-amenities">
                            <span><i class="fa-solid fa-bed"></i> ${apt.beds} ${apt.beds==='Studio'?'':'Beds'}</span>
                            <span><i class="fa-solid fa-bath"></i> ${apt.baths} Baths</span>
                            <span><i class="fa-solid fa-vector-square"></i> ${apt.sqft} sqft</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
};

// Expose to window for inline onclick handlers and logo click
window.app = app;
window.router = app;

// Bootstrap app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
