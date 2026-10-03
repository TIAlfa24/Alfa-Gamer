// ==========================================
// FUNÇÃO DE SANITIZAÇÃO DE HTML PARA A DESCRIÇÃO
// ==========================================
function sanitizarHTMLDescricao(htmlTexto) {
    if (!htmlTexto) return '';

    const temHTML = /<[a-z][\s\S]*>/i.test(htmlTexto);
    let conteudoParaProcessar = htmlTexto;
    
    if (!temHTML) {
        conteudoParaProcessar = htmlTexto
            .split(/\r?\n\r?\n/)
            .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
            .join('');
    }

    const doc = new DOMParser().parseFromString(conteudoParaProcessar, 'text/html');

    const allowedTags = [
        'STRONG', 'B', 'EM', 'I', 'BR', 'P', 'UL', 'OL', 'LI', 
        'H1', 'H2', 'H3', 'H4', 'SPAN', 'A', 'TABLE', 'THEAD', 
        'TBODY', 'TR', 'TH', 'TD', 'BLOCKQUOTE'
    ];

    const elementos = doc.body.querySelectorAll('*');
    elementos.forEach(el => {
        if (!allowedTags.includes(el.tagName)) {
            el.replaceWith(...el.childNodes);
        } else {
            Array.from(el.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value.toLowerCase();

                if (name.startsWith('on') || value.includes('javascript:')) {
                    el.removeAttribute(attr.name);
                } else if (el.tagName !== 'A' && name !== 'style') {
                    el.removeAttribute(attr.name);
                }
            });

            if (el.tagName === 'A') {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
        }
    });

    return doc.body.innerHTML;
}

