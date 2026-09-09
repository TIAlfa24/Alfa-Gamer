const WHATSAPP_PHONE = '5531983753432';

window.comprarNoWhatsApp = function comprarNoWhatsApp() {
    const qtyInput = document.getElementById('qty');
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = PRODUCTS.find(p => String(p.id) === String(productId));

    if (!product) return;

    const total = money(product.price * qty);

    let specsText = '';
    if (product.specs && Object.keys(product.specs).length > 0) {
        specsText = '\n\n*Especificações:*';
        Object.entries(product.specs).forEach(([chave, valor]) => {
            specsText += `\n• *${chave}:* ${valor}`;
        });
    }
    const mensagem = `Olá! Gostaria de comprar o seguinte produto:

*Produto:* ${product.title}
*Quantidade:* ${qty}
*Preço Total:* ${total}${specsText}

Ainda está disponível?`;
    const encodedMessage = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
};

async function inicializarPaginaProduto() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    const productId = parseInt(rawId, 10);

    if (!rawId || isNaN(productId)) {
        document.querySelector('.product-container').innerHTML =
            '<p class="produto-indisponivel">ID do produto inválido ou ausente.</p>';
        return;
    }

    let product = null;
    try {
        const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        
        if (client) {
            const { data, error } = await client
                .from('produtos')
                .select('*')
                .eq('id', productId)
                .single();

            if (!error && data) {
                product = data;
            }
        }
    } catch (err) {
        console.warn('Falha na consulta direta, acionando fallback:', err);
    }
    if (!product && typeof window.carregarProdutosSupabase === 'function') {
        try {
            const produtos = await window.carregarProdutosSupabase();
            product = (produtos || []).find(p => String(p.id) === String(productId));
        } catch (err) {
            console.error('Erro no fallback do banco:', err);
        }
    }

    if (!product) {
        document.querySelector('.product-container').innerHTML =
            '<p class="produto-indisponivel">Produto não encontrado.</p>';
        return;
    }
    if (!window.PRODUCTS) window.PRODUCTS = [];
    if (!window.PRODUCTS.some(p => String(p.id) === String(product.id))) {
        window.PRODUCTS.push(product);
    }
    const oldPrice = product.price * 1.15;
    document.getElementById('productOldPrice').textContent = money(oldPrice);
    document.getElementById('productName').textContent = product.title;
    document.getElementById('productTitle').textContent = product.title;
    const catLink = document.getElementById('categoryLink');
    const subCatLink = document.getElementById('subcategoryLink');
    catLink.textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    subCatLink.textContent = product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1);
    catLink.href = `/?cat=${encodeURIComponent(product.category)}`;
    subCatLink.href = `/?cat=${encodeURIComponent(product.category)}&subcat=${encodeURIComponent(product.subcategory)}`;
    document.getElementById('productPrice').textContent = money(product.price);
    document.getElementById('productOldPriceMobile').textContent = money(oldPrice);
    document.getElementById('productInstallments').textContent = `em até 12x de ${money(product.price / 12)} sem juros`;
    document.getElementById('productDescription').textContent = product.desc_text || product.desc;
    carregarImagensProduto(product.id);
    if (typeof loadReviews === 'function') {
        loadReviews(product.id);
    }

    const stockStatusEl = document.getElementById('stockStatus');
    const btnComprarPrincipal = document.querySelector('.btn-comprar.principal');
    const btnComprarSecundario = document.querySelector('.btn-comprar.secundario');
    const qtyInput = document.getElementById('qty');
    const quantidadeContainer = document.querySelector('.quantidade');
    const freteContainer = document.querySelector('.frete-simulador');
    const acoesContainer = document.querySelector('.acoes');

    if (btnComprarSecundario) {
        btnComprarSecundario.onclick = window.comprarNoWhatsApp;
    }

    if (product.stock > 0) {
        stockStatusEl.textContent = 'Em Estoque';
        stockStatusEl.classList.add('em-estoque');
        stockStatusEl.classList.remove('esgotado');
        qtyInput.max = product.stock;
    } else {
        stockStatusEl.textContent = 'Esgotado';
        stockStatusEl.classList.add('esgotado');
        stockStatusEl.classList.remove('em-estoque');
        btnComprarPrincipal.style.display = 'none';
        btnComprarSecundario.style.display = 'none';
        quantidadeContainer.style.display = 'none';
        freteContainer.style.display = 'none';
        const btnEsgotado = document.createElement('button');
        btnEsgotado.className = 'btn-comprar esgotado';
        btnEsgotado.textContent = '🔒 Esgotado';
        btnEsgotado.disabled = true;
        acoesContainer.appendChild(btnEsgotado);
    }

    const specsTable = document.getElementById('specsTable');
    if (product.specs) {
        Object.entries(product.specs).forEach(([key, value]) => {
            const row = specsTable.insertRow();
            row.insertCell(0).textContent = key;
            row.insertCell(1).textContent = value;
        });
    }

    window.adjustQty = function adjustQty(delta) {
        const input = document.getElementById('qty');
        const maxQty = parseInt(input.max) || 99;
        const newValue = Math.max(1, Math.min(maxQty, parseInt(input.value) + delta));
        input.value = newValue;
    }

    const qtyInputField = document.getElementById('qty');
    qtyInputField.addEventListener('input', () => {
        const max = parseInt(qtyInputField.max) || 99;
        const val = parseInt(qtyInputField.value);
        if (val > max) {
            qtyInputField.value = max;
            showLimitNotification();
        } else if (val < 1) {
            qtyInputField.value = 1;
        }
    });

    window.addToCartAndNavigate = function addToCartAndNavigate() {
        const qty = parseInt(document.getElementById('qty').value);
        addToCart(product.id, qty);
    }

    window.trocarImagem = function trocarImagem(src) {
        document.getElementById('mainImage').src = src;
    }

    document.addEventListener('DOMContentLoaded', function () {
        const buttons = document.querySelectorAll('.tabs .tab-btn');
        const underline = document.querySelector('.tabs .underline');
        const contents = document.querySelectorAll('.tab-content');

        function moveUnderline(target) {
            const tabsRect = target.parentElement.getBoundingClientRect();
            const btnRect = target.getBoundingClientRect();
            const left = btnRect.left - tabsRect.left + target.offsetWidth * 0.1;
            const width = btnRect.width * 0.8;
            underline.style.width = `${width}px`;
            underline.style.transform = `translateX(${left}px)`;
        }

        const activeBtn = document.querySelector('.tabs .tab-btn.active');
        if (activeBtn) {
            moveUnderline(activeBtn);
        }

        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                if (index === 0) {
                    document.getElementById('descricao').classList.add('active');
                } else {
                    document.getElementById('especificacoes').classList.add('active');
                }
                moveUnderline(btn);
            });
        });
    });
}

inicializarPaginaProduto();