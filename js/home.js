// ====================================================================
// 1. CARROSSEL DE PROPAGANDAS
// ====================================================================
(function initAdsCarouselAuto() {
    const root = document.querySelector('.carrossel-de-propagandas');
    const rootMobile = document.querySelector('.carrossel-de-propagandas-mobile');
    if (!root || !rootMobile) return;

    const track = root.querySelector('.carousel-track');
    const trackMobile = rootMobile.querySelector('.carousel-track-mobile');

    const slides = Array.from(root.querySelectorAll('.carousel-slide'));
    const slidesMobile = Array.from(rootMobile.querySelectorAll('.carousel-slide-mobile'));

    const dotsWrap = root.querySelector('.carousel-dots');

    const total = slides.length;
    const totalMobile = slidesMobile.length;

    let index = 0;
    const interval = 3500;
    let timer = null;

    function buildDots() {
        if (!dotsWrap) return;
        dotsWrap.innerHTML = '';
        slides.forEach((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.dataset.index = i;
            b.addEventListener('click', () => { goToDesktop(i); restart(); });
            if (i === 0) b.classList.add('active');
            dotsWrap.appendChild(b);
        });
    }

    function update() {
        track.style.transform = `translateX(-${index * 100}%)`;
        trackMobile.style.transform = `translateX(-${index * 100}%)`;

        if (dotsWrap)
            Array.from(dotsWrap.children).forEach((d, i) =>
                d.classList.toggle('active', i === index)
            );
    }

    function nextDesktop() {
        index = (index + 1) % total;
        update();
    }

    function goToDesktop(i) {
        index = (i + total) % total;
        update();
    }

    function nextMobile() {
        index = (index + 1) % totalMobile;
        update();
    }

    function goToMobile(i) {
        index = (i + totalMobile) % totalMobile;
        update();
    }

    function start() {
        stop();
        const isMobile = window.innerWidth <= 760;
        timer = setInterval(isMobile ? nextMobile : nextDesktop, interval);
    }

    function stop() {
        if (timer) clearInterval(timer);
        timer = null;
    }

    function restart() { start(); }

    root.addEventListener('mouseenter', stop);
    rootMobile.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    rootMobile.addEventListener('mouseleave', start);

    let startX = 0;

    function swipeHandler(isMobile, dx) {
        if (dx > 40) {
            isMobile ? goToMobile(index - 1) : goToDesktop(index - 1);
        }
        if (dx < -40) {
            isMobile ? goToMobile(index + 1) : goToDesktop(index + 1);
        }
        restart();
    }

    root.addEventListener('touchstart', e => {
        stop();
        startX = e.touches[0].clientX;
    });

    root.addEventListener('touchend', e => {
        swipeHandler(false, e.changedTouches[0].clientX - startX);
    });

    rootMobile.addEventListener('touchstart', e => {
        stop();
        startX = e.touches[0].clientX;
    });

    rootMobile.addEventListener('touchend', e => {
        swipeHandler(true, e.changedTouches[0].clientX - startX);
    });

    buildDots();
    update();
    start();
})();

// ====================================================================
// 2. ESTADO GLOBAL DA PÁGINA (DECLARADO UMA ÚNICA VEZ)
// ====================================================================
const state = { 
    products: [], 
    pageSize: 8, 
    currentPage: 1 
};

// ====================================================================
// 3. RENDERIZAÇÃO, SKELETON E PAGINAÇÃO
// ====================================================================
function renderSkeletonLoaders(quantidade = 8) {
    const container = el('products');
    if (!container) return;

    let skeletonsHTML = '';
    for (let i = 0; i < quantidade; i++) {
        skeletonsHTML += `
            <div class="skeleton-card">
                <div class="skeleton-box skeleton-img"></div>
                <div class="skeleton-box skeleton-title"></div>
                <div class="skeleton-box skeleton-desc"></div>
                <div class="skeleton-box skeleton-price"></div>
            </div>
        `;
    }
    container.innerHTML = skeletonsHTML;
}

