const WHATSAPP_PHONE = '5531983753432';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof loadCartFromStorage === 'function') {
        loadCartFromStorage();
    }

    if (!window.PRODUCTS || window.PRODUCTS.length === 0) {
        try {
            await carregarProdutosSupabase();
        } catch (err) {
            console.error('Erro ao carregar produtos para checkout:', err);
        }
    }

    await renderCheckout();
});

let checkoutRenderId = 0;

function updateCheckoutItemsScrollLimit() {
    const list = document.querySelector('.checkout-items-list');
    if (!list) return;

    const items = list.querySelectorAll('.cart-item');
    if (items.length <= 4) {
        list.classList.remove('is-scrollable');
        list.style.removeProperty('--checkout-items-scroll-limit');
        list.removeAttribute('tabindex');
        list.removeAttribute('role');
        list.removeAttribute('aria-label');
        return;
    }

    list.classList.add('is-scrollable');
    list.setAttribute('tabindex', '0');
    list.setAttribute('role', 'region');
    list.setAttribute('aria-label', 'Itens do carrinho');

    const fourthItem = items[3];
    const listTop = list.getBoundingClientRect().top;
    const bottomMargin = Number.parseFloat(getComputedStyle(fourthItem).marginBottom) || 0;
    const visibleHeight = Math.ceil(fourthItem.getBoundingClientRect().bottom - listTop + bottomMargin);

    list.style.setProperty('--checkout-items-scroll-limit', `${visibleHeight}px`);
}

window.addEventListener('resize', () => {
    window.requestAnimationFrame(updateCheckoutItemsScrollLimit);
});

function preloadCartImage(src) {
    const fallback = typeof DEFAULT_PRODUCT_IMAGE !== 'undefined'
        ? DEFAULT_PRODUCT_IMAGE
        : '/images/products/placeholder.png';

    return new Promise(resolve => {
        const image = new Image();
        let currentSrc = src || fallback;
        const fallbackUrl = new URL(fallback, document.baseURI).href;
        const finish = loadedSrc => resolve(loadedSrc);

        image.onload = () => finish(currentSrc);
        image.onerror = () => {
            if (image.src !== fallbackUrl) {
                currentSrc = fallback;
                image.src = fallback;
            } else {
                finish(fallback);
            }
        };
        image.src = currentSrc;
        if (image.complete && image.naturalWidth > 0) finish(currentSrc);
    });
}

