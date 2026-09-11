// 🔗 CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = 'https://qmaxoltmfusbhflviwvg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OGjx9Oh-Di0D5q2zUdOz-w_vhiZH0F2';

// Inicializa Supabase client com verificação de biblioteca
let _supabase = null;
let supabaseInicializacao = null;

// Função para esperar a biblioteca Supabase carregar
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

        _supabase = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );
        window.__alfaSupabaseClient = _supabase;
        window.supabaseClient = _supabase;
        console.log('✅ Supabase inicializado com sucesso');
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

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
    inicializarSupabase();
}

// Dentro de global.js
async function buscarProdutosPaginados(paginaAtual, itensPorPagina = 8) {
    // Calcula o intervalo. Ex: Página 1 (0 a 7), Página 2 (8 a 15)
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina - 1;

    try {
        // O { count: 'exact' } é importante para sabermos o total de itens no banco
        // e podermos desenhar os botões de paginação (1, 2, 3...) corretamente.
        const { data, error, count } = await supabase
            .from('produtos')
            .select('*', { count: 'exact' }) 
            .range(inicio, fim);

        if (error) throw error;

        return { produtos: data, totalGeral: count };
    } catch (error) {
        console.error("Erro na busca paginada:", error);
        return { produtos: [], totalGeral: 0 };
    }
}

const DEFAULT_PRODUCT_IMAGE = "/images/products/placeholder.png";
const PRODUCTS = [];
window.PRODUCTS = PRODUCTS;

if (typeof window !== 'undefined') {
    const placeholderPreload = new Image();
    placeholderPreload.src = DEFAULT_PRODUCT_IMAGE;
}

function normalizarProdutos(produtos) {
    return produtos.map(p => ({
        ...p,
        id: p.id,
        title: p.title || 'Produto sem título',
        category: p.category || 'outros',
        subcategory: p.subcategory || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        desc_text: p.desc_text || p.desc || '',
        images: Array.isArray(p.images)
            ? p.images
            : p.images
                ? [p.images]
                : [],
        tags: Array.isArray(p.tags) ? p.tags : [],
        specs: p.specs && typeof p.specs === 'object' ? p.specs : {}
    }));
}

const PRODUCTS_NORMALIZADO = PRODUCTS;

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
    const supabase = await inicializarSupabase(); //[cite: 5]
    if (!supabase) throw new Error('Supabase não inicializado.'); //[cite: 5]

    const { data, error } = await supabase
        .from('produtos') //[cite: 5]
        .select('*'); //[cite: 5]

    if (error) throw error; //[cite: 5]

    const produtos = normalizarProdutos(data || []); //[cite: 5]
    PRODUCTS.splice(0, PRODUCTS.length, ...produtos); //[cite: 5]

    // 🚀 NOVO: Atualiza a interface do carrinho com os produtos recém-carregados
    updateCartUI();

    return PRODUCTS; //[cite: 5]
}
window.carregarProdutosSupabase = carregarProdutosSupabase;


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

    // Preenche containers distintos
    const desktopItems = document.getElementById('cartItemsDesktop');
    const mobileItems = document.getElementById('cartItemsMobile');
    if (desktopItems) desktopItems.innerHTML = itemsHtml;
    if (mobileItems) mobileItems.innerHTML = itemsHtml;

    // Atualiza totais distintos
    const totalDesktop = document.getElementById('cartTotalDesktop');
    const totalMobile = document.getElementById('cartTotalMobile');
    if (totalDesktop) totalDesktop.textContent = money(total);
    if (totalMobile) totalMobile.textContent = money(total);

    // Atualiza badges
    if (el('cartCountHeader')) el('cartCountHeader').textContent = count;
    if (el('draggableCartBadge')) el('draggableCartBadge').textContent = count;
    if (el('cartCountNav')) el('cartCountNav').textContent = count;
}


