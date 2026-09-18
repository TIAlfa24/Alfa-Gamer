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

// Estruturador de Especificações
function formatarSpecs(textoSpecs) {
  const specs = {};
  if (!textoSpecs) return specs;

  textoSpecs.split('\n').forEach(linha => {
    let texto = linha.trim();
    if (!texto) return;

    let partes = texto.includes(':') ? texto.split(':') : [texto, ''];
    let chave = partes[0].trim();
    let valor = partes.slice(1).join(':').trim();

    if (chave) specs[chave] = valor;
  });
  return specs;
}

// Gerador de Tags
function gerarTagsAutomaticas(titulo, descTexto, specsObj) {
  const valoresSpecs = Object.values(specsObj).join(' ');
  const descLimpa = descTexto.replace(/<[^>]*>?/gm, ' ');
  const textoCompleto = `${titulo} ${descLimpa} ${valoresSpecs}`.toLowerCase();

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

    // 1. Faz o upload para o bucket
    const { error } = await supabase.storage
      .from('produtos')
      .upload(fileName, file);

    if (error) throw error;

    // 2. Pede para o Supabase gerar o Link Público real daquela imagem
    const { data: publicUrlData } = supabase.storage
      .from('produtos')
      .getPublicUrl(fileName);

    // 3. Salva a URL completa (https://...) no banco de dados em vez do caminho local
    urls.push(publicUrlData.publicUrl);
  }

  return urls;
}

function renderizarPreviews() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('prod-images-file');
  if (!dropZone) return;

  // Limpa o conteúdo atual
  dropZone.innerHTML = '';

  if (arrayArquivosImagens.length === 0) {
    // Estado vazio: exibe o texto padrão
    const spanText = document.createElement('span');
    spanText.style.color = '#555';
    spanText.style.pointerEvents = 'none';
    spanText.innerHTML = '<a>Clique aqui ou arraste as imagens para anexar</a>';
    dropZone.appendChild(spanText);
  } else {
    // Estado com imagens: renderiza cada card de preview
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

    // Adiciona o card de "+" estilizado
    const addMoreCard = document.createElement('div');
    addMoreCard.className = 'preview-card add-more-card';
    addMoreCard.style.cssText = 'display: flex; align-items: center; justify-content: center; border: 2px dashed #aaa; background: #fff; font-size: 32px; color: #777; cursor: pointer; width: 80px; height: 80px; border-radius: 6px;';
    addMoreCard.title = 'Adicionar mais imagens';
    addMoreCard.innerHTML = '+';

    dropZone.appendChild(addMoreCard);
  }

  // Mantém o input file dentro do drop-zone
  if (fileInput) {
    dropZone.appendChild(fileInput);
  }
}

window.removerImagem = function (id) {
  arrayArquivosImagens = arrayArquivosImagens.filter(img => img.id !== id);
  renderizarPreviews();
};

// ==========================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Menu do Usuário
  const userDrawer = document.getElementById('userDrawer');
  const openUserDrawer = document.getElementById('openUserDrawer');
  const closeUserDrawer = document.getElementById('closeUserDrawer');

  const setUserDrawerOpen = (isOpen) => {
    userDrawer?.classList.toggle('open', isOpen);
    userDrawer?.setAttribute('aria-hidden', String(!isOpen));
  };

  openUserDrawer?.addEventListener('click', (event) => {
    event.stopPropagation();
    setUserDrawerOpen(!userDrawer?.classList.contains('open'));
  });
  closeUserDrawer?.addEventListener('click', () => setUserDrawerOpen(false));
  userDrawer?.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', () => setUserDrawerOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setUserDrawerOpen(false);
  });

  // 2. Editor Quill
  let quill;
  const editorContainer = document.getElementById('editor-desc');
  if (editorContainer) {
    quill = new Quill('#editor-desc', {
      theme: 'snow',
      placeholder: 'Escreva a descrição detalhada do produto aqui...'
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

  // 4. Lógica de Drag & Drop, Sortable e Compressão de Imagens no DropZone
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('prod-images-file');

  if (dropZone && fileInput) {
    // Inicializa o Sortable diretamente no drop-zone
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

    dropZone.addEventListener('click', (e) => {
      // Clicou no botão "+"
      if (e.target.closest('.add-more-card')) {
        fileInput.click();
        return;
      }

      // Clicou no fundo ou no texto inicial
      if (
        e.target === dropZone ||
        e.target.tagName === 'SPAN' ||
        e.target.tagName === 'A'
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

  // 5. Lógica do Formulário
  const formCadastro = document.getElementById('form-cadastro-produto');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = document.getElementById('btn-salvar');
      btn.disabled = true;
      btn.textContent = '⏳ Fazendo upload e Salvando...';

      try {
        const categories = [...document.querySelectorAll('input[name="prod-category"]:checked')].map(input => input.value);
        const subcategories = [...document.querySelectorAll('input[name="prod-subcategory"]:checked')].map(input => input.value);

        if (!categories.length || !subcategories.length) {
          throw new Error('Selecione pelo menos uma categoria e uma subcategoria.');
        }

        // Valida as imagens
        if (arrayArquivosImagens.length === 0) {
          throw new Error('Você deve anexar pelo menos uma imagem.');
        }

        // Processa Specs
        const rawSpecsInput = document.getElementById('prod-specs');
        const specsJSON = formatarSpecs(rawSpecsInput ? rawSpecsInput.value : '');

        // Processa Descrição
        if (!quill || quill.getText().trim().length === 0) {
          throw new Error('A descrição não pode estar vazia.');
        }
        const descricaoHTML = quill.root.innerHTML;

        // Processa Tags
        const titulo = document.getElementById('prod-title').value;
        const manualTagsInput = document.getElementById('prod-tags');
        const manualTags = (manualTagsInput && manualTagsInput.value) ? manualTagsInput.value.split(',').map(t => t.trim().toLowerCase()) : [];
        const autoTags = gerarTagsAutomaticas(titulo, descricaoHTML, specsJSON);
        const tagsFinais = [...new Set([...manualTags, ...autoTags])].filter(t => t);

        // FAZ O UPLOAD E PEGA OS PATHS NA ORDEM CORRETA
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
          if (quill) quill.setContents([]);
          arrayArquivosImagens = []; // Limpa as fotos da tela
          renderizarPreviews();
        }

      } catch (erro) {
        alert('⚠️ ' + erro.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Cadastrar Produto';
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