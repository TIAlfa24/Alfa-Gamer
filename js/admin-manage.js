async function obterClienteSupabase() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    return typeof window.inicializarSupabase === 'function'
        ? await window.inicializarSupabase()
        : null;
}

const imagemPadraoProduto = '/images/products/placeholder.png';
let clienteProdutos = null;
let produtosAdmin = [];
let produtoEmEdicao = null;
let imagensEdicao = [];
let especificacoesEdicao = [];
let indiceSpecEditada = null;
let quillEdicao = null;
let sortableEdicao = null;
let toastTimer = null;

function mostrarFeedback(mensagem, tipo = 'success') {
    const toast = document.getElementById('manage-toast');
    toast.textContent = mensagem;
    toast.className = `manage-toast is-visible ${tipo}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3800);
}

function criarElemento(tag, className, texto) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (texto !== undefined) element.textContent = texto;
    return element;
}

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function imagensDoProduto(produto) {
    if (Array.isArray(produto.images)) return produto.images.filter(Boolean);
    return produto.images ? [produto.images] : [];
}

function preencherFiltroCategorias() {
    const select = document.getElementById('category-filter');
    const categorias = [...new Set(produtosAdmin.flatMap(produto =>
        String(produto.category || '').split(',').map(value => value.trim()).filter(Boolean)
    ))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    select.replaceChildren(new Option('Todas', ''));
    categorias.forEach(categoria => select.add(new Option(categoria, categoria)));
}

function renderizarProdutos() {
    const container = document.getElementById('product-list');
    const busca = document.getElementById('product-search').value.trim().toLocaleLowerCase('pt-BR');
    const categoriaFiltro = document.getElementById('category-filter').value;
    const filtrados = produtosAdmin.filter(produto => {
        const categorias = String(produto.category || '').split(',').map(value => value.trim());
        const texto = `${produto.title || ''} ${produto.category || ''} ${produto.subcategory || ''}`.toLocaleLowerCase('pt-BR');
        return texto.includes(busca) && (!categoriaFiltro || categorias.includes(categoriaFiltro));
    });
    document.getElementById('product-count').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'produto' : 'produtos'}`;
    container.replaceChildren();
    if (!filtrados.length) {
        container.appendChild(criarElemento('p', 'manage-message', produtosAdmin.length ? 'Nenhum produto corresponde à busca.' : 'Nenhum produto cadastrado.'));
        return;
    }
    filtrados.forEach(produto => {
        const row = criarElemento('article', 'manage-product-row');
        const images = imagensDoProduto(produto);
        const image = document.createElement('img');
        image.className = 'manage-product-image';
        image.src = images[0] || imagemPadraoProduto;
        image.alt = '';
        image.loading = 'lazy';
        image.onerror = () => { image.src = imagemPadraoProduto; };

        const details = criarElemento('div', 'manage-product-details');
        details.appendChild(criarElemento('h2', 'manage-product-title', produto.title || 'Produto sem título'));
        details.appendChild(criarElemento('p', 'manage-product-category', [produto.category, produto.subcategory].filter(Boolean).join(' · ') || 'Sem categoria'));

        const stock = Number(produto.stock) || 0;
        const status = criarElemento('span', `manage-stock ${stock > 0 ? 'in-stock' : 'out-stock'}`, stock > 0 ? `${stock} em estoque` : 'Esgotado');
        const info = criarElemento('div', 'manage-product-meta');
        info.appendChild(criarElemento('strong', 'manage-product-price', formatarPreco(produto.price)));
        info.appendChild(status);

        const actions = criarElemento('div', 'manage-product-actions');
        const edit = criarElemento('button', 'manage-action-button edit-action', 'Editar');
        edit.type = 'button';
        edit.addEventListener('click', () => abrirEdicao(produto));
        const remove = criarElemento('button', 'manage-action-button remove-action', 'Remover');
        remove.type = 'button';
        remove.addEventListener('click', () => removerProduto(produto));
        actions.append(edit, remove);
        row.append(image, details, info, actions);
        container.appendChild(row);
    });
}

function mostrarLista() {
    document.getElementById('product-edit-view').hidden = true;
    document.getElementById('product-list-view').hidden = false;
    document.getElementById('form-editar-produto').reset();
    produtoEmEdicao = null;
    imagensEdicao.forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
    imagensEdicao = [];
    especificacoesEdicao = [];
    indiceSpecEditada = null;
    document.getElementById('edit-specs-list').replaceChildren();
    document.getElementById('edit-drop-zone').replaceChildren(document.getElementById('edit-images-file'));
    renderizarProdutos();
}

