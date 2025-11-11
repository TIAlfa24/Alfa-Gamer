// Variáveis e Funções Comuns
const PRODUCTS = [
    { 
        id: 1, 
        title: "PC Gamer Ryzen 5", 
        category: "pc", 
        price: 3499, 
        desc: "Desktop com RTX 3060, 16GB RAM", 
        images: [
            "images/products/teste.jpg",
            "images/products/teste 2.jpg",
            "images/products/teste 3.jpg",
            
        ],
        specs: { 
            "Processador": "AMD Ryzen 5 5600G", 
            "Placa de Vídeo": "NVIDIA GeForce RTX 3060", 
            "Memória RAM": "16GB DDR4 3200MHz", 
            "Armazenamento": "SSD 512GB NVMe" 
        }
    },
    { 
        id: 2, 
        title: "Notebook Gamer 15\"", 
        category: "pc", 
        price: 4899, 
        desc: "i7, GTX 1660 Ti, 16GB RAM", 
        images: [
            "https://via.placeholder.com/800x800.png?text=Notebook+1",
            "https://via.placeholder.com/800x800.png?text=Notebook+2",
            "https://via.placeholder.com/800x800.png?text=Notebook+3",
            "https://via.placeholder.com/800x800.png?text=Notebook+4"
        ],
        specs: { 
            "Processador": "Intel Core i7-10750H", 
            "Placa de Vídeo": "NVIDIA GeForce GTX 1660 Ti", 
            "Memória RAM": "16GB DDR4 2933MHz", 
            "Tela": "15.6\" Full HD 144Hz" 
        }
    },
    { 
        id: 3, 
        title: "Mouse Gamer RGB", 
        category: "periféricos", 
        price: 129, 
        desc: "Sensor 16000 DPI", 
        images: [
            "https://via.placeholder.com/800x800.png?text=Mouse+1",
            "https://via.placeholder.com/800x800.png?text=Mouse+2",
            "https://via.placeholder.com/800x800.png?text=Mouse+3",
            "https://via.placeholder.com/800x800.png?text=Mouse+4"
        ],
        specs: { 
            "Sensor": "Óptico 16000 DPI", 
            "Botões": "6 programáveis", 
            "Iluminação": "RGB Chroma" 
        }
    },
    { id: 4, title: "Teclado Mecânico", category: "periféricos", price: 299, desc: "Switches azuis, retroiluminado", specs: { "Tipo de Switch": "Mecânico Azul", "Layout": "ABNT2", "Iluminação": "LED Vermelho" } },
    { id: 5, title: "Monitor 24\" Full HD", category: "periféricos", price: 799, desc: "144Hz, 1ms", specs: { "Tamanho da Tela": "24 polegadas", "Resolução": "1920 x 1080 (Full HD)", "Taxa de Atualização": "144Hz", "Tempo de Resposta": "1ms" } },
    { id: 6, title: "Headset Gamer", category: "periféricos", price: 199, desc: "Som surround 7.1", specs: { "Áudio": "Som Surround 7.1 Virtual", "Microfone": "Cancelamento de ruído", "Conexão": "USB" } },
    { id: 7, title: "PC Workstation i9", category: "pc", price: 6999, desc: "RTX 3080, 32GB RAM, SSD 1TB", specs: { "Processador": "Intel Core i9-12900K", "Placa de Vídeo": "NVIDIA GeForce RTX 3080", "Memória RAM": "32GB DDR5 4800MHz", "Armazenamento": "SSD 1TB NVMe Gen4" } },
    { id: 8, title: "Mousepad Gamer XL", category: "periféricos", price: 89, desc: "Superfície de alta precisão", specs: { "Tamanho": "Extra Grande (900x400mm)", "Superfície": "Tecido de alta densidade", "Base": "Borracha antiderrapante" } },
    { id: 9, title: "Webcam Full HD", category: "periféricos", price: 249, desc: "Ideal para streaming", specs: { "Resolução": "1080p Full HD a 30 FPS", "Foco": "Automático", "Microfone": "Integrado com redução de ruído" } },
    { id: 10, title: "All-in-One i5", category: "pc", price: 3999, desc: "Tela 23.8\", 16GB RAM, SSD 512GB", specs: { "Processador": "Intel Core i5-1135G7", "Memória RAM": "16GB DDR4", "Armazenamento": "SSD 512GB", "Tela": "23.8\" Full HD Touchscreen" } }
];

