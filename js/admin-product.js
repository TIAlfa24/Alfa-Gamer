async function obterClienteSupabase() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    return typeof window.inicializarSupabase === 'function'
        ? await window.inicializarSupabase()
        : null;
}

let imagensProduto = [];
let especificacoesProduto = [];
let tagsManuais = new Set();
let tagsAutomaticasDescartadas = new Set();
let indiceEspecificacaoEditada = null;
let editorDescricao = null;

function obterSpecsJSON() {
    return Object.fromEntries(especificacoesProduto.map(item => [item.key, item.val]));
}

function obterTextoDescricao() {
    return editorDescricao?.getText().trim() || '';
}

function gerarTagsAutomaticas() {
    const texto = [
        document.getElementById('prod-title')?.value || '',
        obterTextoDescricao(),
        ...Object.values(obterSpecsJSON())
    ].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    return [...new Set(texto.replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
        .filter(palavra => palavra.length > 3))];
}

function criarChip(tag, tipo, textoBotao, aoRemover) {
    const chip = document.createElement('div');
    chip.className = `tag-chip ${tipo}`;
    const label = document.createElement('span');
    label.textContent = tag;
    const badge = document.createElement('span');
    badge.className = 'tag-badge';
    badge.textContent = tipo === 'manual-tag' ? 'manual' : 'auto';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-remove-tag';
    remove.title = textoBotao;
    remove.textContent = '×';
    remove.addEventListener('click', aoRemover);
    chip.append(label, badge, remove);
    return chip;
}

function renderizarTagsManuais() {
    const container = document.getElementById('manual-tags-list');
    container.replaceChildren();
    if (!tagsManuais.size) {
        const empty = document.createElement('span');
        empty.className = 'tags-placeholder-text';
        empty.innerHTML = '<label style="margin-bottom: 0;color: var(--muted);">Nenhuma tag manual adicionada.</label>';
        container.appendChild(empty);
        return;
    }
    tagsManuais.forEach(tag => container.appendChild(criarChip(tag, 'manual-tag', 'Remover tag', () => {
        tagsManuais.delete(tag);
        renderizarTagsManuais();
        atualizarPreviewTagsAutomaticas();
    })));
}

function atualizarPreviewTagsAutomaticas() {
    const container = document.getElementById('auto-tags-list');
    if (!container) return;
    const tags = gerarTagsAutomaticas().filter(tag =>
        !tagsAutomaticasDescartadas.has(tag) && !tagsManuais.has(tag)
    );
    container.replaceChildren();
    if (!tags.length) {
        const empty = document.createElement('span');
        empty.className = 'tags-placeholder-text';
        empty.innerHTML = '<label style="margin-bottom: 0;color: var(--muted);">Nenhuma tag automática gerada.</label>';
        container.appendChild(empty);
        return;
    }
    tags.forEach(tag => container.appendChild(criarChip(tag, 'auto-tag', 'Descartar tag automática', () => {
        tagsAutomaticasDescartadas.add(tag);
        atualizarPreviewTagsAutomaticas();
    })));
}

function adicionarTagManual(texto) {
    const tag = texto.trim().toLowerCase().replace(/,/g, '');
    if (!tag) return;
    tagsManuais.add(tag);
    renderizarTagsManuais();
    atualizarPreviewTagsAutomaticas();
}

function renderizarEspecificacoes() {
    const container = document.getElementById('specs-list-container');
    container.replaceChildren();
    if (!especificacoesProduto.length) {
        const empty = document.createElement('span');
        empty.className = 'tags-placeholder-text';
        container.appendChild(empty);
        return;
    }
    especificacoesProduto.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'spec-item-row';
        const info = document.createElement('div');
        info.className = 'spec-item-info';
        const key = document.createElement('span');
        key.className = 'spec-key';
        key.textContent = item.key;
        const arrow = document.createElement('span');
        arrow.className = 'spec-arrow';
        arrow.textContent = '→';
        const value = document.createElement('span');
        value.className = 'spec-val';
        value.textContent = item.val;
        info.append(key, arrow, value);

        const actions = document.createElement('div');
        actions.className = 'spec-item-actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn-spec-edit';
        edit.textContent = 'Editar';
        edit.addEventListener('click', () => {
            document.getElementById('spec-key-input').value = item.key;
            document.getElementById('spec-val-input').value = item.val;
            indiceEspecificacaoEditada = index;
            document.getElementById('btn-add-spec').textContent = 'Salvar';
            document.getElementById('spec-key-input').focus();
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn-spec-remove';
        remove.title = 'Remover especificação';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
            especificacoesProduto.splice(index, 1);
            renderizarEspecificacoes();
            atualizarPreviewTagsAutomaticas();
        });
        actions.append(edit, remove);
        row.append(info, actions);
        container.appendChild(row);
    });
}