function renderizarImagensEdicao() {
    const zone = document.getElementById('edit-drop-zone');
    const input = document.getElementById('edit-images-file');
    zone.replaceChildren();
    if (!imagensEdicao.length) zone.appendChild(criarElemento('span', 'manage-image-prompt', 'Clique para adicionar imagens'));
    imagensEdicao.forEach((item, index) => {
        const card = criarElemento('div', 'preview-card');
        card.dataset.id = item.id;
        const badge = criarElemento('span', 'badge-capa', 'CAPA');
        const image = document.createElement('img');
        image.src = item.previewUrl;
        image.alt = `Imagem ${index + 1} do produto`;
        const remove = criarElemento('button', 'btn-remover-img', '×');
        remove.type = 'button';
        remove.title = 'Remover imagem';
        remove.setAttribute('aria-label', 'Remover imagem');
        remove.addEventListener('click', event => {
            event.stopPropagation();
            const [removed] = imagensEdicao.splice(index, 1);
            if (removed.file) URL.revokeObjectURL(removed.previewUrl);
            renderizarImagensEdicao();
        });
        card.append(badge, image, remove);
        zone.appendChild(card);
    });
    const addMore = criarElemento('button', 'preview-card add-more-card', '+');
    addMore.type = 'button';
    addMore.title = 'Adicionar imagens';
    addMore.addEventListener('click', event => { event.stopPropagation(); input.click(); });
    zone.append(addMore, input);
    if (sortableEdicao) sortableEdicao.destroy();
    if (typeof window.Sortable === 'function') {
        sortableEdicao = new window.Sortable(zone, {
            animation: 150,
            draggable: '.preview-card:not(.add-more-card)',
            filter: '.add-more-card, button',
            onEnd: () => {
                const ids = [...zone.querySelectorAll('.preview-card:not(.add-more-card)')].map(card => card.dataset.id);
                imagensEdicao.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
                renderizarImagensEdicao();
            }
        });
    }
}

async function prepararImagens(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        let imagem = file;
        if (typeof window.imageCompression === 'function') {
            imagem = await window.imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true });
        }
        imagensEdicao.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file: imagem, previewUrl: URL.createObjectURL(imagem) });
    }
    renderizarImagensEdicao();
}

function renderizarSpecsEdicao() {
    const container = document.getElementById('edit-specs-list');
    container.replaceChildren();
    especificacoesEdicao.forEach((item, index) => {
        const row = criarElemento('div', 'spec-item-row');
        const info = criarElemento('div', 'spec-item-info');
        info.append(criarElemento('strong', 'spec-key', item.key), criarElemento('span', 'spec-arrow', '→'), criarElemento('span', 'spec-val', item.val));
        const actions = criarElemento('div', 'spec-item-actions');
        const edit = criarElemento('button', 'btn-spec-edit', 'Editar');
        edit.type = 'button';
        edit.addEventListener('click', () => {
            document.getElementById('edit-spec-key').value = item.key;
            document.getElementById('edit-spec-value').value = item.val;
            indiceSpecEditada = index;
            document.getElementById('edit-add-spec').textContent = 'Salvar';
            document.getElementById('edit-spec-key').focus();
        });
        const remove = criarElemento('button', 'btn-spec-remove', '×');
        remove.type = 'button';
        remove.title = 'Remover especificação';
        remove.addEventListener('click', () => { especificacoesEdicao.splice(index, 1); renderizarSpecsEdicao(); });
        actions.append(edit, remove);
        row.append(info, actions);
        container.appendChild(row);
    });
    if (!especificacoesEdicao.length) container.appendChild(criarElemento('span', 'tags-placeholder-text', 'Nenhuma especificação adicionada.'));
}

