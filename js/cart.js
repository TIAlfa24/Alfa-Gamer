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

    renderCheckout();
});

function renderCheckout() {
    const container = document.getElementById('checkoutCartItems');
    if (!container) return;

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
        return;
    }

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
        const pricePrazo = p.price * 1.15;

        const itemPixTotal = pricePix * qty;
        const itemPrazoTotal = pricePrazo * qty;

        totalPix += itemPixTotal;
        totalPrazo += itemPrazoTotal;

        const imageSrc = (p.images && p.images.length > 0 && p.images[0])
    ? p.images[0]
    : (typeof DEFAULT_PRODUCT_IMAGE !== 'undefined' ? DEFAULT_PRODUCT_IMAGE : '/images/products/placeholder.png');

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

    container.innerHTML = html;
    updateSummary(totalItemsCount, totalPix, totalPrazo);
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