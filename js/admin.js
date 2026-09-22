// ==========================================
// FUNÇÕES DE SUPABASE E HELPERS
// ==========================================
async function obterClienteSupabase() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    return typeof window.inicializarSupabase === 'function'
      ? await window.inicializarSupabase()
      : null;
}

async function cadastrarNovoProduto(produtoData) {
    const supabase = await obterClienteSupabase();
    if (!supabase) {
      alert('⚠️ Sistema de banco de dados não inicializado.');
      return false;
    }

    const { error } = await supabase
      .from('produtos')
      .insert([produtoData]);

    if (error) {
      alert('❌ Erro ao cadastrar produto: ' + error.message);
      return false;
    } else {
      alert('✅ Produto inserido com sucesso!');
      document.getElementById('form-cadastro-produto').reset();
      return true;
    }
}

// Gerador de Tags Automáticas
function gerarTagsAutomaticas(titulo, descTexto, specsObj) {
    const valoresSpecs = Object.values(specsObj).join(' ');
    const descLimpa = (descTexto || '').replace(/<[^>]*>?/gm, ' '); 
    const textoCompleto = `${titulo} ${descLimpa}${valoresSpecs}`.toLowerCase();

    const palavras = textoCompleto
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(p => p.length > 3);

    return [...new Set(palavras)];
}

// ==========================================
// GERENCIAMENTO DE MÚLTIPLAS IMAGENS
// ==========================================
let arrayArquivosImagens = [];

async function comprimirImagem(file) {
    const options = {
        maxSizeMB: 0.3, 
        maxWidthOrHeight: 1200, 
        useWebWorker: true
    };
    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error("Erro ao comprimir imagem:", error);
        return file; 
    }
}

async function uploadMultiplasImagens(arquivos, supabase) {
    const urls = []; 

    for (let i = 0; i < arquivos.length; i++) {
        const file = arquivos[i].file;
        const fileExt = file.name.split('.').pop();
        const fileName = `images/products/${Date.now()}_img_${i + 1}.${fileExt}`;

        const { error } = await supabase.storage
            .from('produtos')
            .upload(fileName, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('produtos')
            .getPublicUrl(fileName);

        urls.push(publicUrlData.publicUrl);
    }

    return urls; 
}

function renderizarPreviews() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('prod-images-file');
    if (!dropZone) return;

    dropZone.innerHTML = ''; 

    if (arrayArquivosImagens.length === 0) {
        const spanText = document.createElement('span');
        spanText.style.color = '#555';
        spanText.style.pointerEvents = 'none';
        spanText.innerHTML = '<a>Clique aqui ou arraste as imagens para anexar</a>';
        dropZone.appendChild(spanText);
    } else {
        arrayArquivosImagens.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'preview-card';
            div.dataset.id = item.id; 

            div.innerHTML = `
                <div class="badge-capa">CAPA</div>
                <img src="${item.previewUrl}" alt="Preview">
                <button type="button" class="btn-remover-img" onclick="event.stopPropagation(); removerImagem('${item.id}')">x</button>
            `;
            dropZone.appendChild(div);
        });

        const addMoreCard = document.createElement('div');
        addMoreCard.className = 'preview-card add-more-card';
        addMoreCard.style.cssText = 'display: flex; align-items: center; justify-content: center; border: 2px dashed #ccc; background: white; font-size: 32px; color: #ccc; cursor: pointer; width: 80px; height: 80px; border-radius: 6px;';
        addMoreCard.title = 'Adicionar mais imagens';
        addMoreCard.innerHTML = '+'; // Ícone do + corrigido
        
        dropZone.appendChild(addMoreCard);
    }

    if (fileInput) {
        dropZone.appendChild(fileInput);
    }
}

window.removerImagem = function(id) {
    arrayArquivosImagens = arrayArquivosImagens.filter(img => img.id !== id);
    renderizarPreviews();
};

// ==========================================
// ESTADO E GESTÃO DAS ESPECIFICAÇÕES TÉCNICAS
// ==========================================
let productSpecsList = [];