// Estado do carrinho (persistido em localStorage)
const cartState = { cart: {} };
const CART_STORAGE_KEY = 'cart.items.v1';

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // ensure object shape
            if (parsed && typeof parsed === 'object') cartState.cart = parsed;
        }
    } catch (e) { /* ignore parse errors */ }
}

function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState.cart));
    } catch (e) { /* ignore storage errors (private mode) */ }
}
const el = id => document.getElementById(id);
const money = v => 'R$ ' + v.toFixed(2).replace('.', ',');

// Função para inicializar a página do produto
function initProdutoPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));
    if (productId) {
        carregarImagensProduto(productId);
        // Aqui você pode adicionar outras funções de inicialização se necessário
    }
}

// Função para carregar imagens do produto
function carregarImagensProduto(productId) {
    const produto = PRODUCTS.find(p => p.id === productId);
    if (!produto || !produto.images || !produto.images.length) return;

    const imagemPrincipal = document.getElementById('mainImage');
    const miniaturasContainer = document.querySelector('.miniaturas');
    
    // Define a imagem principal
    imagemPrincipal.src = produto.images[0];
    
    // Limpa e recria as miniaturas
    miniaturasContainer.innerHTML = '';
    produto.images.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${produto.title} - Imagem ${index + 1}`;
        img.onclick = () => trocarImagem(src);
        miniaturasContainer.appendChild(img);
    });

    // Ativa a primeira miniatura
    const thumbs = miniaturasContainer.querySelectorAll('img');
    if (thumbs[0]) thumbs[0].classList.add('active');

    // Ajusta comportamento de scroll das miniaturas: quando houver mais de 5 imagens,
    // torna o container rolável e limita a altura à altura da imagem principal.
    const adjustThumbs = () => {
        // calcula a altura atual da imagem principal (já renderizada)
        const mainH = imagemPrincipal.clientHeight || imagemPrincipal.naturalHeight || 400;
        if (produto.images.length > 5) {
            miniaturasContainer.classList.add('scrollable');
            miniaturasContainer.style.maxHeight = mainH + 'px';
        } else {
            miniaturasContainer.classList.remove('scrollable');
            miniaturasContainer.style.maxHeight = '';
        }
    };

    // Executa o ajuste após a imagem principal carregar (ou imediatamente se já carregada)
    if (imagemPrincipal.complete) adjustThumbs();
    else imagemPrincipal.addEventListener('load', adjustThumbs);
    // Recalcula ao redimensionar a janela para manter a altura sincronizada
    window.addEventListener('resize', adjustThumbs);
}

// Função para trocar imagem principal do produto
function trocarImagem(src) {
    const imagemPrincipal = document.getElementById('mainImage');
    const miniaturas = document.querySelectorAll('.miniaturas img');
    
    // Remove classe active de todas as miniaturas
    miniaturas.forEach(img => img.classList.remove('active'));
    
    // Adiciona classe active na miniatura selecionada
    const miniaturaAtiva = Array.from(miniaturas).find(img => img.src === src);
    if (miniaturaAtiva) {
        miniaturaAtiva.classList.add('active');
    }
    
    // Troca a imagem principal com efeito de fade
    imagemPrincipal.style.opacity = '0';
    setTimeout(() => {
        imagemPrincipal.src = src;
        imagemPrincipal.style.opacity = '1';
    }, 200);
}

// Animação de Imagem (para botões do carrinho)
function animateImageTo(img, newSrc, type) {
    if (!img) return;
    if (type === 'blackhole') {
        img.classList.remove('anim-jump', 'anim-pop-in');
        img.classList.add('anim-blackhole');
        const onEnd = function () {
            img.removeEventListener('animationend', onEnd);
            img.classList.remove('anim-blackhole');
            img.src = newSrc;
            img.classList.add('anim-pop-in');
            const onPop = function () { img.removeEventListener('animationend', onPop); img.classList.remove('anim-pop-in'); };
            img.addEventListener('animationend', onPop);
        };
        img.addEventListener('animationend', onEnd);
    } else if (type === 'jump') {
        img.classList.remove('anim-blackhole', 'anim-pop-in', 'anim-jump');
        img.src = newSrc;
        void img.offsetWidth;
        img.classList.add('anim-jump');
        const onEnd = function () { img.removeEventListener('animationend', onEnd); img.classList.remove('anim-jump'); };
        img.addEventListener('animationend', onEnd);
    } else {
        img.src = newSrc;
    }
}

// Lógica de Carrinho
function addToCart(id, qty = 1) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    cartState.cart[id] = (cartState.cart[id] || 0) + qty;
    saveCartToStorage();
    updateCartUI();
    // Animação de "jump" no botão do carrinho ao adicionar item
    const headerBtn = el('openCartHeader');
    if (headerBtn) {
        headerBtn.classList.add('anim-jump');
        setTimeout(() => headerBtn.classList.remove('anim-jump'), 520);
    }
}

function changeQty(id, delta) {
    if (!cartState.cart[id]) return;
    cartState.cart[id] += delta;
    if (cartState.cart[id] <= 0) delete cartState.cart[id];
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI() {
    const items = el('cartItems');
    if (!items) return;

    items.innerHTML = '';
    let total = 0;
    let count = 0;

    Object.keys(cartState.cart).forEach(k => {
        const qty = cartState.cart[k];
        const p = PRODUCTS.find(x => x.id == k);
        if (!p) return;

        total += p.price * qty;
        count += qty;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="thumb">${p.title.split(' ')[0]}</div>
            <div style="flex:1">
                <div style="font-weight:700">${p.title}</div>
                <div style="font-size:13px;color:var(--muted)">${money(p.price)} x ${qty}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
                <button class="btn" onclick="changeQty(${p.id}, 1)">+</button>
                <button class="btn ghost" onclick="changeQty(${p.id}, -1)">-</button>
            </div>
        `;
        items.appendChild(div);
    });

    if (el('cartTotal')) el('cartTotal').textContent = money(total);
    if (el('cartCountHeader')) el('cartCountHeader').textContent = count;
    if (el('cartCountNav')) el('cartCountNav').textContent = count;
}

