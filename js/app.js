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
            <a href="#gallery">${this.getText(items.gallery)}</a>
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
        else if (route === 'products') {
            if (parts[1]) await this.renderProduct(parts[1]);
            else await this.renderProducts();
        }
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
                        <span class="btn btn-primary" style="align-self: flex-start; margin-top: 1rem;">${this.getText(this.config.buttons.read_more)}</span>
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

        let gridHtml = '';
        data.images.forEach((img, idx) => {
            gridHtml += `
            <div class="gallery-item" onclick="app.openLightbox('${img}', ${idx})">
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

            <!-- Lightbox Modal -->
            <div id="lightbox" class="lightbox" onclick="if(event.target===this) app.closeLightbox()">
                <button class="lightbox-close" onclick="app.closeLightbox()">×</button>
                <button class="lightbox-prev" onclick="app.prevLightbox(event)">&#10094;</button>
                <img id="lightbox-img" class="lightbox-img" src="">
                <button class="lightbox-next" onclick="app.nextLightbox(event)">&#10095;</button>
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
                        <form onsubmit="event.preventDefault(); alert('Mensaje enviado (simulación)');">
                            <div class="form-group">
                                <label class="form-label">${this.getText(data.form_labels.name)}</label>
                                <input type="text" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">${this.getText(data.form_labels.email)}</label>
                                <input type="email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">${this.getText(data.form_labels.message)}</label>
                                <textarea class="form-control" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%">${this.getText(data.form_labels.submit)}</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app-content').innerHTML = html;
    }
};

window.onload = () => app.init();
