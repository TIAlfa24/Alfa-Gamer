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
        subcategory: "gamer",
        price: 3499,
        stock: 50,
        desc: "Desempenho equilibrado para rodar jogos modernos em Full HD. Equipado com RTX 3060 e processador Ryzen 5 para alta fluidez.",
        images: ["images/products/teste.jpg", "images/products/teste 2.jpg", "images/products/teste 3.jpg"],
        specs: { "Processador": "AMD Ryzen 5 5600G", "Placa de Vídeo": "NVIDIA GeForce RTX 3060", "Memória RAM": "16GB DDR4 3200MHz", "Armazenamento": "SSD 512GB NVMe" },
        tags: ["gamer", "desktop", "ryzen", "computador", "RTX 3060", "16GB RAM"]
    },
    {
        id: 2,
        title: "Notebook Gamer 15\"",
        category: "computadores",
        subcategory: "notebooks",
        price: 4899,
        stock: 50,
        desc: "Potência portátil com Intel Core i7 e tela de 144Hz. Ideal para quem busca performance competitiva e mobilidade em um só lugar.",
        images: ["images/products/produto 2.png", "images/products/produto 1.png", "images/products/teste 3.jpg"],
        specs: { "Processador": "Intel Core i7-10750H", "Placa de Vídeo": "NVIDIA GeForce GTX 1660 Ti", "Memória RAM": "16GB DDR4 2933MHz", "Tela": "15.6\" Full HD 144Hz" },
        tags: ["notebook", "gamer", "i7", "GTX 1660 Ti", "laptop", "15 polegadas", "intel",]
    },
    {
        id: 3,
        title: "Mouse Gamer RGB",
        category: "periféricos",
        subcategory: "mouses",
        price: 129,
        stock: 50,
        desc: "Precisão cirúrgica com sensor de 16000 DPI. Design ergonômico com iluminação RGB personalizável e 6 botões programáveis.",
        images: ["images/products/mouse 1.png",],
        specs: { "Sensor": "Óptico 16000 DPI", "Botões": "6 programáveis" },
        tags: ["mouse", "gamer", "RGB", "periférico", "16000 DPI"]
    },
    {
        id: 4,
        title: "Teclado Mecânico",
        category: "periféricos",
        subcategory: "teclados",
        price: 299,
        stock: 5,
        desc: "Feedback tátil superior com switches azuis (clicky). Construção robusta, iluminação traseira e layout ABNT2 brasileiro.",
        images: ["images/products/teclado 1.png",],
        specs: { "Tipo de Switch": "Mecânico Azul", "Layout": "ABNT2" },
        tags: ["teclado", "mecânico", "gamer", "retroiluminado", "ABNT2"]
    },
    {
        id: 5,
        title: "Monitor 24\" Full HD",
        category: "periféricos",
        subcategory: "monitores",
        price: 799,
        stock: 22,
        desc: "Elimine atrasos com taxa de atualização de 144Hz e 1ms de resposta. Imagens nítidas em Full HD para jogos competitivos.",
        images: ["images/products/monitor 24.png",],
        specs: { "Tamanho da Tela": "24 polegadas", "Resolução": "1920 x 1080" },
        tags: ["monitor", "24 polegadas", "full HD", "144Hz", "1ms"]
    },
    {
        id: 6,
        title: "Headset Gamer 7.1",
        category: "periféricos",
        subcategory: "headsets",
        price: 159,
        stock: 0,
        desc: "Imersão total com som Surround 7.1 Virtual. Ouça os passos dos inimigos com clareza e comunique-se sem ruídos externos.",
        images: ["images/products/headset 1.png",],
        specs: { "Áudio": "Som Surround 7.1 Virtual", "Microfone": "Cancelamento de ruído" },
        tags: ["headset", "gamer", "som surround", "microfone", "periférico"]
    },
    {
        id: 7,
        title: "PC Workstation i9",
        category: "computadores",
        subcategory: "office",
        price: 6999,
        stock: 1,
        desc: "Máxima produtividade para renderização e edição. Combina o poder do i9 de 12ª geração com a velocidade da RTX 3080.",
        images: ["images/products/workstation i9.png",],
        specs: { "Processador": "Intel Core i9-12900K", "Placa de Vídeo": "NVIDIA GeForce RTX 3080" },
        tags: ["workstation", "desktop", "i9", "RTX 3080", "32GB RAM", "SSD 1TB", "intel", "office"]
    },
    {
        id: 8,
        title: "Mousepad Gamer XL",
        category: "periféricos",
        subcategory: "mousepads",
        price: 89,
        stock: 100,
        desc: "Espaço de sobra para movimentos amplos (900x400mm). Superfície Speed otimizada para sensores de alta performance.",
        images: ["images/products/mousepad 1.png",],
        specs: { "Tamanho": "Extra Grande (900x400mm )" },
        tags: ["mousepad", "gamer", "XL", "periférico", "extra grande"]
    },
    {
        id: 9,
        title: "Webcam Full HD",
        category: "periféricos",
        subcategory: "webcams",
        price: 249,
        stock: 0,
        desc: "Qualidade profissional para suas lives e reuniões. Transmissão em 1080p a 30FPS com foco automático e clareza de imagem.",
        images: [],
        specs: { "Resolução": "1080p Full HD a 30 FPS" },
        tags: ["webcam", "full HD", "streaming", "periférico"]
    },
    {
        id: 10,
        title: "All-in-One i5 Touch",
        category: "computadores",
        subcategory: "office",
        price: 3999,
        stock: 3,
        desc: "Elegância e funcionalidade. Computador completo integrado à tela Touchscreen de 23.8\", perfeito para escritórios modernos.",
        images: [],
        specs: { "Processador": "Intel Core i5-1135G7", "Tela": "23.8\" Full HD Touchscreen" },
        tags: ["all-in-one", "pc", "i5", "desktop", "23.8 polegadas", "16GB RAM", "SSD 512GB", "office"]
    },
    {
        id: 11,
        title: "Placa RTX 4070 Ti",
        category: "hardware",
        subcategory: "gpu",
        price: 3299,
        stock: 30,
        desc: "Gráficos de última geração com Ray Tracing e DLSS 3.0. Desempenho monstruoso para jogos em 1440p e 4K.",
        images: ["images/products/4070 ti 1.png", "images/products/4070 ti 2.png"],
        specs: { "Memória": "12GB GDDR6X", "Interface": "192-bit" },
        tags: ["placa de vídeo", "gpu", "RTX 4070 Ti", "NVIDIA"]
    },
    {
        id: 12,
        title: "PC Gamer Intel Ultra 5",
        category: "computadores",
        subcategory: "gamer",
        price: 5699,
        stock: 30,
        desc: "A nova era dos processadores Intel Ultra combinada com a RTX 4070 Ti. Prepare-se para o futuro dos games com tecnologias de IA.",
        images: [],
        specs: { "Processador": "Intel Core Ultra 5", "Placa de Vídeo": "NVIDIA GeForce RTX 4070 Ti", "Memória RAM": "16GB DDR5 3200MHz", "Armazenamento": "SSD 512GB NVMe" },
        tags: ["gamer", "desktop", "intel", "computador", "RTX 4070 Ti", "16GB RAM"]
    },
    {
        id: 13,
        title: "PC Gamer Neologic Ryzen 5",
        category: "computadores",
        subcategory: "gamer",
        price: 2547.31,
        stock: 50,
        desc: "O melhor custo-benefício para iniciar no mundo gamer. Roda Valorant, LoL e CS:GO com fluidez graças aos gráficos Vega 7.",
        images: ["https://www.kabum.com.br/produto/297098/pc-gamer-neologic-ryzen-5-5600gt-16gb-ram-radeon-vega-7-integrado-ssd-480gb-m-2-500w-3-fans-rgb-pgnl-1010"],
        specs: { "Processador": "AMD Ryzen 5 5600GT", "Placa de Vídeo": "Radeon Vega 7 Integrado", "Memória RAM": "16GB DDR4", "Armazenamento": "SSD 480GB M.2" },
        tags: ["pc", "gamer", "desktop", "ryzen", "vega 7", "neologic"]
    },
    {
        id: 14,
        title: "Kit PC Gamer Skill Ryzen 7",
        category: "computadores",
        subcategory: "gamer",
        price: 4009.99,
        stock: 50,
        desc: "Solução completa: PC potente com Ryzen 7 e monitor IPS de 27\" de alta qualidade. Desembale e comece a jogar imediatamente.",
        images: ["https://www.kabum.com.br/produto/502570/pc-gamer-completo-skill-ryzen-7-5700g-16gb-radeon-vega-8-ssd-1tb-m-2-monitor-27-ips-100hz-sk27004"],
        specs: { "Processador": "AMD Ryzen 7 5700G", "Placa de Vídeo": "Radeon Vega 8 Integrado", "Memória RAM": "16GB", "Armazenamento": "SSD 1TB M.2", "Monitor": "27\" IPS 100Hz" },
        tags: ["pc", "gamer", "completo", "monitor", "ryzen 7", "vega 8", "skill"]
    },
    {
        id: 15,
        title: "Kit PC Gamer Skill Ryzen 5",
        category: "computadores",
        subcategory: "gamer",
        price: 3149.99,
        stock: 50,
        desc: "Setup Gamer completo com visual RGB impressionante. Inclui monitor LED de 20\", teclado e mouse gamer para sua estação de batalha.",
        images: ["https://www.kabum.com.br/produto/502568/pc-gamer-completo-skill-rgb-amd-ryzen-5-5600g-graficos-radeon-vega-7-monitor-led-20-kit-gamer-sk20003"],
        specs: { "Processador": "AMD Ryzen 5 5600G", "Placa de Vídeo": "Radeon Vega 7 Integrado", "Memória RAM": "16GB", "Armazenamento": "SSD 512GB", "Monitor": "20\" LED" },
        tags: ["pc", "gamer", "completo", "rgb", "ryzen 5", "vega 7", "skill"]
    },
    {
        id: 16,
        title: "PC Neologic Ryzen 5 Completo",
        category: "computadores",
        subcategory: "gamer",
        price: 3452.62,
        stock: 50,
        desc: "Pacote tudo-em-um com a confiabilidade Neologic. Processador Ryzen 5 atualizado, 16GB de RAM e periféricos inclusos.",
        images: ["https://www.kabum.com.br/produto/297098/pc-gamer-neologic-ryzen-5-5600gt-16gb-ram-radeon-vega-7-integrado-ssd-480gb-m-2-500w-3-fans-rgb-pgnl-1010"],
        specs: { "Processador": "AMD Ryzen 5 5600GT", "Placa de Vídeo": "Radeon Vega 7 Integrado", "Memória RAM": "16GB DDR4", "Armazenamento": "SSD 480GB M.2" },
        tags: ["pc", "gamer", "completo", "ryzen", "vega 7", "neologic"]
    },
    {
        id: 17,
        title: "PC Gamer Ludic Ryzen 7",
        category: "computadores",
        subcategory: "gamer",
        price: 5453.85,
        stock: 50,
        desc: "Performance de elite com Ryzen 7 5700X e RTX 3060 de 12GB. Encare qualquer jogo AAA com texturas no máximo e altas taxas de FPS.",
        images: ["https://www.kabum.com.br/produto/502570/pc-gamer-completo-skill-ryzen-7-5700g-16gb-radeon-vega-8-ssd-1tb-m-2-monitor-27-ips-100hz-sk27004"],
        specs: { "Processador": "AMD Ryzen 7 5700X", "Placa de Vídeo": "NVIDIA GeForce RTX 3060 12GB", "Memória RAM": "16GB", "Armazenamento": "SSD 512GB M.2 NVMe" },
        tags: ["pc", "gamer", "desktop", "ryzen 7", "rtx 3060", "bluepc"]
    },
    {
        id: 18,
        title: "Notebook Acer Nitro V15 (Ryzen)",
        category: "computadores",
        subcategory: "notebooks",
        price: 4904.10,
        stock: 50,
        desc: "Aclamada linha Nitro com coração AMD. O Ryzen 7 série HS entrega eficiência energética e potência bruta junto à RTX 4050.",
        images: ["https://www.kabum.com.br/produto/478377/notebook-gamer-acer-nitro-v15-amd-ryzen-7-7735hs-16gb-ram-rtx-4050-ssd-512-gb-tela-15-6-full-hd-linux-64-bits-anv15-41-r2gt"],
        specs: { "Processador": "AMD Ryzen 7-7735HS", "Placa de Vídeo": "NVIDIA GeForce RTX 4050", "Memória RAM": "16GB", "Armazenamento": "SSD 512 GB", "Tela": "15.6\" Full HD" },
        tags: ["notebook", "gamer", "acer", "ryzen 7", "rtx 4050", "laptop"]
    },
    {
        id: 19,
        title: "Notebook ROG Strix G16",
        category: "computadores",
        subcategory: "notebooks",
        price: 15299.15,
        stock: 50,
        desc: "Uma máquina monstruosa. Tela de 240Hz ultra fluida, Core i9 HX de nível desktop e a poderosa RTX 5070. O topo da cadeia alimentar gamer.",
        images: ["https://www.kabum.com.br/produto/502570/notebook-gamer-rog-strix-g16-g615jpr-nvidia-rtx-5070-intel-core-i9-14900hx-32gb-ram-1tb-ssd-windows-11-home-tela-16-240hz-led-cinza-s5001w"],
        specs: { "Processador": "Intel Core i9 14900hx", "Placa de Vídeo": "NVIDIA GeForce RTX 5070", "Memória RAM": "32GB", "Armazenamento": "SSD 1TB", "Tela": "16\" 240hz" },
        tags: ["notebook", "gamer", "asus", "rog strix", "i9", "rtx 5070", "laptop"]
    },
    {
        id: 20,
        title: "Notebook Asus TUF F16 (i7)",
        category: "computadores",
        subcategory: "notebooks",
        price: 8427.16,
        stock: 50,
        desc: "Durabilidade militar e performance avançada. Equipado com RTX 5050 e tela de 16\" 165Hz para vantagem competitiva em jogos de tiro.",
        images: ["https://www.kabum.com.br/produto/502570/notebook-asus-tuf-gaming-f16-fx608jhr-nvidia-rtx-5050-intel-core-i7-14650hx-16gb-ram-512gb-ssd-windows-11-home-tela-16-165hz-nivel-ips-cinza-rv016w"],
        specs: { "Processador": "Intel Core i7 14650hx", "Placa de Vídeo": "NVIDIA GeForce RTX 5050", "Memória RAM": "16GB", "Armazenamento": "SSD 512GB", "Tela": "16\" 165hz" },
        tags: ["notebook", "gamer", "asus", "tuf gaming", "i7", "rtx 5050", "laptop"]
    },
    {
        id: 21,
        title: "Notebook Asus TUF F16 (Core 5)",
        category: "computadores",
        subcategory: "notebooks",
        price: 6401.15,
        stock: 50,
        desc: "Equilíbrio perfeito entre preço e performance. O chassi TUF robusto abriga uma RTX 4050, ideal para jogos modernos em Full HD.",
        images: ["https://www.kabum.com.br/produto/502570/notebook-asus-tuf-gaming-f16-fx607vu-rtx4050-intel-core-5-210h-16gb-ram-512gb-ssd-windows-11-tela-nivel-ips-16-led-144hz-gray-rl053w"],
        specs: { "Processador": "Intel Core 5 210h", "Placa de Vídeo": "NVIDIA GeForce RTX 4050", "Memória RAM": "16GB", "Armazenamento": "SSD 512GB", "Tela": "16\" 144hz" },
        tags: ["notebook", "gamer", "asus", "tuf gaming", "core 5", "rtx 4050", "laptop"]
    },
    {
        id: 22,
        title: "Notebook Acer Nitro V15 (i7)",
        category: "computadores",
        subcategory: "notebooks",
        price: 6499.90,
        stock: 50,
        desc: "Atualização de peso: Processador Intel i7 de 13ª geração entrega mais núcleos e velocidade para seus jogos e renderização de vídeo.",
        images: ["https://www.kabum.com.br/produto/478377/notebook-gamer-acer-nitro-v15-intel-core-i7-13620h-16gb-ram-rtx-4050-ssd-512gb-tela-15-6-full-hd-144hz-anv15-51-79c2"],
        specs: { "Processador": "Intel Core i7-13620H", "Placa de Vídeo": "NVIDIA GeForce RTX 4050", "Memória RAM": "16GB", "Armazenamento": "SSD 512GB", "Tela": "15.6\" Full HD 144Hz" },
        tags: ["notebook", "gamer", "acer", "i7", "rtx 4050", "laptop"]
    },
    {
        id: 23,
        title: "Notebook Acer Nitro V15 (i5)",
        category: "computadores",
        subcategory: "notebooks",
        price: 4399.90,
        stock: 50,
        desc: "O campeão de vendas. Notebook gamer acessível com tela rápida de 144Hz e placa RTX 3050. Perfeito para Fortnite, GTA V e Minecraft.",
        images: ["https://www.kabum.com.br/produto/478377/notebook-gamer-acer-nitro-v15-intel-core-i5-13420h-8gb-ram-rtx-3050-ssd-512gb-tela-15-6-full-hd-144hz-anv15-51-52ag"],
        specs: { "Processador": "Intel Core i5-13420H", "Placa de Vídeo": "NVIDIA GeForce RTX 3050", "Memória RAM": "8GB", "Armazenamento": "SSD 512GB", "Tela": "15.6\" Full HD 144Hz" },
        tags: ["notebook", "gamer", "acer", "i5", "rtx 3050", "laptop", "custo-benefício"]
    },
    {
        id: 24,
        title: "Notebook Dell G15 5530",
        category: "computadores",
        subcategory: "notebooks",
        price: 8999.00,
        stock: 50,
        desc: "Engenharia térmica avançada e design industrial. O Dell G15 com RTX 4060 e i7 HX é feito para sessões intensas de jogatina sem superaquecer.",
        images: ["https://www.dell.com/pt-br/shop/notebook-gamer-dell-g15-5530/pd/cag15w1102brw"],
        specs: { "Processador": "Intel Core i7-13650HX", "Placa de Vídeo": "NVIDIA GeForce RTX 4060", "Memória RAM": "16GB DDR5", "Armazenamento": "SSD 1TB", "Tela": "15.6\" Full HD 165Hz" },
        tags: ["notebook", "gamer", "dell", "i7", "rtx 4060", "laptop", "g15"]
    },
    {
        id: 25,
        title: "Notebook Lenovo Legion 5i",
        category: "computadores",
        subcategory: "notebooks",
        price: 14999.00,
        stock: 50,
        desc: "Acabamento premium e performance silenciosa. Tela WQXGA (acima de Full HD) de 240Hz oferece cores vibrantes e precisão incrível.",
        images: ["https://www.lenovo.com/br/pt/laptops/legion/legion-5-series/legion-5i-gen-8-16-inch-intel/p/len101g0025"],
        specs: { "Processador": "Intel Core i9-13900HX", "Placa de Vídeo": "NVIDIA GeForce RTX 4070", "Memória RAM": "32GB DDR5", "Armazenamento": "SSD 1TB", "Tela": "16\" WQXGA 240Hz" },
        tags: ["notebook", "gamer", "lenovo", "i9", "rtx 4070", "laptop", "legion"]
    },
    {
        id: 26,
        title: "Notebook ROG Zephyrus G14",
        category: "computadores",
        subcategory: "notebooks",
        price: 11999.00,
        stock: 50,
        desc: "Poderoso, fino e leve. Com tela de 14 polegadas QHD+, é a escolha definitiva para criadores de conteúdo e gamers nômades.",
        images: ["https://www.asus.com/br/laptops/for-gaming/rog-zephyrus/rog-zephyrus-g14-2023/"],
        specs: { "Processador": "AMD Ryzen 9 7940HS", "Placa de Vídeo": "NVIDIA GeForce RTX 4060", "Memória RAM": "16GB", "Armazenamento": "SSD 1TB", "Tela": "14\" QHD+ 165Hz" },
        tags: ["notebook", "gamer", "asus", "ryzen 9", "rtx 4060", "laptop", "zephyrus", "portátil"]
    },
    {
        id: 27,
        title: "Notebook HP Victus 15",
        category: "computadores",
        subcategory: "notebooks",
        price: 5499.00,
        stock: 50,
        desc: "Design sofisticado que vai do trabalho ao jogo. O HP Victus entrega confiabilidade com RTX 3050 e tela de alta taxa de atualização.",
        images: ["https://www.hp.com/br-pt/products/laptops/victus-15.html"],
        specs: { "Processador": "Intel Core i5-12500H", "Placa de Vídeo": "NVIDIA GeForce RTX 3050", "Memória RAM": "8GB", "Armazenamento": "SSD 512GB", "Tela": "15.6\" Full HD 144Hz" },
        tags: ["notebook", "gamer", "hp", "i5", "rtx 3050", "laptop", "victus"]
    },
    {
        id: 28,
        title: "All-in-One Dell Inspiron 24",
        category: "computadores",
        subcategory: "all-in-one",
        price: 4999.00,
        stock: 50,
        desc: "Organize seu espaço com um PC tudo-em-um. Tela IPS Full HD vibrante e desempenho rápido para multitarefas de escritório e home office.",
        images: ["https://www.kabum.com.br/produto/478377/all-in-one-dell-24-ec24250-23-8-ips-full-hd-13-gen-intel-core-i5-8gb-512gb-ssd-win-11-aio-i1303-m10"],
        specs: { "Processador": "Intel Core i5 13ª Gen", "Memória RAM": "8GB", "Armazenamento": "SSD 512GB", "Tela": "23.8\" Full HD IPS" },
        tags: ["all-in-one", "dell", "i5", "office", "desktop"]
    },
    {
        id: 29,
        title: "All-in-One Grasep 21.5\"",
        category: "computadores",
        subcategory: "all-in-one",
        price: 1528.20,
        stock: 50,
        desc: "Solução econômica e compacta para estudos e navegação. Elimine os fios da mesa com este computador integrado de 21.5 polegadas.",
        images: ["https://www.kabum.com.br/produto/478377/computador-all-in-one-21-5-led-full-hd-intel-core-i5-4300u-8gb-ram-ssd-512gb-hdmi-vga-wifi-bluetooth-grasep-d-aio4"],
        specs: { "Processador": "Intel Core i5-4300u", "Memória RAM": "8GB", "Armazenamento": "SSD 512GB", "Tela": "21.5\" Full HD LED" },
        tags: ["all-in-one", "i5", "office", "desktop", "custo-benefício"]
    },
    {
        id: 30,
        title: "All-in-One Branco 24\"",
        category: "computadores",
        subcategory: "all-in-one",
        price: 2439.00,
        stock: 50,
        desc: "Design clean na cor branca que valoriza o ambiente. Ótima performance com 16GB de RAM, garantindo que nenhum programa trave.",
        images: ["https://www.kabum.com.br/produto/478377/all-in-one-branco-i5-16gb-ram-ssd-256gb-tela-24-wifi-webcam"],
        specs: { "Processador": "Intel Core i5 (não especificado)", "Memória RAM": "16GB", "Armazenamento": "SSD 256GB", "Tela": "24\"" },
        tags: ["all-in-one", "i5", "office", "desktop", "branco"]
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
            value: "acessórios",
            label: "Acessórios",
            keywords: ["cabo", "adaptador", "suporte", "fonte notebook", "hub usb"],
            subcategories: [
                { value: "cabos", label: "Cabos", keywords: ["cabo"] },
                { value: "adaptadores", label: "Adaptadores", keywords: ["adaptador"] },
                { value: "suportes", label: "Suportes", keywords: ["suporte"] },
                { value: "fontes-notebook", label: "Fontes para Notebook", keywords: ["fonte notebook"] },
                { value: "hubs-usb", label: "Hubs USB", keywords: ["hub usb"] },
            ]
        },
        {
            value: "periféricos",
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
                { value: "gpu", label: "Placas de Vídeo", keywords: ["placa de vídeo", "gpu"] },
                { value: "cpu", label: "Processadores", keywords: ["processador", "cpu"] },
                { value: "motherboard", label: "Placas-mãe", keywords: ["placa mãe"] },
                { value: "mram", label: "Memórias RAM", keywords: ["memória ram"] },
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
