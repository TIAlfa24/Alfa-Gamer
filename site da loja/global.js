// ====================================================== //
// 🛒 SISTEMA DE PRODUTOS E CARRINHO - VERSÃO CORRIGIDA //
// ====================================================== //
const DEFAULT_PRODUCT_IMAGE = "images/products/placeholder.png";
// ==================== ESTADO GLOBAL E CONSTANTES ==================== //
const PRODUCTS = [
    {
        id: 1,
        title: "PC Gamer Ryzen 5",
        category: "computadores",
        price: 3499,
        stock: 0,
        desc: "Desktop com RTX 3060, 16GB RAM",
        images: ["images/products/teste.jpg", "images/products/teste 2.jpg", "images/products/teste 3.jpg"],
        specs: { "Processador": "AMD Ryzen 5 5600G", "Placa de Vídeo": "NVIDIA GeForce RTX 3060", "Memória RAM": "16GB DDR4 3200MHz", "Armazenamento": "SSD 512GB NVMe" },
        tags: ["gamer", "desktop", "ryzen", "computador", "RTX 3060", "16GB RAM"]
    },
    {
        id: 2,
        title: "Notebook Gamer 15\"",
        category: "computadores",
        price: 4899,
        stock: 0,
        desc: "i7, GTX 1660 Ti, 16GB RAM",
        images: [],
        specs: { "Processador": "Intel Core i7-10750H", "Placa de Vídeo": "NVIDIA GeForce GTX 1660 Ti", "Memória RAM": "16GB DDR4 2933MHz", "Tela": "15.6\" Full HD 144Hz" },
        tags: ["notebook", "gamer", "i7", "GTX 1660 Ti", "laptop", "15 polegadas", "intel",]
    },
    {
        id: 3,
        title: "Mouse Gamer RGB",
        category: "periféricos",
        price: 129,
        stock: 50,
        desc: "Sensor 16000 DPI",
        images: [],
        specs: { "Sensor": "Óptico 16000 DPI", "Botões": "6 programáveis" },
        tags: ["mouse", "gamer", "RGB", "periférico", "16000 DPI"]
    },
    {
        id: 4,
        title: "Teclado Mecânico",
        category: "periféricos",
        price: 299,
        stock: 5,
        desc: "Switches azuis, retroiluminado",
        images: [],
        specs: { "Tipo de Switch": "Mecânico Azul", "Layout": "ABNT2" },
        tags: ["teclado", "mecânico", "gamer", "retroiluminado", "ABNT2"]
    },
    {
        id: 5,
        title: "Monitor 24\" Full HD",
        category: "periféricos",
        price: 799,
        stock: 22,
        desc: "144Hz, 1ms",
        images: [],
        specs: { "Tamanho da Tela": "24 polegadas", "Resolução": "1920 x 1080" },
        tags: ["monitor", "24 polegadas", "full HD", "144Hz", "1ms"]
    },
    {
        id: 6,
        title: "Headset Gamer",
        category: "periféricos",
        price: 199,
        stock: 0,
        desc: "Som surround 7.1",
        images: [],
        specs: { "Áudio": "Som Surround 7.1 Virtual", "Microfone": "Cancelamento de ruído" },
        tags: ["headset", "gamer", "som surround", "microfone", "periférico"]
    },
    {
        id: 7,
        title: "PC Workstation i9",
        category: "computadores",
        price: 6999,
        stock: 1,
        desc: "RTX 3080, 32GB RAM, SSD 1TB",
        images: [],
        specs: { "Processador": "Intel Core i9-12900K", "Placa de Vídeo": "NVIDIA GeForce RTX 3080" },
        tags: ["workstation", "desktop", "i9", "RTX 3080", "32GB RAM", "SSD 1TB", "intel"]
    },
    {
        id: 8,
        title: "Mousepad Gamer XL",
        category: "periféricos",
        price: 89,
        stock: 100,
        desc: "Superfície de alta precisão",
        images: [],
        specs: { "Tamanho": "Extra Grande (900x400mm )" },
        tags: ["mousepad", "gamer", "XL", "periférico", "extra grande"]
    },
    {
        id: 9,
        title: "Webcam Full HD",
        category: "periféricos",
        price: 249,
        stock: 0,
        desc: "Ideal para streaming",
        images: [],
        specs: { "Resolução": "1080p Full HD a 30 FPS" },
        tags: ["webcam", "full HD", "streaming", "periférico"]
    },
    {
        id: 10,
        title: "All-in-One i5",
        category: "computadores",
        price: 3999,
        stock: 3,
        desc: "Tela 23.8\", 16GB RAM, SSD 512GB",
        images: [],
        specs: { "Processador": "Intel Core i5-1135G7", "Tela": "23.8\" Full HD Touchscreen" },
        tags: ["all-in-one", "pc", "i5", "desktop", "23.8 polegadas", "16GB RAM", "SSD 512GB"]
    },
    {
        id: 11,
        title: "RTX 4070 Ti",
        category: "hardware",
        subcategory: "placas de vídeo",
        price: 3299,
        stock: 30,
        desc: "Placa de vídeo NVIDIA GeForce RTX 4070 Ti",
        images: [],
        specs: { "Memória": "12GB GDDR6X", "Interface": "192-bit" },
        tags: ["placa de vídeo", "gpu", "RTX 4070 Ti", "NVIDIA"]
    }
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

const cartDrawer = document.querySelector('.cart-drawer');
let lastScroll = 0;

function toggleCartDrawer() {
    const isOpen = cartDrawer.classList.toggle('open');

    if (isOpen) {
        // Pega a posição atual na página
        lastScroll = window.scrollY;
        cartDrawer.style.position = 'absolute';
        cartDrawer.style.top = `${lastScroll + 100}px`; // 100 = mesma distância do topo que você usa
    } else {
        // Restaura o comportamento normal
        cartDrawer.style.position = '';
        cartDrawer.style.top = '';
    }
}


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

// ======================================================
// 🔍 BUSCA INTELIGENTE / AUTOCOMPLETE - EQUIPE ALFA
// ======================================================

(function setupSmartSearch() {
    const searchInputs = [
        document.getElementById("search"),
        document.getElementById("searchMobile")
    ].filter(Boolean);

    if (!searchInputs.length) return;

    // Quick actions (atalhos automáticos)
    const QUICK_ACTIONS = [
        { label: "Promoções", query: "promo", action: () => sortBy("price-desc") },
        { label: "Mais baratos", query: "barato", action: () => sortBy("price-asc") },
        { label: "Mais caros", query: "caro", action: () => sortBy("price-desc") },
        { label: "Lançamentos", query: "novo", action: () => sortBy("default") },
        { label: "Frete Grátis", query: "frete", action: () => alert("💡 Filtro de frete grátis ainda não disponível!") }
    ];

    // Mapa de categorias por palavra-chave
    const CATEGORIES_MAP = [
        { value: "computadores", keywords: ["pc", "computador", "notebook", "desktop", "workstation"] },
        {
            value: "acessórios", keywords: ["cabo", "adaptador", "suporte", "fonte notebook", "hub usb"], subcategories: [
                { value: "cabos", keywords: ["cabo"] },
                { value: "adaptadores", keywords: ["adaptador"] },
                { value: "suportes", keywords: ["suporte"] },
                { value: "fontes para notebook", keywords: ["fonte notebook"] },
                { value: "hubs usb", keywords: ["hub usb"] },
            ]
        },
        {
            value: "periféricos", keywords: ["mouse", "teclado", "monitor", "headset", "webcam", "mousepad"], subcategories: [
                { value: "mouses", keywords: ["mouse"] },
                { value: "teclados", keywords: ["teclado"] },
                { value: "monitores", keywords: ["monitor"] },
                { value: "headsets", keywords: ["headset"] },
                { value: "webcams", keywords: ["webcam"] },
                { value: "mousepads", keywords: ["mousepad"] },
            ]
        },
        {
            value: "hardware", keywords: ["placa de vídeo", "gpu", "processador", "cpu", "placa mãe", "memória ram", "ssd", "hd", "fonte", "gabinete", "cooler", "water cooler", "fan"], subcategories: [
                { value: "placas de vídeo", keywords: ["placa de vídeo", "gpu"] },
                { value: "processadores", keywords: ["processador", "cpu"] },
                { value: "placas-mãe", keywords: ["placa mãe"] },
                { value: "memórias ram", keywords: ["memória ram"] },
                { value: "armazenamento", keywords: ["ssd", "hd", "m.2"] },
            ]
        },
    ];

    // Cria o container de sugestões
    const createSuggestionBox = (input) => {
        let box = document.createElement("div");
        box.className = "search-suggestions";
        box.style.display = "none";
        input.parentNode.style.position = "relative";
        input.parentNode.appendChild(box);
        return box;
    };

    const boxes = new Map();
    searchInputs.forEach(input => boxes.set(input, createSuggestionBox(input)));

    // Debounce para performance
    const debounce = (fn, ms) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    };

    // Detecta quick actions
    function detectQuickAction(term) {
        term = term.toLowerCase();
        return QUICK_ACTIONS.find(a => term.includes(a.query));
    }

    // Função auxiliar para medir similaridade de palavras (Levenshtein)
    function similarity(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        const matrix = [];

        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substituição
                        matrix[i][j - 1] + 1,     // inserção
                        matrix[i - 1][j] + 1      // deleção
                    );
                }
            }
        }

        const distance = matrix[b.length][a.length];
        const maxLen = Math.max(a.length, b.length);
        return 1 - distance / maxLen;
    }

    function detectCategory(term) {
        term = term.toLowerCase();

        let bestMatch = null;
        let bestScore = 0.0;

        for (const category of CATEGORIES_MAP) {
            for (const keyword of category.keywords) {
                const score = similarity(term, keyword);
                if (term.includes(keyword) || score > 0.8) {
                    bestMatch = { value: category.value, subvalue: null, type: "category" };
                    bestScore = score;
                }
            }

            if (category.subcategories) {
                for (const sub of category.subcategories) {
                    for (const keyword of sub.keywords) {
                        const score = similarity(term, keyword);
                        if (term.includes(keyword) || score > 0.8) {
                            bestMatch = { value: category.value, subvalue: sub.value, type: "subcategory" };
                            bestScore = score;
                        }
                    }
                }
            }
        }

        return bestMatch;
    }



    // Aplica ordenação rápida
    function sortBy(value) {
        const sortEl = document.getElementById("sort");
        if (sortEl) sortEl.value = value;
        applyFilters();
    }

    // Atualiza e mostra sugestões
    // Atualiza e mostra sugestões
    function updateSuggestions(input, value) {
        const box = boxes.get(input);
        if (!box) return;
        box.innerHTML = "";
        const term = value.trim().toLowerCase();

        if (!term) {
            box.style.display = "none";
            return;
        }

        let results = PRODUCTS.filter(p =>
            p.title.toLowerCase().includes(term) ||
            p.desc.toLowerCase().includes(term) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
        ).slice(0, 5);

        const quick = detectQuickAction(term);
        const cat = detectCategory(term);

        if (quick) {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.innerHTML = `<span>⚡ ${quick.label}</span>`;
            item.onclick = () => {
                quick.action();
                box.style.display = "none";
            };
            box.appendChild(item);
        }

        if (cat) {
            const item = document.createElement("div");
            item.className = "suggestion-item";

            const catName = cat.value;
            const subCat = cat.subvalue ? ` > ${cat.subvalue}` : "";
            item.innerHTML = `<span>📁 Categoria: ${catName}${subCat}</span>`;

            item.onclick = () => {
                const input = document.querySelector(`input[name="cat"][value="${catName}"]`);
                if (input) input.checked = true;
                applyFilters();
                box.style.display = "none";
            };

            box.appendChild(item);
        }

        results.forEach((p, idx) => {
            const imgSrc = (p.images && p.images.length) ? p.images[0] : DEFAULT_PRODUCT_IMAGE;
            const item = document.createElement("div");
            item.className = "suggestion-item product-suggestion";
            item.innerHTML = `
        <div class="suggestion-thumb">
            <img src="${imgSrc}" alt="${p.title}">
        </div>
        <div class="suggestion-info">
            <div class="suggestion-title">${p.title}</div>
            <div class="suggestion-price">${money(p.price)}</div>
        </div>
    `;
            item.onclick = () => {
                input.value = p.title;
                if (input.id === "searchMobile") {
                    const desktopInput = document.getElementById("search");
                    if (desktopInput) desktopInput.value = p.title;
                }
                applyFilters();
                box.style.display = "none";
            };
            box.appendChild(item);

            // 🔹 Adiciona a faixa verde separadora entre os itens
            if (idx < results.length - 1) {
                const separator = document.createElement("div");
                separator.className = "suggestion-separator";
                box.appendChild(separator);
            }
        });


        box.style.display = box.children.length > 0 ? "block" : "none";
    }

    // Eventos de digitação
    searchInputs.forEach(input => {
        input.addEventListener("input", debounce(e => {
            const val = e.target.value;
            updateSuggestions(input, val);
        }, 200));

        input.addEventListener("focus", () => {
            if (input.value.trim()) updateSuggestions(input, input.value);
        });

        input.addEventListener("blur", () => {
            setTimeout(() => {
                const box = boxes.get(input);
                if (box) box.style.display = "none";
            }, 200);
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                applyFilters();
                const box = boxes.get(input);
                if (box) box.style.display = "none";
            }
        });
    });

    console.log("✅ Busca inteligente ativada (topbar + topbar-mobile)");
})();

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
