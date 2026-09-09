// 1. Função que envia o produto para o Supabase
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

// 2. Event listener do formulário
document.addEventListener('DOMContentLoaded', async () => {
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

  const formCadastro = document.getElementById('form-cadastro-produto');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!window.supabaseClient) {
        alert('❌ Sistema de banco de dados não inicializado. Recarregue a página.');
        return;
      }

      const btn = document.getElementById('btn-salvar');
      btn.disabled = true;
      btn.textContent = '⏳ Salvando...';

      // Coleta e formata os dados da tela
      const tagsInput = document.getElementById('prod-tags').value;
      const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
      const categories = [...document.querySelectorAll('input[name="prod-category"]:checked')]
        .map(input => input.value);
      const subcategories = [...document.querySelectorAll('input[name="prod-subcategory"]:checked')]
        .map(input => input.value);

      if (!categories.length || !subcategories.length) {
        alert('Selecione pelo menos uma categoria e uma subcategoria.');
        btn.disabled = false;
        btn.textContent = '📤 Cadastrar Produto';
        return;
      }

      const produtoData = {
        title: document.getElementById('prod-title').value,
        category: categories.join(','),
        subcategory: subcategories.join(','),
        price: parseFloat(document.getElementById('prod-price').value),
        stock: parseInt(document.getElementById('prod-stock').value, 10),
        desc_text: document.getElementById('prod-desc').value,
        images: [document.getElementById('prod-image').value],
        tags: tagsArray,
        specs: {}
      };

      // Insere na tabela 'produtos'
      const success = await cadastrarNovoProduto(produtoData);

      btn.disabled = false;
      btn.textContent = '📤 Cadastrar Produto';
    });
  }
});

// 3. Função de Logout
async function fazerLogout() {
  const supabase = await obterClienteSupabase();
  if (!supabase) {
    alert('⚠️ Sistema de autenticação não inicializado.');
    // Mesmo assim, redireciona para login
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
