
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = PRODUCTS.find(p => p.id === productId) || PRODUCTS[0];
        const oldPrice = product.price * 1.15;
        document.getElementById('productOldPrice').textContent = money(oldPrice);
        document.getElementById('productName').textContent = product.title;
        document.getElementById('productTitle').textContent = product.title;
        const catLink = document.getElementById('categoryLink');
        const subCatLink = document.getElementById('subcategoryLink');
        catLink.textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
        subCatLink.textContent = product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1);
        catLink.href = `loja.html?cat=${encodeURIComponent(product.category)}`;
        subCatLink.href = `loja.html?cat=${encodeURIComponent(product.category)}&subcat=${encodeURIComponent(product.subcategory)}`;
        document.getElementById('productPrice').textContent = money(product.price);
        document.getElementById('productOldPriceMobile').textContent = money(oldPrice);
        document.getElementById('productInstallments').textContent = `em até 12x de ${money(product.price / 12)} sem juros`;
        document.getElementById('productDescription').textContent = product.desc;
        carregarImagensProduto(product.id);

        const stockStatusEl = document.getElementById('stockStatus');
        const btnComprarPrincipal = document.querySelector('.btn-comprar.principal');
        const btnComprarSecundario = document.querySelector('.btn-comprar.secundario');
        const qtyInput = document.getElementById('qty');
        const quantidadeContainer = document.querySelector('.quantidade');
        const freteContainer = document.querySelector('.frete-simulador');
        const acoesContainer = document.querySelector('.acoes');

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

        function adjustQty(delta) {
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

        function addToCartAndNavigate() {
            const qty = parseInt(document.getElementById('qty').value);
            addToCart(product.id, qty);
        }

        function trocarImagem(src) {
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