async function renderCheckout() {
    const container = document.getElementById('checkoutCartItems');
    if (!container) return;

    const renderId = ++checkoutRenderId;
    container.setAttribute('aria-busy', 'true');
    const cart = window.globalState ? window.globalState.cart : {};
    const cartKeys = Object.keys(cart);
    if (cartKeys.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <h3>Seu carrinho está vazio</h3>
                <p style="color: var(--muted); margin-top: 8px;">Adicione produtos à sua sacola para continuar.</p>
                <a href="/" class="btn-comprar secundario" style="display: inline-block; margin-top: 16px; text-decoration: none; padding: 10px 20px;">Ir para a Loja</a>
            </div>
        `;
        updateSummary(0, 0, 0);
        container.setAttribute('aria-busy', 'false');
        return;
    }

    const products = cartKeys
        .map(id => (window.PRODUCTS || []).find(product => String(product.id) === String(id)))
        .filter(Boolean);
    const imageEntries = await Promise.all(products.map(async product => {
        const source = product.images && product.images.length > 0 && product.images[0]
            ? product.images[0]
            : (typeof DEFAULT_PRODUCT_IMAGE !== 'undefined' ? DEFAULT_PRODUCT_IMAGE : '/images/products/placeholder.png');
        return [String(product.id), await preloadCartImage(source)];
    }));
    if (renderId !== checkoutRenderId) return;
    const imageSources = new Map(imageEntries);

    let html = '';
    let totalItemsCount = 0;
    let totalPix = 0;
    let totalPrazo = 0;

    cartKeys.forEach(id => {
        const qty = cart[id];
        const p = (window.PRODUCTS || []).find(prod => String(prod.id) === String(id));
        if (!p) return;

        totalItemsCount += qty;

        const pricePix = p.price;
        const pixDiscount = Number(p.pix_discount ?? 15);
        const pricePrazo = pixDiscount > 0 && pixDiscount < 100 ? p.price / (1 - pixDiscount / 100) : p.price;

        const itemPixTotal = pricePix * qty;
        const itemPrazoTotal = pricePrazo * qty;

        totalPix += itemPixTotal;
        totalPrazo += itemPrazoTotal;

        const imageSrc = imageSources.get(String(p.id))
            || (typeof DEFAULT_PRODUCT_IMAGE !== 'undefined' ? DEFAULT_PRODUCT_IMAGE : '/images/products/placeholder.png');

        html += `
            <div class="cart-item" data-id="${p.id}">
                <img src="${imageSrc}" alt="${p.title}" onerror="this.onerror=null; this.src='/images/products/placeholder.png';">
                <div class="item-details">
                    <span class="seller">Vendido e entregue por: <strong>Equipe Alfa</strong></span>
                    <h3>${p.title}</h3>
                    <div class="preco-antigo-mobile">De: ${money(itemPrazoTotal)}</div>
                </div>
                <div class="item-actions">
                    <div class="quantidade">
                        <button type="button" onclick="changeCheckoutQty(${p.id}, -1)">-</button>
                        <input type="number" value="${qty}" min="1" max="${p.stock || 99}" readonly>
                        <button type="button" onclick="changeCheckoutQty(${p.id}, 1)">+</button>
                    </div>
                    <button class="btn-remover-discreto" title="Remover item" onclick="removeCheckoutItem(${p.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="item-price">
                    <p class="label">Preço à vista no PIX:</p>
                    <p class="valor">${money(itemPixTotal)}</p>
                </div>
            </div>
            <div class="divider"></div>
        `;
    });

    container.innerHTML = `<div class="checkout-items-list">${html}</div>`;
    updateCheckoutItemsScrollLimit();
    updateSummary(totalItemsCount, totalPix, totalPrazo);
    container.setAttribute('aria-busy', 'false');
}

window.changeCheckoutQty = function changeCheckoutQty(id, delta) {
    if (typeof changeQty === 'function') {
        changeQty(id, delta);
    }
    renderCheckout();
};

window.removeCheckoutItem = function removeCheckoutItem(id) {
    if (window.globalState && window.globalState.cart[id]) {
        delete window.globalState.cart[id];
        if (typeof saveCartToStorage === 'function') saveCartToStorage();
        if (typeof updateCartUI === 'function') updateCartUI();
    }
    renderCheckout();
};

window.clearCheckoutCart = function clearCheckoutCart() {
    const cartKeys = Object.keys(window.globalState ? window.globalState.cart : {});
    if (cartKeys.length === 0) return;

    if (confirm("Tem certeza de que deseja remover todos os produtos do carrinho?")) {
        if (window.globalState) window.globalState.cart = {};
        if (typeof saveCartToStorage === 'function') saveCartToStorage();
        if (typeof updateCartUI === 'function') updateCartUI();
        renderCheckout();
    }
};

function updateSummary(count, totalPix, totalPrazo) {
    const finalPix = totalPix;
    const finalPrazo = totalPrazo;
    const valorParcela = finalPrazo / 10;

    const elCount = document.getElementById('summaryItemCount');
    const elSubtotal = document.getElementById('summarySubtotal');
    const elTotalPix = document.getElementById('summaryTotalPix');
    const elTotalPrazo = document.getElementById('summaryTotalPrazo');
    const elParcelas = document.getElementById('summaryParcelas');

    if (elCount) elCount.textContent = count;
    if (elSubtotal) elSubtotal.textContent = money(totalPrazo);
    if (elTotalPix) elTotalPix.textContent = money(finalPix);
    if (elTotalPrazo) elTotalPrazo.textContent = `ou a prazo ${money(finalPrazo)}`;
    if (elParcelas) elParcelas.textContent = `(até 10x de ${money(valorParcela)} sem juros)`;
}

window.finalizarPedidoWhatsApp = function finalizarPedidoWhatsApp() {
    const cart = window.globalState ? window.globalState.cart : {};
    const cartKeys = Object.keys(cart);

    if (cartKeys.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    // 🚀 REGISTRA COTAÇÕES NO ANALYTICS:
    // Pega cada ID diferente no carrinho (a quantidade de unidades não altera a contagem de cotações)
    const productIds = cartKeys.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length > 0 && typeof registrarCotacaoAnalytics === 'function') {
        registrarCotacaoAnalytics(uniqueProductIds);
    }

    let mensagem = "Olá! Gostaria de finalizar o seguinte pedido na *Equipe Alfa*:\n\n*Itens do Pedido:*\n";
    let totalPix = 0;

    cartKeys.forEach(id => {
        const qty = cart[id];
        const p = (window.PRODUCTS || []).find(prod => String(prod.id) === String(id));
        if (p) {
            const itemTotal = p.price * qty;
            totalPix += itemTotal;
            mensagem += `• *${qty}x* ${p.title} - ${money(itemTotal)}\n`;
        }
    });

    const totalFinal = totalPix;

    mensagem += `\n*Total a pagar no PIX:* ${money(totalFinal)}`;
    mensagem += `\n\nComo posso prosseguir com o pagamento e envio?`;

    const encodedMessage = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
};