function updateAllCartIcons(isOpen) {
    const headerImg = document.querySelector('#openCartHeader img');
    const navImg = document.querySelector('#openCartNav img');
    const widgetImg = document.querySelector('.draggable-cart-header img');
    const newSrc = isOpen ? '/images/close-cart.png' : '/images/cart.png';

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

    const QUICK_ACTIONS = [
        { label: "Promoções", query: "promo", action: () => sortBy("price-desc") },
        { label: "Mais baratos", query: "barato", action: () => sortBy("price-asc") },
        { label: "Mais caros", query: "caro", action: () => sortBy("price-desc") },
        { label: "Lançamentos", query: "novo", action: () => sortBy("default") },
        { label: "Frete Grátis", query: "frete", action: () => alert("💡 Filtro de frete grátis ainda não disponível!") }
    ];

    const CATEGORIES_MAP = [
        {
            value: "computadores",
            label: "Computadores",
            keywords: ["pc", "computador", "notebook", "desktop", "workstation"],
            subcategories: [
                { value: "gamer", label: "Gamers", keywords: ["computador gamer", "desktop gamer", "pc gamer", "gamer", "pra jogos"] },
                { value: "office", label: "Office", keywords: ["workstation", "estações de trabalho", "office"] },
                { value: "all-in-one", label: "All-in-One", keywords: ["all-in-one", "tudo em um"] },
                { value: "notebooks", label: "Notebooks", keywords: ["notebook", "laptop"] },
            ]
        },
        {
            value: "perifericos",
            label: "Periféricos",
            keywords: ["mouse", "teclado", "monitor", "headset", "webcam", "mousepad"],
            subcategories: [
                { value: "mouses", label: "Mouses", keywords: ["mouse"] },
                { value: "teclados", label: "Teclados", keywords: ["teclado"] },
                { value: "monitores", label: "Monitores", keywords: ["monitor"] },
                { value: "headsets", label: "Headsets", keywords: ["headset"] },
                { value: "webcams", label: "Webcams", keywords: ["webcam"] },
                { value: "mousepads", label: "Mousepads", keywords: ["mousepad"] },
            ]
        },
        {
            value: "hardware",
            label: "Hardware",
            keywords: ["placa de vídeo", "gpu", "processador", "cpu", "placa mãe", "memória ram", "ssd", "hd", "fonte", "gabinete", "cooler", "water cooler", "fan"],
            subcategories: [
                { value: "placas-de-video", label: "Placas de Vídeo", keywords: ["placa de vídeo", "placas de vídeo", "gpu"] },
                { value: "processadores", label: "Processadores", keywords: ["processador", "processadores", "cpu"] },
                { value: "placa-mae", label: "Placas-mãe", keywords: ["placa mãe", "placas-mãe"] },
                { value: "memorias-ram", label: "Memórias RAM", keywords: ["memória ram", "memórias ram"] },
                { value: "armazenamento", label: "Armazenamento", keywords: ["ssd", "hd", "m.2"] },
                { value: "fontes", label: "Fontes", keywords: ["fonte"] },
                { value: "gabinetes", label: "Gabinetes", keywords: ["gabinete"] },
                { value: "coolers", label: "Coolers", keywords: ["cooler", "water cooler", "fan"] },
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

        let results = PRODUCTS.filter(p => {
            const title = String(p.title || '').toLowerCase();
            const description = String(p.desc_text || p.desc || '').toLowerCase();
            const tags = Array.isArray(p.tags) ? p.tags : [];

            return title.includes(term) ||
                description.includes(term) ||
                tags.some(tag => String(tag).toLowerCase().includes(term));
        }).slice(0, 5);

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

            // Busca o objeto da categoria
            const categoryObj = CATEGORIES_MAP.find(c => c.value === cat.value);
            const catLabel = categoryObj ? categoryObj.label : cat.value;

            let subLabel = "";
            let targetValue = cat.value; // valor padrão

            if (cat.subvalue && categoryObj && categoryObj.subcategories) {
                const subObj = categoryObj.subcategories.find(s => s.value === cat.subvalue);
                subLabel = subObj ? ` > ${subObj.label}` : ` > ${cat.subvalue}`;
                targetValue = cat.subvalue; // se for subcategoria, usa ela
            }

            item.innerHTML = `<span>📁 Categoria: ${catLabel}${subLabel}</span>`;

            // 🔹 Ao clicar, marca o radio e aplica o filtro
            item.onclick = () => {
                const inputRadio = document.querySelector(`input[name="cat"][value="${targetValue}"]`);
                if (inputRadio) {
                    inputRadio.checked = true;
                }

                // 🔹 limpa os resultados atuais
                const productsContainer = document.getElementById("products");
                if (productsContainer) {
                    productsContainer.innerHTML = "";
                }
                // limpa os campos de busca
                const searchDesktop = document.getElementById("search");
                const searchMobile = document.getElementById("searchMobile");
                if (searchDesktop) searchDesktop.value = "";
                if (searchMobile) searchMobile.value = "";
                // chama a função global de filtros
                if (typeof applyFilters === "function") {
                    applyFilters();
                }
                // fecha a box de sugestões
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

    document.querySelectorAll('.cat-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const next = btn.nextElementSibling;
            next.classList.toggle('open');
        });
    });

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

    // Se o produto ou os elementos visuais não existirem na página, aborta
    if (!produto || !imagemPrincipal || !miniaturasContainer) return;

    // 1. Prepara a lista de imagens validando se a primeira URL realmente existe/tem texto
    const imagens = (produto.images && produto.images.length > 0 && produto.images[0])
        ? produto.images
        : [DEFAULT_PRODUCT_IMAGE];

    // 2. Define a imagem principal e adiciona a proteção contra erros
    imagemPrincipal.onerror = () => { 
        imagemPrincipal.src = DEFAULT_PRODUCT_IMAGE; 
    };
    imagemPrincipal.src = imagens[0] || DEFAULT_PRODUCT_IMAGE;

    // 3. Gera as miniaturas
    miniaturasContainer.innerHTML = '';
    imagens.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src || DEFAULT_PRODUCT_IMAGE;
        img.alt = `${produto.title} - Imagem ${index + 1}`;
        
        // Fallback caso a URL da miniatura falhe
        img.onerror = () => { 
            img.src = DEFAULT_PRODUCT_IMAGE; 
        };
        
        img.onclick = () => {
            if (typeof trocarImagem === 'function') {
                trocarImagem(src || DEFAULT_PRODUCT_IMAGE);
            } else {
                imagemPrincipal.src = src || DEFAULT_PRODUCT_IMAGE;
            }
        };
        
        miniaturasContainer.appendChild(img);
    });

    // 4. Marca a primeira miniatura como ativa
    const thumbs = miniaturasContainer.querySelectorAll('img');
    if (thumbs[0]) thumbs[0].classList.add('active');

    // 5. Ajusta rolagem se houver muitas miniaturas
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

// ==================== EXPOSIÇÃO GLOBAL ====================
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

    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        reviewsList.addEventListener('scroll', () => {
            // Se rolou mais de 10px para baixo, ativa o modo "scrolled"
            if (reviewsList.scrollTop > 10) {
                reviewsList.classList.add('scrolled');
            } else {
                // Se voltou para o topo, remove
                reviewsList.classList.remove('scrolled');
            }
        });
    }
});

window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY) {
        loadCartFromStorage();
        updateCartUI();
    }
});