// ==========================================
// LÓGICA DO BOTÃO VER MAIS / VER MENOS
// ==========================================
function configurarDescricaoExpandivel() {
    const descElement = document.getElementById('productDescription');
    if (!descElement) return;

    const btnAntigo = descElement.parentElement.querySelector('.btn-ver-mais-container');
    if (btnAntigo) btnAntigo.remove();

    descElement.classList.remove('expandable', 'expanded');
    const ALTURA_LIMITE = 260;

    setTimeout(() => {
        if (descElement.scrollHeight > ALTURA_LIMITE + 30) {
            descElement.classList.add('expandable');

            const btnContainer = document.createElement('div');
            btnContainer.className = 'btn-ver-mais-container';
            btnContainer.innerHTML = `
                <button type="button" class="btn-ver-mais" id="btnToggleDescricao">
                    <span class="btn-text">ver mais</span>
                </button>
            `;

            descElement.after(btnContainer);

            const btn = btnContainer.querySelector('#btnToggleDescricao');
            const btnText = btn.querySelector('.btn-text');

            btn.addEventListener('click', () => {
                const estaExpandido = descElement.classList.toggle('expanded');

                if (estaExpandido) {
                    btnText.textContent = 'ver menos';
                } else {
                    btnText.textContent = 'ver mais';
                    descElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    }, 150);
}

function renderizarDistribuicaoAvaliacoes() {
    const chart = document.getElementById('ratingDistributionChart');
    const legend = document.getElementById('ratingDistributionLegend');
    const title = document.getElementById('ratingChartTitle');
    const description = document.getElementById('ratingChartDescription');
    if (!chart || !legend || !title || !description) return;

    const data = [
        { stars: 5, value: 12, color: '#00926b' },
        { stars: 4, value: 8, color: '#00bd84' },
        { stars: 3, value: 0, color: '#f1c40f' },
        { stars: 2, value: 0, color: '#e67e22' },
        { stars: 1, value: 0, color: '#e74c3c' }
    ];
    const centerX = 200;
    const centerY = 200;
    const outerRadius = 175;
    const innerRadius = 75;
    const totalSegments = 10;
    const totalReviews = data.reduce((sum, item) => sum + item.value, 0);
    const average = totalReviews > 0
        ? data.reduce((sum, item) => sum + item.stars * item.value, 0) / totalReviews
        : 0;

    const starPoints = Array.from({ length: totalSegments }, (_, index) => {
        const angle = (Math.PI * 2 * index) / totalSegments - Math.PI / 2;
        const radius = index % 2 === 0 ? outerRadius : outerRadius * 0.45;
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    });

    chart.replaceChildren(title, description);
    legend.replaceChildren();
    description.textContent = `${totalReviews} avaliações. Média de ${average.toFixed(1).replace('.', ',')} estrelas.`;

    data.forEach((item, index) => {
        const previousValley = (index * 2 - 1 + totalSegments) % totalSegments;
        const tip = (index * 2) % totalSegments;
        const nextValley = (index * 2 + 1) % totalSegments;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const [firstPoint, tipPoint, lastPoint] = [
            starPoints[previousValley],
            starPoints[tip],
            starPoints[nextValley]
        ];

        path.setAttribute(
            'd',
            `M ${centerX} ${centerY} L ${firstPoint.x} ${firstPoint.y} L ${tipPoint.x} ${tipPoint.y} L ${lastPoint.x} ${lastPoint.y} Z`
        );
        path.classList.add('slice');
        if (item.value > 0) {
            path.classList.add('has-reviews');
            path.style.setProperty('--slice-color', item.color);
        }
        path.setAttribute('aria-label', `${item.stars} estrelas: ${item.value} avaliações`);
        chart.appendChild(path);

        const legendItem = document.createElement('div');
        legendItem.className = 'rating-distribution-legend-item';
        const label = document.createElement('div');
        label.className = 'rating-distribution-legend-label';
        const color = document.createElement('span');
        color.className = 'rating-distribution-legend-color';
        color.style.backgroundColor = item.value > 0 ? item.color : '#303030';
        const stars = document.createElement('span');
        stars.textContent = `${item.stars} ${item.stars === 1 ? 'estrela' : 'estrelas'}`;
        const count = document.createElement('span');
        count.className = 'rating-distribution-legend-count';
        count.textContent = `${item.value} avaliações`;

        label.append(color, stars);
        legendItem.append(label, count);
        legend.appendChild(legendItem);
    });

    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    outline.setAttribute('points', starPoints.map(point => `${point.x},${point.y}`).join(' '));
    outline.classList.add('star-outline');
    chart.appendChild(outline);

    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', String(centerX));
    center.setAttribute('cy', String(centerY));
    center.setAttribute('r', String(innerRadius));
    center.classList.add('chart-center');
    chart.appendChild(center);

    const averageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    averageText.setAttribute('x', String(centerX));
    averageText.setAttribute('y', String(centerY - 8));
    averageText.setAttribute('text-anchor', 'middle');
    averageText.classList.add('chart-average');
    averageText.textContent = totalReviews > 0 ? average.toFixed(1).replace('.', ',') : '—';
    chart.appendChild(averageText);

    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', String(centerX));
    totalText.setAttribute('y', String(centerY + 20));
    totalText.setAttribute('text-anchor', 'middle');
    totalText.classList.add('chart-total');
    totalText.textContent = `${totalReviews} avaliações`;
    chart.appendChild(totalText);
}

function exibirEstadoProduto(mensagem, permitirNovaTentativa = false) {
    const main = document.querySelector('.product-container');
    const grid = document.getElementById('productGrid');
    const skeleton = document.getElementById('productSkeleton');
    const status = document.getElementById('productLoadStatus');
    if (!main || !status) return;

    main.setAttribute('aria-busy', 'false');
    if (grid) grid.hidden = true;
    if (skeleton) skeleton.hidden = true;
    status.hidden = false;
    status.replaceChildren();

    const message = document.createElement('p');
    message.textContent = mensagem;
    status.appendChild(message);

    if (permitirNovaTentativa) {
        const retryButton = document.createElement('button');
        retryButton.type = 'button';
        retryButton.className = 'btn-comprar principal';
        retryButton.textContent = 'Tentar novamente';
        retryButton.addEventListener('click', inicializarPaginaProduto);
        status.appendChild(retryButton);
    }

    const catalogLink = document.createElement('a');
    catalogLink.href = '/';
    catalogLink.textContent = 'Voltar aos produtos';
    status.appendChild(catalogLink);
}

// ==========================================
// COMPRA VIA WHATSAPP (BOTÃO COMPRAR AGORA)
// ==========================================
const WHATSAPP_PHONE = '5531983753432';

window.comprarNoWhatsApp = function comprarNoWhatsApp() {
    const qtyInput = document.getElementById('qty');
    const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;

    const product = window.currentProduct || (window.PRODUCTS || []).find(p => String(p.id) === String(new URLSearchParams(window.location.search).get('id')));

    if (!product) {
        alert('⚠️ Não foi possível carregar os dados deste produto. Recarregue a página.');
        return;
    }

    // 🚀 REGISTRA 1 COTAÇÃO PARA ESTE PRODUTO
    if (typeof registrarCotacaoAnalytics === 'function') {
        registrarCotacaoAnalytics([product.id]);
    }

    const total = money(product.price * qty);

    let specsText = '';
    if (product.specs && Object.keys(product.specs).length > 0) {
        specsText = '\n\n*Especificações:*';
        Object.entries(product.specs).forEach(([chave, valor]) => {
            specsText += `\n• *${chave}:* ${valor}`;
        });
    }

    const mensagem = `Olá! Gostaria de consultar a disponibilidade e as condições deste produto:

*Produto:* ${product.title}
*Quantidade:* ${qty}
*Preço Total:* ${total}${specsText}

Ainda está disponível?`;

    const encodedMessage = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
};

// ==========================================
// CONTROLE DE ABAS (DESCRIÇÃO / ESPECIFICAÇÕES)
// ==========================================
function inicializarAbas() {
    const buttons = document.querySelectorAll('.tabs .tab-btn');
    const underline = document.querySelector('.tabs .underline');

    if (!buttons.length) return;

    function moveUnderline(target) {
        if (!underline || !target.parentElement) return;
        const tabsRect = target.parentElement.getBoundingClientRect();
        const btnRect = target.getBoundingClientRect();
        const left = btnRect.left - tabsRect.left + target.offsetWidth * 0.1;
        const width = btnRect.width * 0.8;
        underline.style.width = `${width}px`;
        underline.style.transform = `translateX(${left}px)`;
    }

    const activateTab = (target, moveFocus = false) => {
        buttons.forEach(button => {
            const isActive = button === target;
            const panel = document.getElementById(button.getAttribute('aria-controls'));
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
            button.tabIndex = isActive ? 0 : -1;
            if (panel) {
                panel.hidden = !isActive;
                panel.classList.toggle('active', isActive);
            }
        });
        if (moveFocus) target.focus();
        moveUnderline(target);
    };

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => activateTab(button));
        button.addEventListener('keydown', event => {
            let nextIndex = index;
            if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
            else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = buttons.length - 1;
            else return;
            event.preventDefault();
            activateTab(buttons[nextIndex], true);
        });
    });

    const activeBtn = document.querySelector('.tabs .tab-btn[aria-selected="true"]') || buttons[0];
    activateTab(activeBtn);
}

// ==========================================
// INICIALIZAÇÃO PRINCIPAL DO PRODUTO
// ==========================================
async function inicializarPaginaProduto() {
    const main = document.querySelector('.product-container');
    const grid = document.getElementById('productGrid');
    const skeleton = document.getElementById('productSkeleton');
    const loadStatus = document.getElementById('productLoadStatus');
    if (main) main.setAttribute('aria-busy', 'true');
    if (grid) grid.hidden = true;
    if (skeleton) skeleton.hidden = false;
    if (loadStatus) loadStatus.hidden = true;

    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    const productId = parseInt(rawId, 10);

    if (!rawId || isNaN(productId)) {
        exibirEstadoProduto('Não foi possível identificar este produto.');
        return;
    }

    let product = null;
    let fallbackFalhou = false;

    try {
        const produtos = await window.carregarProdutosSupabase();
        product = (produtos || []).find(p => String(p.id) === String(productId));
    } catch (err) {
        console.error('Erro ao carregar produtos do banco:', err);
        fallbackFalhou = true;
    }

    if (!product) {
        exibirEstadoProduto(
            fallbackFalhou ? 'Não foi possível carregar o produto. Verifique sua conexão e tente novamente.' : 'Não encontramos este produto.',
            fallbackFalhou
        );
        return;
    }

    window.currentProduct = product;

    if (!window.PRODUCTS) window.PRODUCTS = [];
    if (!window.PRODUCTS.some(p => String(p.id) === String(product.id))) {
        window.PRODUCTS.push(product);
    }

    if (document.getElementById('productName')) document.getElementById('productName').textContent = product.title;
    if (document.getElementById('productTitle')) document.getElementById('productTitle').textContent = product.title;
    document.title = `${product.title} | Alfa Gamer`;

    const categoryValues = String(product.category || '').split(',').map(value => value.trim()).filter(Boolean);
    const subcategoryValues = String(product.subcategory || '').split(',').map(value => value.trim()).filter(Boolean);
    const categoryLabel = document.getElementById('productCategories');
    if (categoryLabel) {
        categoryLabel.replaceChildren();
        [...categoryValues, ...subcategoryValues].forEach(value => {
            const tag = document.createElement('span');
            tag.textContent = value;
            categoryLabel.appendChild(tag);
        });
    }

    const catLink = document.getElementById('categoryLink');
    const subCatLink = document.getElementById('subcategoryLink');
    const categorySeparator = document.getElementById('categorySeparator');
    const subcategorySeparator = document.getElementById('subcategorySeparator');
    if (catLink && categoryValues.length) {
        catLink.textContent = categoryValues[0];
        catLink.href = `/?cat=${encodeURIComponent(categoryValues[0])}`;
    } else if (catLink) {
        catLink.hidden = true;
        if (categorySeparator) categorySeparator.hidden = true;
        if (subcategorySeparator) subcategorySeparator.hidden = true;
        if (subCatLink) subCatLink.hidden = true;
    }
    if (subCatLink && subcategoryValues.length) {
        subCatLink.textContent = subcategoryValues[0];
        subCatLink.href = `/?cat=${encodeURIComponent(categoryValues[0] || '')}&subcat=${encodeURIComponent(subcategoryValues[0])}`;
    } else if (subCatLink) {
        subCatLink.hidden = true;
        if (subcategorySeparator) subcategorySeparator.hidden = true;
    }

    const pixPrice = Number(product.price) || 0;
    const pixDiscount = Number(product.pix_discount ?? 15);
    const originalPrice = pixDiscount > 0 && pixDiscount < 100 ? pixPrice / (1 - pixDiscount / 100) : pixPrice;
    if (document.getElementById('productPrice')) document.getElementById('productPrice').textContent = money(pixPrice);
    if (document.getElementById('productOldPrice')) {
        document.getElementById('productOldPrice').textContent = money(originalPrice);
        document.getElementById('productOldPrice').parentElement.hidden = pixDiscount <= 0;
    }
    const discountTag = document.querySelector('.preco-container .discount-tag');
    if (discountTag) discountTag.textContent = `${pixDiscount}% OFF no PIX`;

    const descElement = document.getElementById('productDescription');
    if (descElement) {
        const rawDesc = product.desc_text || product.desc || '';
        descElement.innerHTML = sanitizarHTMLDescricao(rawDesc) || '<p>Não há descrição adicional para este produto.</p>';
        configurarDescricaoExpandivel();
    }

    if (typeof carregarImagensProduto === 'function') {
        await carregarImagensProduto(product.id);
    }
    const stockStatusEl = document.getElementById('stockStatus');
    const btnComprarPrincipal = document.querySelector('.btn-comprar.principal');
    const btnComprarSecundario = document.querySelector('.btn-comprar.secundario');
    const qtyInput = document.getElementById('qty');
    const quantidadeContainer = document.querySelector('.quantidade');
    const freteContainer = document.querySelector('.frete-simulador');
    const stockStatusContainer = document.querySelector('.estoque-status');
    const purchaseRow = document.querySelector('.purchase-row');
    const priceContainer = document.querySelector('.preco-container');

    if (btnComprarSecundario) {
        btnComprarSecundario.onclick = window.comprarNoWhatsApp;
    }

    if (stockStatusEl) {
        if (product.stock > 0) {
            if (stockStatusContainer) stockStatusContainer.hidden = false;
            if (btnComprarSecundario) btnComprarSecundario.hidden = false;
            purchaseRow?.classList.remove('is-out-of-stock');
            priceContainer?.classList.remove('is-out-of-stock');
            stockStatusEl.textContent = 'Em Estoque';
            stockStatusEl.classList.add('em-estoque');
            stockStatusEl.classList.remove('esgotado');
            if (qtyInput) qtyInput.max = Math.min(Number(product.stock), 3);
        } else {
            if (stockStatusContainer) stockStatusContainer.hidden = false;
            if (btnComprarSecundario) btnComprarSecundario.hidden = true;
            purchaseRow?.classList.add('is-out-of-stock');
            priceContainer?.classList.add('is-out-of-stock');
            stockStatusEl.textContent = 'Sem Estoque';
            stockStatusEl.classList.add('esgotado');
            stockStatusEl.classList.remove('em-estoque');
            if (btnComprarPrincipal) {
                btnComprarPrincipal.disabled = true;
                btnComprarPrincipal.textContent = 'Esgotado';
            }
            if (quantidadeContainer) quantidadeContainer.hidden = true;
            if (freteContainer) freteContainer.style.display = 'none';
        }
    }

    const specsTable = document.getElementById('specsTable');
    const specsBody = specsTable?.querySelector('tbody');
    const specs = Object.entries(product.specs || {}).filter(([key, value]) => key && value !== null && value !== '');
    if (specsBody) {
        specsBody.replaceChildren();
        specs.forEach(([key, value]) => {
            const row = document.createElement('tr');
            const label = document.createElement('th');
            const detail = document.createElement('td');
            label.scope = 'row';
            label.textContent = key;
            detail.textContent = String(value);
            row.append(label, detail);
            specsBody.appendChild(row);
        });
    }
    const specsEmpty = document.getElementById('specsEmpty');
    if (specsEmpty) specsEmpty.hidden = specs.length > 0;
    if (specsTable) specsTable.hidden = specs.length === 0;

    if (grid) grid.hidden = false;
    if (skeleton) skeleton.hidden = true;
    if (loadStatus) loadStatus.hidden = true;
    if (main) main.setAttribute('aria-busy', 'false');

    window.adjustQty = function adjustQty(delta) {
        const input = document.getElementById('qty');
        if (!input) return;
        const maxQty = parseInt(input.max, 10) || 99;
        const newValue = Math.max(1, Math.min(maxQty, (parseInt(input.value, 10) || 1) + delta));
        input.value = newValue;
    };

    const qtyInputField = document.getElementById('qty');
    if (qtyInputField) {
        qtyInputField.addEventListener('input', () => {
            const max = parseInt(qtyInputField.max, 10) || 99;
            const val = parseInt(qtyInputField.value, 10);
            if (!Number.isFinite(val) || val < 1 || val > max) {
                qtyInputField.value = Math.max(1, Math.min(max, Number.isFinite(val) ? val : 1));
            }
            if (val > max) {
                if (typeof showLimitNotification === 'function') showLimitNotification();
            }
        });
    }

    window.addToCartFromProduct = function addToCartFromProduct() {
        const qty = parseInt(document.getElementById('qty')?.value, 10) || 1;
        if (product.stock <= 0 || typeof addToCart !== 'function') return;
        const previousQty = Number(window.globalState?.cart?.[product.id]) || 0;
        addToCart(product.id, qty);
        const currentQty = Number(window.globalState?.cart?.[product.id]) || 0;
        if (currentQty > previousQty) window.setCartOpen?.(true);
    };

    window.trocarImagem = function trocarImagem(src) {
        const mainImg = document.getElementById('mainImage');
        if (mainImg) mainImg.src = src;
    };

    inicializarAbas();
}

renderizarDistribuicaoAvaliacoes();
inicializarPaginaProduto();