function adicionarEspecificacao() {
    const keyInput = document.getElementById('spec-key-input');
    const valInput = document.getElementById('spec-val-input');
    const key = keyInput.value.trim();
    const val = valInput.value.trim();
    if (!key || !val) {
        alert('Preencha o nome e o valor da especificação.');
        return;
    }
    const duplicate = especificacoesProduto.findIndex((item, index) =>
        index !== indiceEspecificacaoEditada && item.key.toLowerCase() === key.toLowerCase()
    );
    if (duplicate >= 0) especificacoesProduto[duplicate].val = val;
    else if (indiceEspecificacaoEditada !== null) {
        especificacoesProduto[indiceEspecificacaoEditada] = { key, val };
    } else especificacoesProduto.push({ key, val });

    indiceEspecificacaoEditada = null;
    keyInput.value = '';
    valInput.value = '';
    document.getElementById('btn-add-spec').textContent = '+ Adicionar';
    renderizarEspecificacoes();
    atualizarPreviewTagsAutomaticas();
    keyInput.focus();
}

function renderizarPreviews() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('prod-images-file');
    dropZone.replaceChildren();
    if (!imagensProduto.length) {
        const prompt = document.createElement('span');
        prompt.className = 'drop-zone-prompt';
        prompt.innerHTML = '<i class="material-icons" aria-hidden="true">library_add</i><span>Clique aqui ou arraste as imagens para anexar</span>';
        dropZone.appendChild(prompt);
    }
    imagensProduto.forEach(item => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.dataset.id = item.id;
        const badge = document.createElement('div');
        badge.className = 'badge-capa';
        badge.textContent = 'CAPA';
        const image = document.createElement('img');
        image.src = item.previewUrl;
        image.alt = 'Imagem do produto';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn-remover-img';
        remove.title = 'Remover imagem';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
            const index = imagensProduto.findIndex(imageItem => imageItem.id === item.id);
            if (index >= 0) URL.revokeObjectURL(imagensProduto.splice(index, 1)[0].previewUrl);
            renderizarPreviews();
        });
        card.append(badge, image, remove);
        dropZone.appendChild(card);
    });
    if (imagensProduto.length) {
        const addMore = document.createElement('button');
        addMore.type = 'button';
        addMore.className = 'preview-card add-more-card';
        addMore.title = 'Adicionar mais imagens';
        addMore.textContent = '+';
        addMore.addEventListener('click', () => fileInput.click());
        dropZone.appendChild(addMore);
    }
    dropZone.appendChild(fileInput);
}

async function adicionarImagens(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        let compressed = file;
        if (typeof window.imageCompression === 'function') {
            compressed = await window.imageCompression(file, {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 1200,
                useWebWorker: true
            });
        }
        imagensProduto.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file: compressed,
            previewUrl: URL.createObjectURL(compressed)
        });
    }
    renderizarPreviews();
}

async function uploadMultiplasImagens(supabase) {
    const urls = [];
    for (const [index, item] of imagensProduto.entries()) {
        const extension = item.file.name.split('.').pop() || 'jpg';
        const path = `images/products/${Date.now()}_${index}_${Math.random().toString(36).slice(2)}.${extension}`;
        const { error } = await supabase.storage.from('produtos').upload(path, item.file);
        if (error) throw error;
        urls.push(supabase.storage.from('produtos').getPublicUrl(path).data.publicUrl);
    }
    return urls;
}