function adicionarEspecificacao() {
    const keyInput = document.getElementById('spec-key-input');
    const valInput = document.getElementById('spec-val-input');

    if (!keyInput || !valInput) return;

    const chave = keyInput.value.trim();
    const valor = valInput.value.trim();

    if (!chave || !valor) {
        alert('⚠️ Preencha o nome da especificação e o valor antes de adicionar.');
        return;
    }

    const indexExistente = productSpecsList.findIndex(
        item => item.key.toLowerCase() === chave.toLowerCase()
    );

    if (indexExistente !== -1) {
        if (confirm(`A especificação "${chave}" já existe. Deseja atualizar o valor para "${valor}"?`)) {
            productSpecsList[indexExistente].val = valor;
        } else {
            return;
        }
    } else {
        productSpecsList.push({ key: chave, val: valor });
    }

    keyInput.value = '';
    valInput.value = '';
    keyInput.focus();

    renderizarEspecificacoes();
    atualizarPreviewTagsAutomaticas();
}

function removerEspecificacao(index) {
    productSpecsList.splice(index, 1);
    renderizarEspecificacoes();
    atualizarPreviewTagsAutomaticas();
}

function editarEspecificacao(index) {
    const item = productSpecsList[index];
    if (!item) return;

    const keyInput = document.getElementById('spec-key-input');
    const valInput = document.getElementById('spec-val-input');

    if (keyInput && valInput) {
        keyInput.value = item.key;
        valInput.value = item.val;
        keyInput.focus();
    }

    removerEspecificacao(index);
}

