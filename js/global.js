// ==========================================
// CONFIGURAÇÃO E INICIALIZAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://qmaxoltmfusbhflviwvg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OGjx9Oh-Di0D5q2zUdOz-w_vhiZH0F2';

let _supabase = null;
let supabaseInicializacao = null;

async function inicializarSupabase() {
    if (_supabase) return _supabase;
    if (window.__alfaSupabaseClient) {
        _supabase = window.__alfaSupabaseClient;
        window.supabaseClient = _supabase;
        return _supabase;
    }
    if (supabaseInicializacao) return supabaseInicializacao;

    supabaseInicializacao = (async () => {
        if (!window.supabase?.createClient) {
            throw new Error('Biblioteca Supabase não carregou.');
        }

        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        window.__alfaSupabaseClient = _supabase;
        window.supabaseClient = _supabase;
        return _supabase;
    })().catch(err => {
        supabaseInicializacao = null;
        console.error('❌ Erro ao inicializar Supabase:', err);
        return null;
    });

    return supabaseInicializacao;
}

window.inicializarSupabase = inicializarSupabase;
window.supabaseClient = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
    inicializarSupabase();
}

// ==========================================
// DADOS E BUSCA DE PRODUTOS
// ==========================================
const DEFAULT_PRODUCT_IMAGE = "/images/products/placeholder.png";
const PRODUCTS = [];
window.PRODUCTS = PRODUCTS;

function normalizarProdutos(produtos) {
    return produtos.map(p => ({
        ...p,
        id: p.id,
        title: p.title || 'Produto sem título',
        category: p.category || 'outros',
        subcategory: p.subcategory || '',
        price: Number(p.price) || 0,
        pix_discount: Number(p.pix_discount ?? 15),
        stock: Number(p.stock) || 0,
        desc_text: p.desc_text || p.desc || '',
        images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
        tags: Array.isArray(p.tags) ? p.tags : [],
        specs: p.specs && typeof p.specs === 'object' ? p.specs : {}
    }));
}

function normalizarCategoria(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-');
}
window.normalizarCategoria = normalizarCategoria;

async function carregarProdutosSupabase() {
    const supabase = await inicializarSupabase();
    if (!supabase) throw new Error('Supabase não inicializado.');

    const { data, error } = await supabase.from('produtos').select('*');
    if (error) throw error;

    const produtos = normalizarProdutos(data || []);
    PRODUCTS.splice(0, PRODUCTS.length, ...produtos);

    updateCartUI();
    return PRODUCTS;
}
window.carregarProdutosSupabase = carregarProdutosSupabase;

// ==========================================
// CARRINHO DE COMPRAS
// ==========================================
const CART_STORAGE_KEY = 'cart.items.v1';
const el = id => document.getElementById(id);
const money = v => 'R$ ' + v.toFixed(2).replace('.', ',');

const globalState = {
    cart: {},
    isCartOpen: false
};

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') globalState.cart = parsed;
        }
    } catch (e) { console.error("Falha ao carregar carrinho:", e); }
}

function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(globalState.cart));
    } catch (e) { console.error("Falha ao salvar carrinho:", e); }
}

const MAX_PER_PRODUCT = 3;

function addToCart(id, qty = 1) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;

    if (p.stock <= 0) {
        alert(`O produto "${p.title}" está esgotado.`);
        return;
    }

    const currentQty = globalState.cart[id] || 0;

    if (p.stock === 3) {
        if (currentQty + qty > p.stock) {
            showLimitNotification(`⚠️ Apenas ${p.stock} unidades disponíveis.`);
            return;
        }
    } else {
        if (currentQty + qty > MAX_PER_PRODUCT) {
            showLimitNotification(`⚠️ Limite de ${MAX_PER_PRODUCT} unidades por produto.`);
            return;
        }
    }

    globalState.cart[id] = currentQty + qty;
    saveCartToStorage();
    updateCartUI();
}