function renderPage(page = 1) {
    const container = el('products');
    if (!container) return;

    const total = state.products.length;
    const pageSize = state.pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.max(1, Math.min(page, totalPages));
    state.currentPage = page;

    try { localStorage.setItem('loja.currentPage', String(page)); } catch (e) { }

    const start = (page - 1) * pageSize;
    const pageItems = state.products.slice(start, start + pageSize);
    container.innerHTML = '';

    if (pageItems.length === 0) {
        container.innerHTML = `
            <div class="no-products-container">
                <div class="no-products-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                </div>
                <h3>Nenhum produto encontrado</h3>
                <p>Não encontramos nenhum resultado para a sua busca ou filtros aplicados. Tente buscar por outros termos.</p>
                <button class="btn ghost" onclick="document.getElementById('clearFilters')?.click()">Limpar Filtros</button>
            </div>
        `;;
        return;
    }

    pageItems.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb">
                <img 
                    src="${(p.images && p.images.length && p.images[0]) ? p.images[0] : DEFAULT_PRODUCT_IMAGE}" 
                    alt="${p.title}"
                    onerror="this.onerror=null; this.src=DEFAULT_PRODUCT_IMAGE;"
                >
            </div>
            <div style="flex:1">
                <div style="font-weight:700">${p.title}</div>
                <div class="card-desc" title="${p.desc_text || p.desc}">${p.desc_text || p.desc}</div>
            </div>
            <div class="meta">
                <div class="stock-status ${p.stock > 0 ? 'em-estoque' : 'esgotado'}">
                    ${p.stock > 0 ? 'Em Estoque' : 'Esgotado'}
                </div>
                <div class="price-container-card">
                    <div class="price-old">${money(p.price * 1.15)}</div>
                    <div class="price-discounted">${money(p.price)}</div>
                    <div class="discount-tag">15% OFF no PIX</div>
                </div>
                <div class="actions">
                    <button class="btn" data-id="${p.id}" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>
                        ${p.stock > 0 ? 'Adicionar' : 'Esgotado'}
                    </button>
                </div>
            </div>
        `;
        card.style.cursor = 'pointer';
        card.addEventListener('click', function (e) {
            if (e.target.tagName.toLowerCase() === 'button') return;
            window.location.href = `/product/?id=${p.id}`;
        });
        container.appendChild(card);
    });

    const from = total === 0 ? 0 : start + 1;
    const to = start + pageItems.length;
    const label = `${from}-${to} de ${total}`;
    if (el('shownCount')) el('shownCount').textContent = label;
    if (el('shownCount2')) el('shownCount2').textContent = label;

    renderPagination(totalPages, page);
}

function renderPagination(totalPages, current) {
    const pag = el('pagination');
    if (!pag) return;
    pag.innerHTML = '';

    const createBtn = (text, cls, disabled, handler) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = cls || 'page-btn';
        b.textContent = text;
        if (disabled) b.disabled = true;
        b.addEventListener('click', handler);
        return b;
    };

    pag.appendChild(createBtn('Anterior', 'page-btn nav', current === 1, () => renderPage(current - 1)));
    for (let i = 1; i <= totalPages; i++) {
        const btn = createBtn(i, 'page-btn' + (i === current ? ' active' : ''), false, () => renderPage(i));
        pag.appendChild(btn);
    }
    pag.appendChild(createBtn('Próximo', 'page-btn nav', current === totalPages, () => renderPage(current + 1)));
}

// ====================================================================
// 4. FILTROS E BUSCA
// ====================================================================
function applyFilters() {
    const category = document.querySelector('input[name="cat"]:checked')?.value || 'all';
    const searchInput = el('search');
    const searchQuery = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
    const sort = document.getElementById('sort-hidden-input')?.value || 'default';

    let list = (window.PRODUCTS || []).slice();

    if (category !== 'all') {
        list = list.filter(p =>
            [p.category, p.subcategory, p.subcategories]
                .flatMap(value => String(value || '').split(','))
                .some(value => normalizarCategoria(value) === normalizarCategoria(category))
        );
    }

    if (searchQuery) {
        list = list.filter(p => {
            const desc = p.desc_text || p.desc || '';
            return String(p.title || '').toLowerCase().includes(searchQuery) ||
                desc.toLowerCase().includes(searchQuery) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery)));
        });
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);

    state.products = list;
    renderPage(1);
}

function clearFilters() {
    const allRadio = document.querySelector('input[name="cat"][value="all"]');
    if (allRadio) allRadio.checked = true;
    if (el('search')) el('search').value = '';
    
    const hiddenInput = document.getElementById('sort-hidden-input');
    const selectedVal = document.getElementById('selected-value');
    if (hiddenInput) hiddenInput.value = 'default';
    if (selectedVal) selectedVal.textContent = 'Ordenar por...';

    state.products = (window.PRODUCTS || []).slice();
    renderPage(1);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function initializeFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('cat');
    const subcategoryParam = urlParams.get('subcat');

    if (categoryParam || subcategoryParam) {
        const filterValue = subcategoryParam || categoryParam;
        const radio = [...document.querySelectorAll('input[name="cat"]')]
            .find(input => normalizarCategoria(input.value) === normalizarCategoria(filterValue));

        if (radio) {
            radio.checked = true;
            applyFilters();
        }
    }
}

// ====================================================================
// 5. INICIALIZAÇÃO DA PÁGINA (ÚNICO EVENTO DOMCONTENTLOADED)
// ====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Configura o Dropdown customizado de ordenação
    const button = document.getElementById('sort-button');
    const list = document.getElementById('sort-list');
    const options = document.querySelectorAll('.custom-option');
    const selectedValueSpan = document.getElementById('selected-value');
    const hiddenInput = document.getElementById('sort-hidden-input');

    if (button && list) {
        button.addEventListener('click', () => {
            const isOpen = button.classList.contains('is-open');
            list.style.display = isOpen ? 'none' : 'block';
            button.classList.toggle('is-open', !isOpen);
            button.setAttribute('aria-expanded', String(!isOpen));
        });

        options.forEach(option => {
            option.addEventListener('click', function () {
                const value = this.getAttribute('data-value');
                const text = this.textContent.trim();
                if (selectedValueSpan) selectedValueSpan.textContent = text;
                if (hiddenInput) hiddenInput.value = value;
                options.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                list.style.display = 'none';
                button.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
                applyFilters();
            });
        });

        const closeDropdown = (e) => {
            const container = document.getElementById('sort-container');
            if (container && !container.contains(e.target) && button.classList.contains('is-open')) {
                list.style.display = 'none';
                button.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
            }
        };

        document.addEventListener('click', closeDropdown);
        document.addEventListener('touchstart', closeDropdown);
    }

    // Eventos de Filtro e Busca
    if (el('applyFilters')) el('applyFilters').addEventListener('click', applyFilters);
    if (el('clearFilters')) el('clearFilters').addEventListener('click', clearFilters);

    document.querySelectorAll('input[name="cat"]').forEach(input => {
        input.addEventListener('change', () => {
            if (el('search')) el('search').value = '';
            if (el('searchMobile')) el('searchMobile').value = '';
            applyFilters();
        });
    });

    if (el('search')) {
        el('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
        el('search').addEventListener('input', applyFilters);
    }

    const mobileSearch = el('searchMobile');
    if (mobileSearch) {
        mobileSearch.addEventListener('input', debounce(() => {
            if (el('search')) el('search').value = mobileSearch.value;
            applyFilters();
        }, 220));
        mobileSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (el('search')) el('search').value = mobileSearch.value;
                applyFilters();
            }
        });
    }

    // 1. Exibe os cards esqueletos imediatamente
    renderSkeletonLoaders(state.pageSize);

    // 2. Busca dados no Supabase
    try {
        const produtosSupabase = await window.carregarProdutosSupabase();
        window.PRODUCTS = produtosSupabase || [];
        state.products = (produtosSupabase || []).slice();
    } catch (err) {
        console.error('❌ Erro ao buscar produtos do Supabase:', err);
        state.products = [];
    }

    // 3. Substitui os esqueletos pelos produtos reais e atualiza UI
    renderPage(1);
    if (typeof window.updateCartUI === 'function') {
        window.updateCartUI();
    }
    initializeFiltersFromURL();
});