function limparFormularioProduto() {
    document.getElementById('form-cadastro-produto').reset();
    editorDescricao.setContents([]);
    imagensProduto.forEach(item => URL.revokeObjectURL(item.previewUrl));
    imagensProduto = [];
    especificacoesProduto = [];
    tagsManuais.clear();
    tagsAutomaticasDescartadas.clear();
    indiceEspecificacaoEditada = null;
    renderizarPreviews();
    renderizarEspecificacoes();
    renderizarTagsManuais();
    atualizarPreviewTagsAutomaticas();
}

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.Quill !== 'function') {
        alert('O editor de descrição não carregou. Atualize a página e tente novamente.');
        return;
    }
    editorDescricao = new window.Quill('#editor-desc', {
        theme: 'snow',
        placeholder: 'Escreva a descrição detalhada do produto aqui...'
    });
    editorDescricao.on('text-change', atualizarPreviewTagsAutomaticas);

    const supabase = await obterClienteSupabase();
    if (!supabase) {
        alert('Não foi possível iniciar o banco de dados. Entre novamente.');
        window.location.replace('/auth/login');
        return;
    }
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
        window.location.replace('/auth/login');
        return;
    }
    const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        alert('Acesso negado: usuário não é administrador.');
        window.location.replace('/auth/login');
        return;
    }
    document.body.style.display = 'block';

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('prod-images-file');
    dropZone.addEventListener('click', event => {
        if (event.target.closest('.btn-remover-img, .add-more-card')) return;
        if (event.target === dropZone || event.target.closest('.drop-zone-prompt')) fileInput.click();
    });
    dropZone.addEventListener('dragover', event => event.preventDefault());
    dropZone.addEventListener('drop', async event => {
        event.preventDefault();
        try {
            await adicionarImagens(Array.from(event.dataTransfer.files));
        } catch (error) {
            alert(`Erro ao preparar imagens: ${error.message}`);
        }
    });
    fileInput.addEventListener('change', async () => {
        try {
            await adicionarImagens(Array.from(fileInput.files));
        } catch (error) {
            alert(`Erro ao preparar imagens: ${error.message}`);
        } finally {
            fileInput.value = '';
        }
    });
    if (typeof window.Sortable === 'function') {
        new window.Sortable(dropZone, {
            animation: 150,
            draggable: '.preview-card:not(.add-more-card)',
            filter: '.add-more-card, button',
            onEnd: () => {
                const ids = [...dropZone.querySelectorAll('.preview-card:not(.add-more-card)')]
                    .map(card => card.dataset.id);
                imagensProduto.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
                renderizarPreviews();
            }
        });
    }

    document.getElementById('btn-add-spec').addEventListener('click', adicionarEspecificacao);
    document.getElementById('spec-key-input').addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('spec-val-input').focus();
        }
    });
    document.getElementById('spec-val-input').addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            adicionarEspecificacao();
        }
    });
    const tagInput = document.getElementById('input-tag-manual');
    const adicionarTag = () => {
        adicionarTagManual(tagInput.value);
        tagInput.value = '';
        tagInput.focus();
    };
    document.getElementById('btn-add-tag-manual').addEventListener('click', adicionarTag);
    tagInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            adicionarTag();
        }
    });
    document.getElementById('prod-title').addEventListener('input', atualizarPreviewTagsAutomaticas);

    renderizarPreviews();
    renderizarEspecificacoes();
    renderizarTagsManuais();
    atualizarPreviewTagsAutomaticas();

    document.getElementById('form-cadastro-produto').addEventListener('submit', async event => {
        event.preventDefault();
        const button = document.getElementById('btn-salvar');
        button.disabled = true;
        button.textContent = 'Enviando e salvando...';
        try {
            const categories = [...document.querySelectorAll('input[name="prod-category"]:checked')]
                .map(input => input.value);
            const subcategories = [...document.querySelectorAll('input[name="prod-subcategory"]:checked')]
                .map(input => input.value);
            if (!categories.length || !subcategories.length) {
                throw new Error('Selecione pelo menos uma categoria e uma subcategoria.');
            }
            if (!imagensProduto.length) throw new Error('Anexe pelo menos uma imagem.');
            if (!obterTextoDescricao()) throw new Error('A descrição detalhada não pode ficar vazia.');

            const product = {
                title: document.getElementById('prod-title').value.trim(),
                category: categories.join(','),
                subcategory: subcategories.join(','),
                price: Number(document.getElementById('prod-price').value),
                stock: Number.parseInt(document.getElementById('prod-stock').value, 10),
                desc_text: editorDescricao.root.innerHTML,
                images: await uploadMultiplasImagens(supabase),
                tags: [...new Set([...tagsManuais, ...gerarTagsAutomaticas()
                    .filter(tag => !tagsAutomaticasDescartadas.has(tag))])],
                specs: obterSpecsJSON()
            };
            const { error } = await supabase.from('produtos').insert([product]);
            if (error) throw error;
            alert('Produto cadastrado com sucesso!');
            limparFormularioProduto();
        } catch (error) {
            alert(`Não foi possível cadastrar o produto: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Cadastrar Produto';
        }
    });
});