function changeQty(id, delta) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p || !globalState.cart[id]) return;

    const newQty = globalState.cart[id] + delta;

    if (newQty <= 0) {
        delete globalState.cart[id];
        saveCartToStorage();
        updateCartUI();
        return;
    }

    if (p.stock === 3 && newQty > p.stock) {
        showLimitNotification(`⚠️ Apenas ${p.stock} unidades disponíveis.`);
        return;
    }

    if (p.stock !== 3 && newQty > MAX_PER_PRODUCT) {
        showLimitNotification(`⚠️ Limite de ${MAX_PER_PRODUCT} unidades por produto.`);
        return;
    }

    globalState.cart[id] = newQty;
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI() {
    let total = 0, count = 0;
    let itemsHtml = '';

    Object.keys(globalState.cart).forEach(k => {
        const qty = globalState.cart[k];
        const p = PRODUCTS.find(x => x.id == k);
        if (!p) return;
        total += p.price * qty;
        count += qty;
        const imageSrc = p.images?.[0] || DEFAULT_PRODUCT_IMAGE;
        itemsHtml += `
            <div class="cart-item">
                <div class="thumb">
                    <img src="${imageSrc}" alt="${p.title}" onerror="this.onerror=null; this.src='${DEFAULT_PRODUCT_IMAGE}';">
                </div>
                <div style="flex:1">
                    <div class="cart-item-title">${p.title}</div>
                    <div style="font-size:13px;color:var(--muted)">${money(p.price)} x${qty}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">
                    <button class="btn" onclick="changeQty(${p.id}, 1)">+</button>
                    <button class="btn ghost" onclick="changeQty(${p.id}, -1)">-</button>
                </div>
            </div>
        `;
    });

    const desktopItems = document.getElementById('cartItemsDesktop');
    const mobileItems = document.getElementById('cartItemsMobile');
    if (desktopItems) desktopItems.innerHTML = itemsHtml;
    if (mobileItems) mobileItems.innerHTML = itemsHtml;

    const totalDesktop = document.getElementById('cartTotalDesktop');
    const totalMobile = document.getElementById('cartTotalMobile');
    if (totalDesktop) totalDesktop.textContent = money(total);
    if (totalMobile) totalMobile.textContent = money(total);

    if (el('cartCountHeader')) el('cartCountHeader').textContent = count;
    if (el('draggableCartBadge')) el('draggableCartBadge').textContent = count;
    if (el('cartCountNav')) el('cartCountNav').textContent = count;
}

function setCartOpen(isOpen) {
    globalState.isCartOpen = isOpen;
    if (isOpen) {
        const hamburger = el('hamburger');
        const navMenu = el('navMenu');
        if (hamburger?.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu?.classList.remove('active');
        }
    }

    const widget = document.getElementById('draggableCartWidget');
    const widgetImg = widget?.querySelector('img');
    const cartIcons = document.querySelectorAll('#openCartHeader .cart-icon, #openCartNav .cart-icon');

    const applyWidgetState = () => {
        if (widget) {
            widget.classList.toggle('is-open', isOpen);
            widget.classList.remove('animating');
        }
        if (widgetImg) {
            widgetImg.src = isOpen ? '/images/usefull-icons/close-cart.png' : '/images/usefull-icons/cart.png';
            widgetImg.alt = isOpen ? 'Fechar carrinho' : 'Carrinho';
        }
        cartIcons.forEach(icon => {
            icon.classList.remove('animating');
            icon.src = isOpen ? '/images/usefull-icons/close-cart.png' : '/images/usefull-icons/cart.png';
            icon.alt = isOpen ? 'Fechar carrinho' : 'Carrinho';
        });
    };

    if (widget && widget.dataset.cartState !== undefined && widget.dataset.cartState !== String(isOpen)) {
        widget.classList.remove('animating');
        void widget.offsetWidth;
        widget.classList.add('animating');
        cartIcons.forEach(icon => {
            icon.classList.remove('animating');
            void icon.offsetWidth;
            icon.classList.add('animating');
        });
        setTimeout(() => {
            applyWidgetState();
            [widgetImg, ...cartIcons].forEach(icon => {
                if (!icon) return;
                icon.classList.remove('anim-jump');
                void icon.offsetWidth;
                icon.classList.add('anim-jump');
            });
        }, 420);
    } else {
        applyWidgetState();
    }
    if (widget) {
        widget.dataset.cartState = String(isOpen);
    }

    const cartDrawer = el('cartDrawer');
    const bottomSheet = el('cartBottomSheet');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (bottomSheet) bottomSheet.classList.toggle('open', isOpen);
    } else {
        if (bottomSheet) bottomSheet.classList.remove('open');
        if (cartDrawer) cartDrawer.classList.toggle('open', isOpen);
    }
}

function toggleCart() {
    setCartOpen(!globalState.isCartOpen);
}

function showLimitNotification(msg) {
    const existing = document.querySelector('.limit-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'limit-toast';
    toast.textContent = msg || '⚠️ Limite de produto atingido';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2000);
}

