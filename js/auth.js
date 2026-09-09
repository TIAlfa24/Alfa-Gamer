async function obterSupabase() {
  if (window.supabaseClient?.auth) return window.supabaseClient;
  return typeof window.inicializarSupabase === 'function'
    ? await window.inicializarSupabase()
    : null;
}

async function loginMestre(email, senha) {
  const supabase = await obterSupabase();

  if (!supabase) {
    alert('Sistema de autenticação não inicializado.');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha
  });

  if (error || !data?.user) {
    console.error('Erro no login:', error);
    alert(`Erro ao entrar: ${error?.message || 'credenciais inválidas'}`);
    return;
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (erroPerfil) {
    console.error('Erro ao consultar perfil:', erroPerfil);
    await supabase.auth.signOut();
    alert('Erro ao verificar permissões.');
    return;
  }

  if (perfil?.role !== 'admin') {
    await supabase.auth.signOut();
    alert('Acesso negado: usuário não é administrador.');
    return;
  }

  window.location.replace('/admin');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastro');

  if (!form) {
    console.error('Formulário #formCadastro não encontrado.');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const email = document.getElementById('cpf')?.value;
    const senha = document.getElementById('senhaUsuario')?.value;
    const botao = document.getElementById('btnEnviar');

    if (!email || !senha) {
      alert('Preencha email e senha.');
      return;
    }

    if (botao) botao.disabled = true;

    try {
      await loginMestre(email, senha);
    } finally {
      if (botao) botao.disabled = false;
    }
  });
});
