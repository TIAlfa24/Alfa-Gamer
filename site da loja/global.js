// ====================================================== //
// 🛒 SISTEMA DE PRODUTOS E CARRINHO - VERSÃO CORRIGIDA //
// ====================================================== //
const DEFAULT_PRODUCT_IMAGE = "images/products/placeholder.png";
// ==================== ESTADO GLOBAL E CONSTANTES ==================== //
const PRODUCTS = [
    { id: 1, title: "PC Gamer Ryzen 5", category: "pc", price: 3499, stock: 15, desc: "Desktop com RTX 3060, 16GB RAM", images: ["images/products/teste.jpg", "images/products/teste 2.jpg", "images/products/teste 3.jpg"], specs: { "Processador": "AMD Ryzen 5 5600G", "Placa de Vídeo": "NVIDIA GeForce RTX 3060", "Memória RAM": "16GB DDR4 3200MHz", "Armazenamento": "SSD 512GB NVMe" } },
    { id: 2, title: "Notebook Gamer 15\"", category: "pc", price: 4899, stock: 2, desc: "i7, GTX 1660 Ti, 16GB RAM", images: [], specs: { "Processador": "Intel Core i7-10750H", "Placa de Vídeo": "NVIDIA GeForce GTX 1660 Ti", "Memória RAM": "16GB DDR4 2933MHz", "Tela": "15.6\" Full HD 144Hz" } },
    { id: 3, title: "Mouse Gamer RGB", category: "periféricos", price: 129, stock: 50, desc: "Sensor 16000 DPI", images: [], specs: { "Sensor": "Óptico 16000 DPI", "Botões": "6 programáveis" } },
    { id: 4, title: "Teclado Mecânico", category: "periféricos", price: 299, stock: 5, desc: "Switches azuis, retroiluminado", images: [], specs: { "Tipo de Switch": "Mecânico Azul", "Layout": "ABNT2" } },
    { id: 5, title: "Monitor 24\" Full HD", category: "periféricos", price: 799, stock: 22, desc: "144Hz, 1ms", specs: { "Tamanho da Tela": "24 polegadas", "Resolução": "1920 x 1080" } },
    { id: 6, title: "Headset Gamer", category: "periféricos", price: 199, stock: 0, desc: "Som surround 7.1", images: [], specs: { "Áudio": "Som Surround 7.1 Virtual", "Microfone": "Cancelamento de ruído" } },
    { id: 7, title: "PC Workstation i9", category: "pc", price: 6999, stock: 1, desc: "RTX 3080, 32GB RAM, SSD 1TB", images: [], specs: { "Processador": "Intel Core i9-12900K", "Placa de Vídeo": "NVIDIA GeForce RTX 3080" } },
    { id: 8, title: "Mousepad Gamer XL", category: "periféricos", price: 89, stock: 100, desc: "Superfície de alta precisão", images: [], specs: { "Tamanho": "Extra Grande (900x400mm )" } },
    { id: 9, title: "Webcam Full HD", category: "periféricos", price: 249, stock: 0, desc: "Ideal para streaming", images: [], specs: { "Resolução": "1080p Full HD a 30 FPS" } },
    { id: 10, title: "All-in-One i5", category: "pc", price: 3999, stock: 3, desc: "Tela 23.8\", 16GB RAM, SSD 512GB", images: [], specs: { "Processador": "Intel Core i5-1135G7", "Tela": "23.8\" Full HD Touchscreen" } }
];

const CART_STORAGE_KEY = 'cart.items.v1';
const el = id => document.getElementById(id);
const money = v => 'R$ ' + v.toFixed(2).replace('.', ',');

// ===== A FONTE DA VERDADE =====
const globalState = {
    cart: {},
    isCartOpen: false
};

// ==================== LÓGICA DE DADOS DO CARRINHO ====================
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

    // Bloqueia se estiver esgotado
    if (p.stock <= 0) {
        alert(`O produto "${p.title}" está esgotado.`);
        return;
    }

    const currentQty = globalState.cart[id] || 0;

    // Produto com exatamente 3 em estoque → respeita o estoque
    if (p.stock === 3) {
        if (currentQty + qty > p.stock) {
            showLimitNotification(`⚠️ Apenas ${p.stock} unidades disponíveis.`);
            return;
        }
    }
    // Todos os outros → limite fixo de 3 por cliente
    else {
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

    // Não permite quantidade abaixo de 1
    if (newQty <= 0) {
        delete globalState.cart[id];
        saveCartToStorage();
        updateCartUI();
        return;
    }

    // Produto com exatamente 3 em estoque → respeita o estoque
    if (p.stock === 3 && newQty > p.stock) {
        showLimitNotification(`⚠️ Apenas ${p.stock} unidades disponíveis.`);
        return;
    }

    // Todos os outros → limite fixo de 3
    if (p.stock !== 3 && newQty > MAX_PER_PRODUCT) {
        showLimitNotification(`⚠️ Limite de ${MAX_PER_PRODUCT} unidades por produto.`);
        return;
    }

    globalState.cart[id] = newQty;
    saveCartToStorage();
    updateCartUI();
}