// ==========================================
// MENU HAMBURGER E WIDGET
// ==========================================
function setupHamburgerMenu() {
    const hamburger = el('hamburger');
    const navMenu = el('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isNowActive = !hamburger.classList.contains('active');
            hamburger.classList.toggle('active', isNowActive);
            navMenu.classList.toggle('active', isNowActive);

            if (isNowActive && globalState.isCartOpen) {
                setCartOpen(false);
            }
        });
    }
}

function setupAdminNavigation() {
    const drawer = el('userDrawer');
    const trigger = el('openUDrawer');
    if (!drawer || !trigger) return;

    const setDrawerOpen = isOpen => {
        drawer.classList.toggle('is-open', isOpen);
        drawer.setAttribute('aria-hidden', String(!isOpen));
        trigger.setAttribute('aria-expanded', String(isOpen));
    };

    trigger.addEventListener('click', () => {
        setDrawerOpen(!drawer.classList.contains('is-open'));
    });
    document.addEventListener('click', event => {
        if (!drawer.contains(event.target) && !trigger.contains(event.target)) {
            setDrawerOpen(false);
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
            setDrawerOpen(false);
            trigger.focus();
        }
    });
    el('adminLogout')?.addEventListener('click', fazerLogout);
}

async function fazerLogout() {
    const supabase = await inicializarSupabase();
    if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Erro ao sair:', error);
    }
    window.location.replace('/auth/login');
}
window.fazerLogout = fazerLogout;

function setupDraggableCartWidget() {
    const widget = el('draggableCartWidget');
    if (!widget) return;

    widget.dataset.cartState = String(globalState.isCartOpen);

    let isDragging = false;
    let startX, startY, offsetX, offsetY;

    function onStart(e) {
        isDragging = true;
        widget.classList.add('dragging');

        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX;
        startY = t.clientY;

        const rect = widget.getBoundingClientRect();
        offsetX = startX - rect.left;
        offsetY = startY - rect.top;

        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        let newX = (e.touches ? e.touches[0] : e).clientX - offsetX;
        let newY = (e.touches ? e.touches[0] : e).clientY - offsetY;

        const maxX = window.innerWidth - widget.offsetWidth;
        const maxY = window.innerHeight - widget.offsetHeight;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        widget.style.left = newX + 'px';
        widget.style.top = newY + 'px';
        widget.style.bottom = 'auto';
        widget.style.right = 'auto';
    }

    function onEnd() {
        isDragging = false;
        widget.classList.remove('dragging');

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
    }

    widget.addEventListener('click', () => {
        if (widget.classList.contains('dragging')) return;
        toggleCart();
    });

    widget.addEventListener('mousedown', onStart);
    widget.addEventListener('touchstart', onStart, { passive: true });
}

// ==========================================
// REGISTRO DE ANALYTICS (PÁGINAS PÚBLICAS)
// ==========================================
async function registrarEventoAnalytics() {
    const pathname = window.location.pathname;
    const fullPath = window.location.pathname + window.location.search;

    // Filtra páginas administrativas e rotas internas
    if (
        pathname.startsWith('/admin') || 
        pathname.startsWith('/auth') || 
        pathname.includes('login') ||
        pathname.includes('cadastrar') ||
        pathname.includes('gerenciar')
    ) {
        return;
    }

    let eventType = 'page_view';
    let produtoId = null;

    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');

    if ((pathname.includes('product') || pathname.includes('produto')) && rawId && !isNaN(parseInt(rawId, 10))) {
        eventType = 'product_view';
        produtoId = parseInt(rawId, 10);
    } else if (pathname.includes('product') || pathname.includes('produto')) {
        eventType = 'products_list_view';
    }

    try {
        const client = await inicializarSupabase();
        if (!client) return;

        let sessionId = sessionStorage.getItem('alfa_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('alfa_session_id', sessionId);
        }

        await client.from('analytics').insert([{
            event_type: eventType,
            page_path: fullPath,
            produto_id: produtoId,
            session_id: sessionId
        }]);
    } catch (err) {
        console.warn('Erro ao registrar analytics:', err);
    }
}

// ==========================================
// EXPOSIÇÃO GLOBAL E EVENTOS
// ==========================================
window.globalState = globalState;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.updateCartUI = updateCartUI;
window.toggleCart = toggleCart;
window.setCartOpen = setCartOpen;

