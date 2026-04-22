const app = {
    currentLang: 'ES',
    config: null,
    cache: {},

    setLanguage(lang) {
        this.currentLang = lang;
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`lang-${lang.toLowerCase()}`).classList.add('active');
        
        // Update nav and current view
        if(this.config) this.renderNav();
        this.handleRoute();
    },

    async fetchYaml(url) {
        if(this.cache[url]) return this.cache[url];
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('File not found');
            const text = await response.text();
            const data = jsyaml.load(text);
            this.cache[url] = data;
            return data;
        } catch (e) {
            console.error('Error loading YAML:', e);
            document.getElementById('app-content').innerHTML = `
                <div class="section container">
                    <h2 class="section-title">Error 404</h2>
                    <p class="section-subtitle">Content not found.</p>
                </div>`;
            return null;
        }
    },

    getText(obj) {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[this.currentLang] || '';
    },

    async init() {
        // Setup Mobile Menu Toggle
        document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
            document.getElementById('nav-links').classList.toggle('active');
        });

        // Set Date
        document.getElementById('year').textContent = new Date().getFullYear();

        this.config = await this.fetchYaml('data/config.yaml');
        if (this.config) {
            this.renderNav();
        }

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // initial
    },

    renderNav() {
        const nav = document.getElementById('nav-links');
        const items = this.config.nav;
        
        nav.innerHTML = `
            <a href="#home">${this.getText(items.home)}</a>
            <a href="#products">${this.getText(items.products)}</a>
            <a href="#spareparts">${this.getText(items.spareparts)}</a>
            <a href="#gallery">${this.getText(items.gallery)}</a>
            <a href="#about">${this.getText(items.about)}</a>
            <a href="#contact">${this.getText(items.contact)}</a>
        `;
        
        // Update footer copyright logo slogan if any
        document.title = this.config.site_name || 'GUBO Maquinaria';
    },

    showLoader() {
        document.getElementById('app-content').innerHTML = `
            <div class="loader">${this.currentLang === 'ES' ? 'Cargando...' : 'Loading...'}</div>`;
    },

    updateActiveNav(hash) {
        const base = hash.split('/')[0] || 'home';
        document.querySelectorAll('.nav-links a').forEach(a => {
            if(a.getAttribute('href') === '#' + base) a.classList.add('active');
            else a.classList.remove('active');
        });
        document.getElementById('nav-links').classList.remove('active');
    },

    async handleRoute() {
        const rawHash = window.location.hash.substring(1) || 'home';
        this.updateActiveNav(rawHash);
        this.showLoader();

        const parts = rawHash.split('/');
        const route = parts[0];
        
        // Scroll to top
        window.scrollTo(0, 0);

        if (route === 'home') await this.renderHome();
        else if (route === 'about') await this.renderAbout();
        else if (route === 'products') {
            if (parts[1]) await this.renderProduct(parts[1]);
            else await this.renderProducts();
        }
        else if (route === 'spareparts') await this.renderSpareParts();
        else if (route === 'gallery') await this.renderGallery();
        else if (route === 'contact') await this.renderContact();
        else await this.renderHome();
    },

    async renderHome() {
        const data = await this.fetchYaml('data/home.yaml');
        if(!data) return;
        
        const html = `
            <div class="hero-section" style="background-image: url('${data.hero_bg}')">
                <div class="hero-overlay"></div>
                <div class="hero-content container">
                    <h1 class="hero-title">${this.getText(data.hero_title)}</h1>
                    <p class="hero-subtitle">${this.getText(data.hero_subtitle)}</p>
                    <a href="#products" class="btn btn-primary">${this.getText(this.config.buttons.read_more)}</a>
                </div>
            </div>
            
            <div class="container section">
                <div class="media-embeds">
                    <div class="embed-container">
                        <h3>${this.getText(data.social_embeds.youtube.title)}</h3>
                        <div class="video-wrapper">
                            <iframe src="${data.social_embeds.youtube.url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                    <div class="embed-container">
                        <h3>${this.getText(data.social_embeds.instagram.title)}</h3>
                        <div class="insta-wrapper">
                            <!-- Instagram Embed Block (we use an iframe fallback for reliability if official embed blocks) -->
                            <iframe src="${data.social_embeds.instagram.url}embed" scrolling="no" allowtransparency="true"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
    },

    async renderAbout() {
        const data = await this.fetchYaml('data/about.yaml');
        if (!data) return;

        const sectionsHtml = (data.sections || []).map(s => `
            <div class="about-card glass-panel">
                <div class="about-card-icon">${s.icon}</div>
                <h3>${this.getText(s.heading)}</h3>
                <p>${this.getText(s.text)}</p>
            </div>
        `).join('');

        const html = `
            <div class="about-hero" style="background-image: url('${data.hero_image}')">
                <div class="about-hero-overlay"></div>
                <div class="about-hero-content container">
                    <p class="about-eyebrow">GUBO Maquinaria</p>
                    <h1>${this.getText(data.title)}</h1>
                    <p class="about-subtitle">${this.getText(data.subtitle)}</p>
                </div>
            </div>

            <div class="container section">
                <div class="about-intro-layout">
                    <div class="about-intro-text">
                        <p>${this.getText(data.intro)}</p>
                    </div>
                </div>

                <div class="about-cards">
                    ${sectionsHtml}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
    },

    async renderProducts() {
        const data = await this.fetchYaml('data/products.yaml');
        if(!data) return;

        let itemsHtml = '';
        
        for(let item of data.items) {
             const pData = await this.fetchYaml(item.file);
             if(pData) {
                 itemsHtml += `
                 <a href="#products/${item.id}" class="product-card">
                    <img class="product-image" src="${pData.images[0]}" alt="${pData.name}">
                    <div class="product-content">
                        <h3 class="product-title">${pData.name}</h3>
                        <p class="product-desc">${this.getText(pData.description)}</p>
                        <span class="btn btn-primary" style="align-self: flex-start; margin-top: 1rem;">${this.getText(this.config.buttons.see_product)}</span>
                    </div>
                 </a>
                 `;
             }
        }

        const html = `
            <div class="container section">
                <h2 class="section-title">${this.getText(data.title)}</h2>
                <p class="section-subtitle">${this.getText(data.description)}</p>
                <div class="products-grid">
                    ${itemsHtml}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
    },

    async renderProduct(id) {
        const cat = await this.fetchYaml('data/products.yaml');
        if(!cat) return;
        const mapped = cat.items.find(i => i.id === id);
        if(!mapped) { this.renderProducts(); return; }

        const data = await this.fetchYaml(mapped.file);
        if(!data) return;
        
        let thumbHtml = data.images.map((img, idx) => `
            <img class="product-thumb ${idx===0?'active':''}" src="${img}" onclick="app.setMainImg('${img}', this)">
        `).join('');

        let specsHtml = data.specs.map(s => `<li>${this.getText(s)}</li>`).join('');
        
        let dlHtml = data.downloads ? data.downloads.map(dl => `<a href="${dl.url}" target="_blank" class="btn btn-outline" download>${this.getText(dl.label)}</a>`).join('') : '';

        const html = `
            <div class="container section">
                <a href="#products" style="margin-bottom: 2rem; display: inline-block; font-weight: 500;">&larr; ${this.currentLang==='ES'?'Volver a Maquinaria':'Back to Products'}</a>
                
                <div class="product-detail-layout">
                    <div class="product-gallery">
                        <img id="main-product-img" class="product-main-img" src="${data.images[0]}">
                        <div class="product-thumbs">
                            ${thumbHtml}
                        </div>
                    </div>
                    
                    <div class="product-info">
                        <h1>${data.name}</h1>
                        <p class="lead">${this.getText(data.description)}</p>
                        <ul class="specs-list">
                            ${specsHtml}
                        </ul>
                        <div class="download-links">
                            ${dlHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
    },

    setMainImg(src, elem) {
        document.getElementById('main-product-img').src = src;
        document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
        if(elem) elem.classList.add('active');
    },

    async renderGallery() {
        const data = await this.fetchYaml('data/gallery.yaml');
        if(!data) return;

        // Distribute featured (2x2) items with a scattered offset pattern
        // so large images don't always cluster on the same side of the grid.
        // Pattern: featured at positions 2, 7, 12, 17... (every 5, starting offset 2)
        const featuredSet = new Set();
        let pos = 2, step = 5;
        while (pos < data.images.length) {
            featuredSet.add(pos);
            pos += step;
        }

        let gridHtml = '';
        data.images.forEach((img, idx) => {
            const featured = featuredSet.has(idx) ? ' gallery-item--featured' : '';
            gridHtml += `
            <div class="gallery-item${featured}" onclick="app.openLightbox('${img}', ${idx})">
                <img src="${img}" class="gallery-img" loading="lazy">
            </div>`;
        });

        const html = `
            <div class="container section">
                <h2 class="section-title">${this.getText(data.title)}</h2>
                <p class="section-subtitle">${this.getText(data.description)}</p>
                
                <div class="gallery-mosaic">
                    ${gridHtml}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
        this.galleryImages = data.images;
        this.currentBoxIdx = 0;
    },

    openLightbox(src, idx) {
        this.currentBoxIdx = idx;
        const box = document.getElementById('lightbox');
        document.getElementById('lightbox-img').src = src;
        box.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        document.getElementById('lightbox').classList.remove('active');
        document.body.style.overflow = '';
    },

    prevLightbox(e) {
        e.stopPropagation();
        this.currentBoxIdx = (this.currentBoxIdx - 1 + this.galleryImages.length) % this.galleryImages.length;
        document.getElementById('lightbox-img').src = this.galleryImages[this.currentBoxIdx];
    },

    nextLightbox(e) {
        e.stopPropagation();
        this.currentBoxIdx = (this.currentBoxIdx + 1) % this.galleryImages.length;
        document.getElementById('lightbox-img').src = this.galleryImages[this.currentBoxIdx];
    },

    sendContactForm(event) {
        event.preventDefault();
        var form    = event.target;
        var to      = form.dataset.email;
        var name    = document.getElementById('cf-name').value.trim();
        var email   = document.getElementById('cf-email').value.trim();
        var message = document.getElementById('cf-message').value.trim();
        var subject = encodeURIComponent('Contacto web - ' + name);
        var body    = encodeURIComponent('Nombre: ' + name + '\nEmail: ' + email + '\n\n' + message);
        window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
    },

    async renderContact() {
        const data = await this.fetchYaml('data/contact.yaml');
        if(!data) return;

        const html = `
            <div class="container section">
                <h2 class="section-title">${this.getText(data.title)}</h2>
                <p class="section-subtitle">${this.getText(data.description)}</p>
                
                <div class="contact-layout">
                    <div class="contact-info-panel">
                        <h2>${this.currentLang === 'ES' ? 'Información' : 'Information'}</h2>
                        <div class="contact-item">
                            <i class="contact-icon">📞</i>
                            <span>${data.info.phone}</span>
                        </div>
                        <div class="contact-item">
                            <i class="contact-icon">✉️</i>
                            <span>${data.info.email}</span>
                        </div>
                        <div class="contact-social">
                            <a href="${data.social.instagram}" target="_blank" class="social-icon" aria-label="Instagram">IG</a>
                            <a href="${data.social.youtube}" target="_blank" class="social-icon" aria-label="YouTube">YT</a>
                        </div>
                    </div>
                    
                    <div class="contact-form-panel">
                        <form onsubmit="app.sendContactForm(event)" data-email="${data.info.email}">
                            <div class="form-group">
                                <label class="form-label" for="cf-name">${this.getText(data.form_labels.name)}</label>
                                <input id="cf-name" type="text" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="cf-email">${this.getText(data.form_labels.email)}</label>
                                <input id="cf-email" type="email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="cf-message">${this.getText(data.form_labels.message)}</label>
                                <textarea id="cf-message" class="form-control" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%">${this.getText(data.form_labels.submit)}</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
    },

    async renderSpareParts() {
        const data = await this.fetchYaml('data/spareparts.yaml');
        const prodData = await this.fetchYaml('data/products.yaml');
        if(!data || !prodData) return;

        // Create filter buttons
        let compats = new Set();
        data.items.forEach(item => {
            if(item.compatibility) item.compatibility.forEach(c => compats.add(c));
        });

        let filterBtns = `<button class="filter-btn active" onclick="app.filterSpareParts('all', this)">${this.currentLang === 'ES' ? 'Todos' : 'All'}</button>`;
        compats.forEach(c => {
            let pName = c.replace('model-', 'Model ').toUpperCase();
            filterBtns += `<button class="filter-btn" data-compat="${c}" onclick="app.filterSpareParts('${c}', this)">${pName}</button>`;
        });

        let itemsHtml = data.items.map(item => `
            <div class="product-card spare-part-card" data-name="${item.name.ES.toLowerCase()} ${item.name.EN.toLowerCase()}" data-ref="${item.ref.toLowerCase()}" data-compat="${item.compatibility.join(',')}">
                <div class="product-image-wrapper">
                    <img class="product-image" src="${item.image}" alt="${this.getText(item.name)}">
                </div>
                <div class="product-content">
                    <span class="spare-ref">${item.ref}</span>
                    <h3 class="product-title" style="font-size: 1.4rem; margin-top: 0.5rem;">${this.getText(item.name)}</h3>
                    <p class="product-desc" style="margin-bottom: 1rem;">${this.getText(item.description)}</p>
                    <div class="spare-compat">
                        ${item.compatibility.map(c => `<span class="compat-badge">${c.replace('model-', 'M')}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="container section">
                <h2 class="section-title">${this.getText(data.title)}</h2>
                <p class="section-subtitle">${this.getText(data.description)}</p>
                
                <div class="filter-bar">
                    <div class="search-box">
                        <input type="text" id="spare-search" class="form-control" placeholder="${this.currentLang === 'ES' ? 'Buscar por nombre o ref...' : 'Search by name or ref...'}" onkeyup="app.filterSpareParts()">
                    </div>
                    <div class="filter-buttons">
                        ${filterBtns}
                    </div>
                </div>

                <div class="products-grid" id="spare-grid">
                    ${itemsHtml}
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
        this.currentSpareCompat = 'all';
    },

    filterSpareParts(compat = null, btnElem = null) {
        if(compat) {
            this.currentSpareCompat = compat;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if(btnElem) btnElem.classList.add('active');
        }
        
        const query = (document.getElementById('spare-search')?.value || '').toLowerCase();
        const activeCompat = this.currentSpareCompat || 'all';
        
        document.querySelectorAll('.spare-part-card').forEach(card => {
            const name = card.getAttribute('data-name');
            const ref = card.getAttribute('data-ref');
            const compats = card.getAttribute('data-compat').split(',');
            
            const matchQuery = name.includes(query) || ref.includes(query);
            const matchCompat = activeCompat === 'all' || compats.includes(activeCompat);
            
            if(matchQuery && matchCompat) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
};

window.onload = () => app.init();