// ==================== ATUALIZAÇÃO DA INTERFACE (UI) ====================
function updateCartUI() {
    const cartItemsContainers = document.querySelectorAll('#cartItems');
    const cartTotalElements = document.querySelectorAll('#cartTotal');
    if (!cartItemsContainers.length) return;

    let total = 0, count = 0;
    let itemsHtml = '';

    Object.keys(globalState.cart).forEach(k => {
        const qty = globalState.cart[k];
        const p = PRODUCTS.find(x => x.id == k);
        if (!p) return;
        total += p.price * qty;
        count += qty;
        itemsHtml += `
            <div class="cart-item">
                <div class="thumb">${p.title.split(' ')[0]}</div>
                <div style="flex:1">
                    <div style="font-weight:700">${p.title}</div>
                    <div style="font-size:13px;color:var(--muted)">${money(p.price)} x ${qty}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">
                    <button class="btn" onclick="changeQty(${p.id}, 1)">+</button>
                    <button class="btn ghost" onclick="changeQty(${p.id}, -1)">-</button>
                </div>
            </div>
        `;
    });

    // Preenche todos os blocos de itens (Drawer + Bottom Sheet)
    cartItemsContainers.forEach(c => c.innerHTML = itemsHtml);

    // Atualiza todos os totais (Drawer + Bottom Sheet)
    cartTotalElements.forEach(t => t.textContent = money(total));

    if (el('cartCountHeader')) el('cartCountHeader').textContent = count;
    if (el('draggableCartBadge')) el('draggableCartBadge').textContent = count;
    if (el('cartCountNav')) el('cartCountNav').textContent = count;
}

function updateAllCartIcons(isOpen) {
    const headerImg = document.querySelector('#openCartHeader img');
    const navImg = document.querySelector('#openCartNav img');
    const widgetImg = document.querySelector('.draggable-cart-header img');
    const newSrc = isOpen ? 'close-cart.png' : 'cart.png';

    animateImageTo(headerImg, newSrc, isOpen ? 'blackhole' : 'jump');
    animateImageTo(navImg, newSrc, isOpen ? 'blackhole' : 'jump');
    if (widgetImg) widgetImg.src = newSrc; // Animação no widget pode ser distrativa
}

function animateImageTo(img, newSrc, type) {
    if (!img) return;
    img.classList.remove('anim-jump', 'anim-pop-in', 'anim-blackhole');
    void img.offsetWidth; // Força reflow

    if (type === 'blackhole') {
        img.classList.add('anim-blackhole');
        img.addEventListener('animationend', () => {
            img.src = newSrc;
            img.classList.remove('anim-blackhole');
            img.classList.add('anim-pop-in');
        }, { once: true });
    } else if (type === 'jump') {
        img.src = newSrc;
        img.classList.add('anim-jump');
    } else {
        img.src = newSrc;
    }
}

// ==================== CONTROLE DE ABERTURA/FECHAMENTO DO CARRINHO ====================
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

    updateAllCartIcons(isOpen);
}

// ==================== MENU HAMBURGER ====================
function setupHamburgerMenu() {
    const hamburger = el('hamburger');
    const navMenu = el('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isNowActive = !hamburger.classList.contains('active');
            hamburger.classList.toggle('active', isNowActive);
            navMenu.classList.toggle('active', isNowActive);

            // 🔽 FECHA O CARRINHO SE O MENU FOR ABERTO
            if (isNowActive && globalState.isCartOpen) {
                setCartOpen(false);
            }
        });
    }
}

// ==================== WIDGET ARRASTÁVEL ====================
function setupDraggableCartWidget() {
    const widget = el('draggableCartWidget');
    if (!widget) return;

    let isDragging = false;
    let startX, startY, offsetX, offsetY;

    function onStart(e) {
        // Inicia o processo de arrastar
        isDragging = true;
        widget.classList.add('dragging');

        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX;
        startY = t.clientY;

        const rect = widget.getBoundingClientRect();
        offsetX = startX - rect.left;
        offsetY = startY - rect.top;

        // Adiciona os listeners de movimento APENAS quando o arrasto começa
        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        if (!isDragging) return;
        e.preventDefault(); // Previne scroll da página durante o arrasto

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
        // Apenas finaliza o estado de arrasto
        isDragging = false;
        widget.classList.remove('dragging');

        // Remove os listeners de movimento para não interferirem com outros cliques
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
    }

    // --- REGISTRO DE EVENTOS ---

    // 1. Evento de clique para abrir/fechar o carrinho
    widget.addEventListener('click', (e) => {
        // Se o widget estava sendo arrastado, o 'click' não deve fazer nada.
        // A classe 'dragging' nos ajuda a identificar isso.
        if (widget.classList.contains('dragging')) {
            return;
        }
        toggleCart();
    });

    // 2. Eventos de mousedown/touchstart para INICIAR o arrasto
    widget.addEventListener('mousedown', onStart);
    widget.addEventListener('touchstart', onStart, { passive: true });
}