document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    updateCartUI();

    setupHamburgerMenu();
    setupAdminNavigation();
    setupDraggableCartWidget();

    el('openCartHeader')?.addEventListener('click', toggleCart);
    el('openCartNav')?.addEventListener('click', toggleCart);
    el('closeCart')?.addEventListener('click', () => setCartOpen(false));
    el('closeCartBottom')?.addEventListener('click', () => setCartOpen(false));

    window.addEventListener('resize', () => {
        setCartOpen(globalState.isCartOpen);
    });

    registrarEventoAnalytics();
});

window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY) {
        loadCartFromStorage();
        updateCartUI();
    }
});

// ==========================================
// CARREGAMENTO E MÍDIA DE PRODUTOS
// ==========================================
function carregarImagensProduto(productId) {
    const produto = (window.PRODUCTS || []).find(p => String(p.id) === String(productId)) || window.currentProduct;
    const imagemPrincipal = document.getElementById('mainImage');
    const miniaturasContainer = document.querySelector('.miniaturas');

    if (!produto || !imagemPrincipal || !miniaturasContainer) return Promise.resolve();

    const imagens = (produto.images && produto.images.length > 0 && produto.images[0])
        ? produto.images
        : [DEFAULT_PRODUCT_IMAGE];

    const imagemFallback = DEFAULT_PRODUCT_IMAGE;
    const imagemSolicitada = imagens[0] || imagemFallback;
    let resolverImagem;
    const imagemCarregada = new Promise(resolve => {
        resolverImagem = resolve;
        imagemPrincipal.onload = resolve;
        imagemPrincipal.onerror = () => {
            if (imagemPrincipal.src !== new URL(imagemFallback, document.baseURI).href) {
                imagemPrincipal.src = imagemFallback;
            } else {
                resolve();
            }
        };
    });
    imagemPrincipal.src = imagemSolicitada;
    if (imagemPrincipal.complete && imagemPrincipal.naturalWidth > 0) {
        resolverImagem();
    }
    imagemPrincipal.alt = produto.title || 'Imagem do produto';

    miniaturasContainer.replaceChildren();
    if (imagens.length < 2) return imagemCarregada;

    imagens.forEach((src, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `Exibir imagem ${index + 1} de ${produto.title || 'produto'}`);
        button.setAttribute('aria-pressed', String(index === 0));

        const thumbnail = document.createElement('img');
        thumbnail.src = src || DEFAULT_PRODUCT_IMAGE;
        thumbnail.alt = '';
        thumbnail.loading = 'lazy';
        thumbnail.decoding = 'async';
        thumbnail.addEventListener('error', () => {
            thumbnail.src = DEFAULT_PRODUCT_IMAGE;
        }, { once: true });

        button.addEventListener('click', () => {
            imagemPrincipal.src = src || DEFAULT_PRODUCT_IMAGE;
            miniaturasContainer.querySelectorAll('button').forEach(item => {
                item.setAttribute('aria-pressed', String(item === button));
            });
        });
        button.appendChild(thumbnail);
        miniaturasContainer.appendChild(button);
    });
    return imagemCarregada;
}
window.carregarImagensProduto = carregarImagensProduto;

// ==========================================
// REGISTRO DE COTAÇÕES NO ANALYTICS (WHATSAPP)
// ==========================================
async function registrarCotacaoAnalytics(produtoIds) {
    if (!produtoIds) return;

    // Converte para array caso seja passado um ID único
    const list = Array.isArray(produtoIds) ? produtoIds : [produtoIds];

    // Extrai e deduplica IDs numéricos válidos (ignora quantidades)
    const uniqueIds = [...new Set(list.map(id => parseInt(id, 10)).filter(id => !isNaN(id)))];
    if (uniqueIds.length === 0) return;

    try {
        const client = typeof inicializarSupabase === 'function' ? await inicializarSupabase() : window.supabaseClient;
        if (!client) return;

        let sessionId = sessionStorage.getItem('alfa_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('alfa_session_id', sessionId);
        }

        const fullPath = window.location.pathname + window.location.search;

        // Cria 1 registro no analytics para cada produto diferente solicitado
        const payload = uniqueIds.map(prodId => ({
            event_type: 'quote',
            page_path: fullPath,
            produto_id: prodId,
            session_id: sessionId
        }));

        await client.from('analytics').insert(payload);
    } catch (err) {
        console.warn('Erro ao registrar cotação no analytics:', err);
    }
}
window.registrarCotacaoAnalytics = registrarCotacaoAnalytics;