function adicionarSpecEdicao() {
    const keyInput = document.getElementById('edit-spec-key');
    const valueInput = document.getElementById('edit-spec-value');
    const key = keyInput.value.trim();
    const val = valueInput.value.trim();
    if (!key || !val) return mostrarFeedback('Informe o nome e o valor da especificação.', 'error');
    const duplicate = especificacoesEdicao.findIndex((item, index) => index !== indiceSpecEditada && item.key.toLowerCase() === key.toLowerCase());
    if (duplicate >= 0) especificacoesEdicao[duplicate].val = val;
    else if (indiceSpecEditada !== null) especificacoesEdicao[indiceSpecEditada] = { key, val };
    else especificacoesEdicao.push({ key, val });
    indiceSpecEditada = null;
    keyInput.value = '';
    valueInput.value = '';
    document.getElementById('edit-add-spec').textContent = 'Adicionar';
    renderizarSpecsEdicao();
}

function abrirEdicao(produto) {
    produtoEmEdicao = produto;
    const form = document.getElementById('form-editar-produto');
    form.reset();
    document.getElementById('edit-title').value = produto.title || '';
    document.getElementById('edit-price').value = Number(produto.price) || 0;
    document.getElementById('edit-stock').value = Number(produto.stock) || 0;
    document.getElementById('edit-tags').value = Array.isArray(produto.tags) ? produto.tags.join(', ') : '';
    document.getElementById('edit-product-subtitle').textContent = produto.title || 'Altere os dados do produto selecionado.';
    const categorias = String(produto.category || '').split(',').map(value => value.trim());
    const subcategorias = String(produto.subcategory || '').split(',').map(value => value.trim());
    document.querySelectorAll('input[name="edit-category"]').forEach(input => { input.checked = categorias.includes(input.value); });
    document.querySelectorAll('input[name="edit-subcategory"]').forEach(input => { input.checked = subcategorias.includes(input.value); });
    quillEdicao.root.innerHTML = produto.desc_text || produto.desc || '';
    especificacoesEdicao = Object.entries(produto.specs && typeof produto.specs === 'object' ? produto.specs : {}).map(([key, val]) => ({ key, val: String(val) }));
    imagensEdicao = imagensDoProduto(produto).map((url, index) => ({ id: `existing-${index}-${produto.id}`, url, previewUrl: url }));
    renderizarSpecsEdicao();
    renderizarImagensEdicao();
    document.getElementById('product-list-view').hidden = true;
    document.getElementById('product-edit-view').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('edit-title').focus({ preventScroll: true });
}

async function enviarImagensEdicao() {
    const urls = [];
    for (const [index, item] of imagensEdicao.entries()) {
        if (item.url) {
            urls.push(item.url);
            continue;
        }
        const extension = item.file.name.split('.').pop() || 'jpg';
        const path = `images/products/${Date.now()}_${index}_${Math.random().toString(36).slice(2)}.${extension}`;
        const { error } = await clienteProdutos.storage.from('produtos').upload(path, item.file);
        if (error) throw error;
        urls.push(clienteProdutos.storage.from('produtos').getPublicUrl(path).data.publicUrl);
    }
    return urls;
}

