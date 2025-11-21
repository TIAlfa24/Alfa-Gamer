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

            // DESKTOP
            function nextDesktop() {
                index = (index + 1) % total;
                update();
            }

            function goToDesktop(i) {
                index = (i + total) % total;
                update();
            }

            // MOBILE
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

                // condição simples: se for mobile, usar totalMobile
                const isMobile = window.innerWidth <= 760;
                timer = setInterval(isMobile ? nextMobile : nextDesktop, interval);
            }

            function stop() {
                if (timer) clearInterval(timer);
                timer = null;
            }

            function restart() { start(); }

            // HOVER
            root.addEventListener('mouseenter', stop);
            rootMobile.addEventListener('mouseenter', stop);
            root.addEventListener('mouseleave', start);
            rootMobile.addEventListener('mouseleave', start);

            // SWIPE
            let startX = 0;

            function swipeHandler(isMobile, dx) {
                if (dx > 40) {
                    isMobile
                        ? goToMobile(index - 1)
                        : goToDesktop(index - 1);
                }
                if (dx < -40) {
                    isMobile
                        ? goToMobile(index + 1)
                        : goToDesktop(index + 1);
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

        document.addEventListener('DOMContentLoaded', () => {
            // 1. Seleciona os elementos principais
            const button = document.getElementById('sort-button'); // O botão que abre/fecha
            const list = document.getElementById('sort-list');       // A lista de opções (o dropdown)
            const options = document.querySelectorAll('.custom-option'); // Todos os itens da lista
            const selectedValueSpan = document.getElementById('selected-value'); // O texto dentro do botão
            const hiddenInput = document.getElementById('sort-hidden-input'); // O input oculto

            // 2. FUNÇÃO: Alterna a visibilidade do dropdown
            function toggleDropdown() {
                const isOpen = button.classList.contains('is-open');
                if (isOpen) {
                    list.style.display = 'none';
                    button.classList.remove('is-open');
                    button.setAttribute('aria-expanded', 'false');
                } else {
                    list.style.display = 'block';
                    button.classList.add('is-open');
                    button.setAttribute('aria-expanded', 'true');
                }
            }

            button.addEventListener('click', toggleDropdown);

            options.forEach(option => {
                option.addEventListener('click', function () {
                    const value = this.getAttribute('data-value');
                    const text = this.textContent.trim();

                    selectedValueSpan.textContent = text;
                    hiddenInput.value = value;

                    options.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');

                    // Fecha
                    list.style.display = 'none';
                    button.classList.remove('is-open');
                    button.setAttribute('aria-expanded', 'false');

                });
            });

            // Fecha ao clicar fora
            document.addEventListener('click', (event) => {
                const isClickInside = document.getElementById('sort-container').contains(event.target);
                if (!isClickInside && button.classList.contains('is-open')) {
                    list.style.display = 'none';
                    button.classList.remove('is-open');
                    button.setAttribute('aria-expanded', 'false');
                }
            });

            document.addEventListener('touchstart', (event) => {
                const isClickInside = document.getElementById('sort-container').contains(event.target);
                if (!isClickInside && button.classList.contains('is-open')) {
                    list.style.display = 'none';
                    button.classList.remove('is-open');
                    button.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // estado de produtos/paginação (usa PRODUCTS do global.js)
        const state = { products: PRODUCTS.slice(), pageSize: 8, currentPage: 1 };

        function renderPage(page = 1) {
            const container = el('products');
            const total = state.products.length;
            const pageSize = state.pageSize;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            page = Math.max(1, Math.min(page, totalPages));
            state.currentPage = page;
            try { localStorage.setItem('loja.currentPage', String(page)); } catch (e) { }
            const start = (page - 1) * pageSize;
            const pageItems = state.products.slice(start, start + pageSize);
            container.innerHTML = '';
            pageItems.forEach(p => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="thumb">
                        <img src="${(p.images && p.images.length) ? p.images[0] : DEFAULT_PRODUCT_IMAGE}" alt="${p.title}">
                    </div>
                    <div style="flex:1">
                        <div style="font-weight:700">${p.title}</div>
                        <div class="card-desc" title="${p.desc}">${p.desc}</div>
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
                    window.location.href = `produto.html?id=${p.id}`;
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

        function applyFilters() {
            const category = document.querySelector('input[name="cat"]:checked').value;
            const searchInput = el('search');
            const searchQuery = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
            const sort = document.getElementById('sort-hidden-input').value;

            let list = PRODUCTS.slice();

            if (category !== 'all') {
                list = list.filter(p =>
                    p.category === category ||
                    p.subcategory === category ||
                    (p.subcategories === category)
                );
            }

            if (searchQuery) {
                list = list.filter(p =>
                    p.title.toLowerCase().includes(searchQuery) ||
                    p.desc.toLowerCase().includes(searchQuery) ||
                    (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery)))
                );
            }

            if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
            if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);

            state.products = list;
            renderPage(1);
        }

        function clearFilters() {
            document.querySelector('input[name="cat"][value="all"]').checked = true;
            if (el('search')) el('search').value = '';
            document.getElementById('sort-hidden-input').value = 'default';
            document.getElementById('selected-value').textContent = 'Ordenar por...';
            state.products = PRODUCTS.slice();
            renderPage(1);
        }


        el('applyFilters').addEventListener('click', applyFilters);
        el('clearFilters').addEventListener('click', clearFilters);

        // Busca ao apertar Enter no input desktop
        el('search').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyFilters();
        });

        // Busca automática enquanto digita no desktop
        el('search').addEventListener('input', () => {
            applyFilters();
        });

        // adiciona a função debounce
        function debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
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


        el('checkout')?.addEventListener('click', () => {
            alert('Checkout de exemplo — implementar integração de pagamento.');
        });

        // ===== utilitários e layout de sidebar fixo (copiados do original) =====

        document.addEventListener('DOMContentLoaded', () => {
            state.products = PRODUCTS.slice(); // todos os produtos
            renderPage(1);                     // mostra página inicial
            updateCartUI();
        });