// ==================== INICIALIZAÇÃO GERAL ====================
function carregarImagensProduto(productId) {
    const produto = PRODUCTS.find(p => p.id === productId);
    const imagemPrincipal = document.getElementById('mainImage');
    const miniaturasContainer = document.querySelector('.miniaturas');

    // Se o produto não existir, aborta
    if (!produto) return;

    // Usa as imagens do produto ou uma lista contendo apenas o placeholder
    const imagens = (produto.images && produto.images.length > 0)
        ? produto.images
        : [DEFAULT_PRODUCT_IMAGE];

    // Define imagem principal
    imagemPrincipal.src = imagens[0] || DEFAULT_PRODUCT_IMAGE;

    // Gera miniaturas
    miniaturasContainer.innerHTML = '';
    imagens.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src || DEFAULT_PRODUCT_IMAGE;
        img.alt = `${produto.title} - Imagem ${index + 1}`;
        img.onerror = () => { img.src = DEFAULT_PRODUCT_IMAGE; }; // fallback extra
        img.onclick = () => trocarImagem(src || DEFAULT_PRODUCT_IMAGE);
        miniaturasContainer.appendChild(img);
    });

    // Marca a primeira miniatura como ativa
    const thumbs = miniaturasContainer.querySelectorAll('img');
    if (thumbs[0]) thumbs[0].classList.add('active');

    // Ajusta rolagem se houver muitas miniaturas
    const adjustThumbs = () => {
        const mainH = imagemPrincipal.clientHeight || imagemPrincipal.naturalHeight || 400;
        if (imagens.length > 5) {
            miniaturasContainer.classList.add('scrollable');
            miniaturasContainer.style.maxHeight = mainH + 'px';
        } else {
            miniaturasContainer.classList.remove('scrollable');
            miniaturasContainer.style.maxHeight = '';
        }
    };

    if (imagemPrincipal.complete) adjustThumbs();
    else imagemPrincipal.addEventListener('load', adjustThumbs);
    window.addEventListener('resize', adjustThumbs);
}

function toggleCart() {
    setCartOpen(!globalState.isCartOpen);
}

function showLimitNotification() {
            // evita múltiplas notificações empilhadas
            const existing = document.querySelector('.limit-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'limit-toast';
            toast.textContent = '⚠️ Limite de produto atingido';
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('hide');
                toast.addEventListener('transitionend', () => toast.remove());
            }, 2000);
        }

document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    updateCartUI();

    setupHamburgerMenu();
    setupDraggableCartWidget();

    // --- REGISTRO DE EVENTOS DO CARRINHO ---
    el('openCartHeader')?.addEventListener('click', toggleCart);
    el('openCartNav')?.addEventListener('click', toggleCart);
    el('closeCart')?.addEventListener('click', () => setCartOpen(false));
    el('closeCartBottom')?.addEventListener('click', () => setCartOpen(false));

    document.querySelectorAll('.checkout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Checkout de exemplo.');
        });
    });

    // --- LÓGICA RESPONSIVA ---
    window.addEventListener('resize', () => {
        // Apenas re-aplica o estado atual para o layout correto (mobile/desktop)
        setCartOpen(globalState.isCartOpen);
    });

    // --- CONTROLE DO INPUT DE QUANTIDADE (respeitando MAX_PER_PRODUCT) ---
    const qtyInput = document.getElementById('qty');
    const qtyMinusBtn = document.querySelector('.quantidade button:nth-child(1)');
    const qtyPlusBtn = document.querySelector('.quantidade button:nth-child(3)');

    if (qtyInput) {
        qtyInput.min = 1;
        qtyInput.max = MAX_PER_PRODUCT;
        if (!qtyInput.value || parseInt(qtyInput.value) < 1) qtyInput.value = 1;
        if (parseInt(qtyInput.value) > MAX_PER_PRODUCT) qtyInput.value = MAX_PER_PRODUCT;

        qtyInput.addEventListener('input', () => {
            let val = parseInt(qtyInput.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > MAX_PER_PRODUCT) {
                qtyInput.value = MAX_PER_PRODUCT;
                showLimitNotification(`⚠️ Limite de ${MAX_PER_PRODUCT} unidades por produto`);
            } else {
                qtyInput.value = val;
            }
        });
    }

    function adjustQty(delta) {
        if (!qtyInput) return;
        const cur = parseInt(qtyInput.value) || 1;
        const next = Math.max(1, Math.min(MAX_PER_PRODUCT, cur + delta));
        if (next === cur && delta > 0) {
            showLimitNotification(`⚠️ Limite de ${MAX_PER_PRODUCT} unidades por produto`);
            return;
        }
        qtyInput.value = next;
    }

});