async function salvarEdicao(event) {
    event.preventDefault();
    const button = document.getElementById('save-edit');
    button.disabled = true;
    button.textContent = 'Salvando...';
    try {
        const categories = [...document.querySelectorAll('input[name="edit-category"]:checked')].map(input => input.value);
        const subcategories = [...document.querySelectorAll('input[name="edit-subcategory"]:checked')].map(input => input.value);
        const title = document.getElementById('edit-title').value.trim();
        const price = Number(document.getElementById('edit-price').value);
        const stock = Number(document.getElementById('edit-stock').value);
        if (!title) throw new Error('Informe o título do produto.');
        if (!categories.length || !subcategories.length) throw new Error('Selecione pelo menos uma categoria e uma subcategoria.');
        if (!Number.isFinite(price) || price < 0) throw new Error('Informe um preço válido.');
        if (!Number.isInteger(stock) || stock < 0) throw new Error('Informe um estoque válido.');
        if (!imagensEdicao.length) throw new Error('O produto precisa ter pelo menos uma imagem.');
        if (!quillEdicao.getText().trim()) throw new Error('A descrição detalhada não pode ficar vazia.');

        const tags = [...new Set(document.getElementById('edit-tags').value.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))];
        const produtoAtualizado = {
            title,
            category: categories.join(','),
            subcategory: subcategories.join(','),
            price,
            stock,
            desc_text: quillEdicao.root.innerHTML,
            images: await enviarImagensEdicao(),
            tags,
            specs: Object.fromEntries(especificacoesEdicao.map(item => [item.key, item.val]))
        };
        const { error } = await clienteProdutos.from('produtos').update(produtoAtualizado).eq('id', produtoEmEdicao.id);
        if (error) throw error;
        produtosAdmin = produtosAdmin.map(produto => produto.id === produtoEmEdicao.id ? { ...produto, ...produtoAtualizado } : produto);
        preencherFiltroCategorias();
        mostrarLista();
        mostrarFeedback('Produto atualizado com sucesso.');
    } catch (error) {
        mostrarFeedback(`Não foi possível salvar: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Salvar alterações';
    }
}

async function removerProduto(produto) {
    const confirmado = window.confirm(`Tem certeza que deseja remover o produto "${produto.title || 'Produto sem título'}"? Essa ação não poderá ser desfeita.`);
    if (!confirmado) return;
    try {
        const { error } = await clienteProdutos.from('produtos').delete().eq('id', produto.id);
        if (error) throw error;
        produtosAdmin = produtosAdmin.filter(item => item.id !== produto.id);
        preencherFiltroCategorias();
        renderizarProdutos();
        mostrarFeedback('Produto removido com sucesso.');
    } catch (error) {
        mostrarFeedback(`Não foi possível remover o produto: ${error.message}`, 'error');
    }
}

async function inicializarGerenciamento() {
    if (typeof window.Quill !== 'function') {
        document.body.style.display = 'block';
        document.getElementById('product-list').replaceChildren(criarElemento('p', 'manage-message', 'O editor não carregou. Atualize a página e tente novamente.'));
        return;
    }
    quillEdicao = new window.Quill('#edit-description', { theme: 'snow', placeholder: 'Escreva a descrição detalhada do produto aqui...' });
    document.getElementById('form-editar-produto').addEventListener('submit', salvarEdicao);
    document.getElementById('cancel-edit').addEventListener('click', mostrarLista);
    document.getElementById('cancel-edit-top').addEventListener('click', mostrarLista);
    document.getElementById('product-search').addEventListener('input', renderizarProdutos);
    document.getElementById('category-filter').addEventListener('change', renderizarProdutos);
    document.getElementById('edit-add-spec').addEventListener('click', adicionarSpecEdicao);
    document.getElementById('edit-spec-value').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); adicionarSpecEdicao(); } });

    const dropZone = document.getElementById('edit-drop-zone');
    const fileInput = document.getElementById('edit-images-file');
    dropZone.addEventListener('click', event => { if (!event.target.closest('.preview-card, input')) fileInput.click(); });
    dropZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
    dropZone.addEventListener('dragover', event => { event.preventDefault(); });
    dropZone.addEventListener('drop', async event => {
        event.preventDefault();
        try { await prepararImagens([...event.dataTransfer.files]); }
        catch (error) { mostrarFeedback(`Erro ao preparar imagens: ${error.message}`, 'error'); }
    });
    fileInput.addEventListener('change', async () => {
        try { await prepararImagens([...fileInput.files]); }
        catch (error) { mostrarFeedback(`Erro ao preparar imagens: ${error.message}`, 'error'); }
        finally { fileInput.value = ''; }
    });

    clienteProdutos = await obterClienteSupabase();
    if (!clienteProdutos) {
        document.body.style.display = 'block';
        document.getElementById('product-list').replaceChildren(criarElemento('p', 'manage-message', 'Não foi possível conectar ao banco de dados. Entre novamente.'));
        return;
    }
    const { data: { user }, error: sessionError } = await clienteProdutos.auth.getUser();
    if (sessionError || !user) { window.location.replace('/auth/login'); return; }
    const { data: profile, error: profileError } = await clienteProdutos.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') {
        await clienteProdutos.auth.signOut();
        alert('Acesso negado: usuário não é administrador.');
        window.location.replace('/auth/login');
        return;
    }
    document.body.style.display = 'block';
    try {
        const { data, error } = await clienteProdutos.from('produtos').select('*').order('title');
        if (error) throw error;
        produtosAdmin = data || [];
        preencherFiltroCategorias();
        renderizarProdutos();
    } catch (error) {
        document.getElementById('product-list').replaceChildren(criarElemento('p', 'manage-message error', `Não foi possível carregar os produtos: ${error.message}`));
    }
}

document.addEventListener('DOMContentLoaded', inicializarGerenciamento);