// Lógica de UI do Carrinho (Drawer)
function setupCartUI() {
    const cartDrawer = el('cartDrawer');
    const openCartHeader = el('openCartHeader');
    const openCartNav = el('openCartNav');
    const closeCart = el('closeCart');
    const hamburger = el('hamburger');
    const navMenu = el('navMenu');

    if (!cartDrawer || !openCartHeader || !openCartNav || !closeCart) return;

    function toggleCart(open) {
        const isOpen = open === undefined ? !cartDrawer.classList.contains('open') : open;
        cartDrawer.classList.toggle('open', isOpen);
        cartDrawer.setAttribute('aria-hidden', !isOpen);

        const headerImg = openCartHeader.querySelector('img');
        const navImg = openCartNav.querySelector('img');
        const newSrc = isOpen ? 'close-cart.png' : 'cart.png';

        if (isOpen) {
            // Fecha o menu hamburger caso esteja aberto (mobile)
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
            }
            if (headerImg) animateImageTo(headerImg, newSrc, 'blackhole');
            if (navImg) animateImageTo(navImg, newSrc, 'blackhole');
        } else {
            if (headerImg) animateImageTo(headerImg, newSrc, 'jump');
            if (navImg) animateImageTo(navImg, newSrc, 'jump');
        }
    }

    openCartHeader.addEventListener('click', () => toggleCart());
    openCartNav.addEventListener('click', () => toggleCart());
    closeCart.addEventListener('click', () => toggleCart(false));

    // Lógica para fechar o carrinho ao abrir o menu hamburger (loja.html)
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            if (navMenu.classList.contains('active') && cartDrawer.classList.contains('open')) {
                toggleCart(false);
            }
        });
    }

    // Lógica de Checkout
    const checkoutBtn = el('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert('Checkout de exemplo — implementar integração de pagamento.');
        });
    }
}

// Lógica de Menu Hamburger
function setupHamburgerMenu() {
    const hamburger = el('hamburger');
    const navMenu = el('navMenu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Inicialização Comum
document.addEventListener('DOMContentLoaded', () => {
    // Carrega o carrinho salvo e inicializa a UI
    loadCartFromStorage();
    setupHamburgerMenu();
    setupCartUI();
    updateCartUI(); // Inicializa o contador do carrinho
});