function renderizarEspecificacoes() {
    const container = document.getElementById('specs-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (productSpecsList.length === 0) {
        return;
    }

    productSpecsList.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'spec-item-row';
        row.innerHTML = `
            <div class="spec-item-info">
                <span class="spec-key">${item.key}</span>
                <span class="spec-arrow">→</span>
                <span class="spec-val">${item.val}</span>
            </div>
            <div class="spec-item-actions">
                <button type="button" class="btn-spec-edit" title="Editar especificação" onclick="editarEspecificacao(${index})">Editar</button>
                <button type="button" class="btn-spec-remove" title="Remover especificação" onclick="removerEspecificacao(${index})">&times;</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function obterSpecsJSON() {
    const specsObj = {};
    productSpecsList.forEach(item => {
        if (item.key && item.val) {
            specsObj[item.key] = item.val;
        }
    });
    return specsObj;
}

window.removerEspecificacao = removerEspecificacao;
window.editarEspecificacao = editarEspecificacao;

// ==========================================
// ESTADO E GESTÃO DAS TAGS VISUAIS
// ==========================================
let manualTagsSet = new Set();
let removedAutoTagsSet = new Set();

function normalizarTag(tag) {
    return tag.trim().toLowerCase().replace(/,/g, '');
}

function adicionarTagManual(tagTexto) {
    const tagLimpa = normalizarTag(tagTexto);
    if (!tagLimpa) return;

    if (manualTagsSet.has(tagLimpa)) return;

    manualTagsSet.add(tagLimpa);
    renderizarTagsManuais();
    atualizarPreviewTagsAutomaticas();
}

function removerTagManual(tagTexto) {
    manualTagsSet.delete(tagTexto);
    renderizarTagsManuais();
    atualizarPreviewTagsAutomaticas();
}

function removerTagAutomatica(tagTexto) {
    removedAutoTagsSet.add(tagTexto);
    atualizarPreviewTagsAutomaticas();
}

function renderizarTagsManuais() {
    const container = document.getElementById('manual-tags-list');
    if (!container) return;

    container.innerHTML = '';

    if (manualTagsSet.size === 0) {
        container.innerHTML = '<span class="tags-placeholder-text">Nenhuma tag manual adicionada.</span>';
        return;
    }

    manualTagsSet.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip manual-tag';
        chip.innerHTML = `
            <span>${tag}</span>
            <span class="tag-badge">manual</span>
            <button type="button" class="btn-remove-tag" title="Remover tag" onclick="removerTagManual('${tag}')">&times;</button>
        `;
        container.appendChild(chip);
    });
}

function atualizarPreviewTagsAutomaticas() {
    const container = document.getElementById('auto-tags-list');
    if (!container) return;

    const titulo = document.getElementById('prod-title')?.value || '';
    const descTexto = window.quillEditor ? window.quillEditor.getText() : (document.getElementById('editor-desc')?.innerText || '');
    const specsJSON = obterSpecsJSON();

    const rawAutoTags = gerarTagsAutomaticas(titulo, descTexto, specsJSON);
    const filteredAutoTags = rawAutoTags.filter(tag => !removedAutoTagsSet.has(tag) && !manualTagsSet.has(tag));

    container.innerHTML = '';

    if (filteredAutoTags.length === 0) {
        container.innerHTML = '<span class="tags-placeholder-text">Nenhuma tag automática gerada.</span>';
        return;
    }

    filteredAutoTags.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip auto-tag';
        chip.innerHTML = `
            <span>${tag}</span>
            <span class="tag-badge">auto</span>
            <button type="button" class="btn-remove-tag" title="Descartar tag automática" onclick="removerTagAutomatica('${tag}')">&times;</button>
        `;
        container.appendChild(chip);
    });
}

function obterTagsFinais() {
    const titulo = document.getElementById('prod-title')?.value || '';
    const descTexto = window.quillEditor ? window.quillEditor.getText() : (document.getElementById('editor-desc')?.innerText || '');
    const specsJSON = obterSpecsJSON();

    const rawAutoTags = gerarTagsAutomaticas(titulo, descTexto, specsJSON);
    const validAutoTags = rawAutoTags.filter(tag => !removedAutoTagsSet.has(tag));

    return [...new Set([...manualTagsSet, ...validAutoTags])];
}

window.removerTagManual = removerTagManual;
window.removerTagAutomatica = removerTagAutomatica;

// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. MENU HAMBÚRGUER MOBILE (Garantido na inicialização da página)
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isNowActive = !hamburger.classList.contains('active');
            hamburger.classList.toggle('active', isNowActive);
            navMenu.classList.toggle('active', isNowActive);
        });
    }

    // 2. Editor Quill
    const editorContainer = document.getElementById('editor-desc');
    if (editorContainer) {
        window.quillEditor = new Quill('#editor-desc', {
            theme: 'snow',
            placeholder: 'Escreva a descrição detalhada do produto aqui...'
        });

        window.quillEditor.on('text-change', () => {
            atualizarPreviewTagsAutomaticas();
        });
    }

    // 3. Autenticação Supabase
    const supabase = await obterClienteSupabase();
    if (!supabase) {
        alert('Não foi possível inicializar a autenticação. Recarregue a página.');
        window.location.replace('/auth/login');
        return;
    }

    const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
    if (erroSessao || !user) {
        window.location.replace('/auth/login');
        return;
    }

    const { data: perfil, error: erroPerfil } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (erroPerfil || perfil?.role !== 'admin') {
        await supabase.auth.signOut();
        alert('Acesso negado: usuário não é administrador.');
        window.location.replace('/auth/login');
        return;
    }

    // 4. Drag & Drop no DropZone
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('prod-images-file');

    if (dropZone && fileInput) {
        if (typeof Sortable !== 'undefined') {
            new Sortable(dropZone, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                filter: '.add-more-card',
                onEnd: function (evt) {
                    const itemMovido = arrayArquivosImagens.splice(evt.oldIndex, 1)[0];
                    arrayArquivosImagens.splice(evt.newIndex, 0, itemMovido);
                    renderizarPreviews(); 
                },
            });
        }

        dropZone.addEventListener('click', (e) => {
            if (
                e.target === dropZone || 
                e.target.tagName === 'SPAN' || 
                e.target.tagName === 'A' || 
                e.target.classList.contains('add-more-card') ||
                e.target.textContent === '+'
            ) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            dropZone.innerHTML = `<span style="color: #00926b; font-weight: bold; width: 100%; text-align: center;">Comprimindo imagens...</span>`;
            
            for (const file of files) {
                const compressedFile = await comprimirImagem(file);
                const previewUrl = URL.createObjectURL(compressedFile);
                
                arrayArquivosImagens.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file: compressedFile,
                    previewUrl: previewUrl
                });
            }
            
            fileInput.value = ''; 
            renderizarPreviews();
        });
    }

    // 5. Handlers do Construtor de Especificações
    const keyInput = document.getElementById('spec-key-input');
    const valInput = document.getElementById('spec-val-input');
    const btnAddSpec = document.getElementById('btn-add-spec');

    if (btnAddSpec) {
        btnAddSpec.addEventListener('click', adicionarEspecificacao);
    }

    if (keyInput) {
        keyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                valInput?.focus();
            }
        });
    }

    if (valInput) {
        valInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                adicionarEspecificacao();
            }
        });
    }

    // 6. Handlers de Tags Manuais e Ouvintes
    const inputManual = document.getElementById('input-tag-manual');
    const btnAddManual = document.getElementById('btn-add-tag-manual');

    if (inputManual) {
        inputManual.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                adicionarTagManual(inputManual.value);
                inputManual.value = '';
            }
        });
    }

    if (btnAddManual && inputManual) {
        btnAddManual.addEventListener('click', () => {
            adicionarTagManual(inputManual.value);
            inputManual.value = '';
        });
    }

    document.getElementById('prod-title')?.addEventListener('input', atualizarPreviewTagsAutomaticas);

    // Inicialização da interface
    renderizarEspecificacoes();
    renderizarTagsManuais();
    atualizarPreviewTagsAutomaticas();

    // 7. Envio do Formulário
    const formCadastro = document.getElementById('form-cadastro-produto');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('btn-salvar') || formCadastro.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Fazendo upload e Salvando...';
            }

            try {
                const categories = [...document.querySelectorAll('input[name="prod-category"]:checked')].map(input => input.value);
                const subcategories = [...document.querySelectorAll('input[name="prod-subcategory"]:checked')].map(input => input.value);

                if (!categories.length || !subcategories.length) {
                    throw new Error('Selecione pelo menos uma categoria e uma subcategoria.');
                }

                if (arrayArquivosImagens.length === 0) {
                    throw new Error('Você deve anexar pelo menos uma imagem.');
                }

                const specsJSON = obterSpecsJSON();

                if (!window.quillEditor || window.quillEditor.getText().trim().length === 0) {
                    throw new Error('A descrição não pode estar vazia.');
                }
                const descricaoHTML = window.quillEditor.root.innerHTML;
                const titulo = document.getElementById('prod-title').value;

                const tagsFinais = obterTagsFinais();

                const arrayPathsImagens = await uploadMultiplasImagens(arrayArquivosImagens, supabase);

                const produtoData = {
                    title: titulo,
                    category: categories.join(','),
                    subcategory: subcategories.join(','),
                    price: parseFloat(document.getElementById('prod-price').value),
                    stock: parseInt(document.getElementById('prod-stock').value, 10),
                    desc_text: descricaoHTML,
                    images: arrayPathsImagens,
                    tags: tagsFinais,
                    specs: specsJSON
                };

                const success = await cadastrarNovoProduto(produtoData);

                if (success) {
                    if (window.quillEditor) window.quillEditor.setContents([]);
                    arrayArquivosImagens = [];
                    renderizarPreviews();

                    manualTagsSet.clear();
                    removedAutoTagsSet.clear();
                    productSpecsList = [];

                    renderizarEspecificacoes();
                    renderizarTagsManuais();
                    atualizarPreviewTagsAutomaticas();
                }

            } catch (erro) {
                alert('⚠️ ' + erro.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Cadastrar Produto';
                }
            }
        });
    }
});

async function fazerLogout() {
    const supabase = await obterClienteSupabase();
    if (!supabase) {
        alert('⚠️ Sistema de autenticação não inicializado.');
        window.location.href = '/auth/login';
        return;
    }

    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('❌ Erro ao fazer logout: ' + error.message);
            return;
        }
        alert('✅ Logout realizado com sucesso!');
        window.location.href = '/auth/login';
    } catch (err) {
        console.error('Erro no logout:', err);
        alert('⚠️ Erro ao fazer logout, mas desconectando mesmo assim...');
        window.location.href = '/auth/login';
    }
}