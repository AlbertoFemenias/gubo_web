const App = {
  lang: 'es',
  config: null,
  contentEl: document.getElementById('app-content'),

  async init() {
    this.setupEvents();
    
    // Load global config
    try {
      const res = await fetch('content/config.json');
      this.config = await res.json();
    } catch(e) {
      console.error('Failed to load config.json', e);
      this.contentEl.innerHTML = '<div class="page-container"><h2>Error loading application configuration.</h2></div>';
      return;
    }

    this.detectLanguage();
    this.populateDropdown();
    
    // Handle initial route
    this.handleRoute();
    
    // Add year to footer
    document.getElementById('year').textContent = new Date().getFullYear();
  },

  setupEvents() {
    window.addEventListener('hashchange', () => this.handleRoute());
    
    document.getElementById('lang-es').addEventListener('click', () => this.setLanguage('es'));
    document.getElementById('lang-en').addEventListener('click', () => this.setLanguage('en'));

    // Mobile menu toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
      mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Ensure dropdown menus are hidden initially
        navLinks.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = '');
      });
      // Close mobile menu on link click (unless it's a dropdown toggle)
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
          if (link.nextElementSibling && link.nextElementSibling.classList.contains('dropdown-menu')) {
            // It's a mobile dropdown -> toggle it
            e.preventDefault();
            const menu = link.nextElementSibling;
            if (window.innerWidth <= 768) {
              menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
            }
          } else {
            // Close mobile menu
            navLinks.classList.remove('active');
          }
        });
      });
    }
  },

  populateDropdown() {
    const dropMenu = document.getElementById('products-dropdown');
    if (!dropMenu) return;
    
    dropMenu.innerHTML = this.config.products.map(p => {
      // Create a nice display name: "modelo-80" -> "Modelo 80"
      const name = p.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<a href="#product/${p}">${name}</a>`;
    }).join('');
  },

  detectLanguage() {
    const saved = localStorage.getItem('gubo_lang');
    if (saved) {
      this.lang = saved;
    } else {
      this.lang = 'es';
    }
    this.updateLangUI();
  },

  setLanguage(lang) {
    if (this.lang === lang) return;
    this.lang = lang;
    localStorage.setItem('gubo_lang', lang);
    this.updateLangUI();
    this.handleRoute(); // re-render view
  },

  updateLangUI() {
    document.getElementById('lang-es').classList.toggle('active', this.lang === 'es');
    document.getElementById('lang-en').classList.toggle('active', this.lang === 'en');
    
    // Update static UI translations
    const i18nElements = document.querySelectorAll('[data-i18n]');
    const dict = {
      es: { nav_home: 'Inicio', nav_products: 'Maquinaria', nav_contact: 'Contacto' },
      en: { nav_home: 'Home', nav_products: 'Machinery', nav_contact: 'Contact' }
    };
    
    i18nElements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[this.lang][key]) el.textContent = dict[this.lang][key];
    });
  },

  async handleRoute() {
    let hash = window.location.hash.substring(1) || 'home';
    
    // Update nav active state
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${hash.split('/')[0]}`);
    });

    this.contentEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    try {
      if (hash === 'home') {
        await this.renderHome();
      } else if (hash === 'products') {
        await this.renderProductsList();
      } else if (hash.startsWith('product/')) {
        const id = hash.split('/')[1];
        await this.renderProductDetail(id);
      } else if (hash === 'contact') {
        await this.renderContact();
      } else {
        window.location.hash = '#home';
      }
    } catch(err) {
      console.error(err);
      this.contentEl.innerHTML = `<div class="page-container"><h2>Error loading page</h2><p>${err.message}</p></div>`;
    }
  },

  async fetchMarkdown(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Not found: ${path}`);
    const text = await res.text();
    return this.parseMarkdown(text);
  },

  parseMarkdown(content) {
    // Basic frontmatter parser
    let meta = {};
    let body = content;
    
    if (content.startsWith('---')) {
      const match = content.match(/---\n([\s\S]+?)\n---/);
      if (match) {
        try {
          meta = jsyaml.load(match[1]);
          body = content.replace(match[0], '');
        } catch(e) {
          console.error("YAML parsing error", e);
        }
      }
    }

    // Extract the specific language part
    // We expect sections like [lang:es] ... [/lang:es]
    const langRegex = new RegExp(`\\[lang:${this.lang}\\]([\\s\\S]*?)\\[\\/lang:${this.lang}\\]`, 'i');
    const langMatch = body.match(langRegex);
    
    let localizedBody = langMatch ? langMatch[1] : body; // Fallback to all content if no tags
    
    return {
      meta,
      html: marked.parse(localizedBody),
      rawMd: localizedBody
    };
  },

  async renderHome() {
    const page = await this.fetchMarkdown('content/home.md');
    
    this.contentEl.innerHTML = `
      <div class="page-container hero">
        ${page.html}
        <div class="media-grid">
          <div class="media-card home-media iframe-wrapper">
            <iframe src="https://www.youtube.com/embed/${page.meta.youtube_id || 'rlP2mI5YKQ0'}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div class="media-card home-media instagram-wrapper">
            <blockquote class="instagram-media" data-instgrm-permalink="${page.meta.instagram_url || 'https://www.instagram.com/car/'}" data-instgrm-version="14"></blockquote>
          </div>
        </div>
        
        <!-- Home Carousel -->
        <div class="home-carousel">
          <button class="carousel-btn carousel-prev"><i class="fas fa-chevron-left"></i></button>
          <div class="carousel-track" id="home-carousel-track">
            <img src="assets/machine_action.png" class="carousel-slide" alt="Action shot 1">
            <img src="initial_resources/photos/machine_in_the_field.webp" class="carousel-slide" alt="Action shot 2">
            <img src="initial_resources/photos/machines_back.jpg" class="carousel-slide" alt="Action shot 3">
          </div>
          <button class="carousel-btn carousel-next"><i class="fas fa-chevron-right"></i></button>
        </div>
        
      </div>
    `;

    // Process Instagram embed script
    if (window.instgrm) {
      setTimeout(() => window.instgrm.Embeds.process(), 100);
    }
    
    // Setup simple carousel logic
    setTimeout(() => {
      const track = document.getElementById('home-carousel-track');
      if (!track) return;
      const slides = track.querySelectorAll('.carousel-slide');
      let index = 0;
      
      const updateCarousel = () => {
        track.style.transform = `translateX(-${index * 100}%)`;
      };
      
      document.querySelector('.carousel-next').addEventListener('click', () => {
        index = (index + 1) % slides.length;
        updateCarousel();
      });
      document.querySelector('.carousel-prev').addEventListener('click', () => {
        index = (index - 1 + slides.length) % slides.length;
        updateCarousel();
      });
      
      // Auto-slide every 5 seconds
      setInterval(() => {
        index = (index + 1) % slides.length;
        updateCarousel();
      }, 5000);
    }, 100);
  },

  async renderProductsList() {
    let listHtml = `<h2 class="section-title">${this.lang === 'es' ? 'Nuestra Maquinaria' : 'Our Machinery'}</h2><div class="products-grid">`;
    
    for (const prodId of this.config.products) {
      const page = await this.fetchMarkdown(`content/products/${prodId}.md`);
      const title = page.meta[`title_${this.lang}`] || page.meta.title || prodId;
      const image = page.meta.images && page.meta.images.length > 0 ? page.meta.images[0] : '';
      
      // Get a short snippet of the description
      const snippetNode = document.createElement('div');
      snippetNode.innerHTML = page.html;
      const snippet = snippetNode.innerText.substring(0, 150) + '...';

      listHtml += `
        <div class="product-card" style="cursor: pointer;" onclick="window.location.hash='#product/${prodId}'">
          <img src="${image}" alt="${title}" class="product-image">
          <div class="product-info">
            <h3>${title}</h3>
            <p>${snippet}</p>
            <br>
            <span class="btn btn-outline" style="text-align:center">${this.lang === 'es' ? 'Ver Detalles' : 'View Details'}</span>
          </div>
        </div>
      `;
    }
    
    listHtml += '</div>';
    this.contentEl.innerHTML = `<div class="page-container">${listHtml}</div>`;
  },

  async renderProductDetail(prodId) {
    const page = await this.fetchMarkdown(`content/products/${prodId}.md`);
    const title = page.meta[`title_${this.lang}`] || page.meta.title || prodId;
    const images = page.meta.images || [];
    
    let galleryHtml = '';
    if (images.length > 0) {
      let thumbsHtml = images.map((img, i) => `
        <img src="${img}" class="thumbnail ${i===0?'active':''}" onclick="document.getElementById('main-prod-img').src='${img}'; document.querySelectorAll('.thumbnail').forEach(t=>t.classList.remove('active')); this.classList.add('active');">
      `).join('');
      
      galleryHtml = `
        <div class="product-gallery">
          <img src="${images[0]}" id="main-prod-img" class="main-image">
          <div class="thumbnail-grid">${thumbsHtml}</div>
        </div>
      `;
    }

    let downloadsHtml = '';
    const downloads = page.meta[`downloads_${this.lang}`] || page.meta.downloads;
    if (downloads && downloads.length > 0) {
      downloadsHtml = `
        <div class="downloads">
          <h3><i class="fas fa-download"></i> ${this.lang === 'es' ? 'Descargas' : 'Downloads'}</h3>
          ${downloads.map(d => `
            <a href="${d.url}" class="download-link" target="_blank">
              <i class="fas fa-file-pdf" style="font-size: 1.5rem; color: #e74c3c;"></i>
              <span>${d.name}</span>
            </a>
          `).join('')}
        </div>
      `;
    }

    this.contentEl.innerHTML = `
      <div class="page-container product-detail">
        ${galleryHtml}
        <div class="product-content">
          <h1>${title}</h1>
          <div class="markdown-body">
            ${page.html}
          </div>
          ${downloadsHtml}
        </div>
      </div>
    `;
  },

  async renderContact() {
    const page = await this.fetchMarkdown('content/contact.md');
    
    this.contentEl.innerHTML = `
      <div class="page-container">
        <h2 class="section-title">${this.lang === 'es' ? 'Contacta con nosotros' : 'Contact Us'}</h2>
        <div class="contact-wrapper">
          <div class="markdown-body contact-info-card">
            ${page.html}
          </div>
          <div>
            <!-- Note: Formspree integration. Replace 'YOUR_FORM_ID' with the real ID from Formspree -->
            <form class="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
              <div class="form-group">
                <label>${this.lang === 'es' ? 'Nombre' : 'Name'}</label>
                <input type="text" name="name" class="form-control" required>
              </div>
              <div class="form-group">
                <label>${this.lang === 'es' ? 'Correo Electrónico' : 'Email'}</label>
                <input type="email" name="email" class="form-control" required>
              </div>
              <div class="form-group">
                <label>${this.lang === 'es' ? 'Mensaje' : 'Message'}</label>
                <textarea name="message" class="form-control" required></textarea>
              </div>
              <button type="submit" class="btn">${this.lang === 'es' ? 'Enviar Mensaje' : 'Send Message'}</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
