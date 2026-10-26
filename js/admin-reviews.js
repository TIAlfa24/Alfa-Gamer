// ==========================================
// MODERAÇÃO DE AVALIAÇÕES — PAINEL ADMIN
// ==========================================

async function obterClienteSupabase() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    return typeof window.inicializarSupabase === 'function'
        ? await window.inicializarSupabase()
        : null;
}

const REVIEW_STATUS_LABEL = {
    em_analise: 'Em análise',
    postada:    'Postada',
    rejeitada:  'Rejeitada'
};

const PLACEHOLDER_IMAGE = '/images/products/placeholder.png';

let supabaseAdmin = null;
let adminUser = null;
let cacheReviews = [];          // todas as reviews carregadas (do status selecionado)
let filtroAtual = 'em_analise'; // aba ativa
let contadores = { em_analise: 0, postada: 0, rejeitada: 0 };

// ==========================================
// HELPERS
// ==========================================
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function estrelas(n) {
    const v = Math.max(0, Math.min(5, Number(n) || 0));
    return '★'.repeat(v) + '☆'.repeat(5 - v);
}

function formatarData(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return ''; }
}

function primeiraImagem(produto) {
    if (!produto) return PLACEHOLDER_IMAGE;
    if (Array.isArray(produto.images) && produto.images.length) return produto.images[0];
    if (typeof produto.images === 'string') return produto.images;
    return PLACEHOLDER_IMAGE;
}

// ==========================================
// CARREGAR AVALIAÇÕES
// ==========================================
async function carregarAvaliacoes() {
    const container = document.getElementById('reviews-admin-list');
    if (!container) return;
    container.innerHTML = '<div class="reviews-admin-loading">Carregando avaliações...</div>';

    try {
        let query = supabaseAdmin
            .from('avaliacoes')
            .select('id, user_name, comment, image_paths, rating, created_at, posted_at, moderated_by, status, product_id, produtos(id, title, images)')
            .order('created_at', { ascending: false });

        if (filtroAtual !== 'todas') {
            query = query.eq('status', filtroAtual);
        }

        const { data, error } = await query;
        if (error) throw error;

        cacheReviews = data || [];
        renderizarLista();
    } catch (err) {
        console.error('Erro ao carregar avaliações:', err);
        container.innerHTML = `<div class="reviews-admin-empty">Não foi possível carregar as avaliações: ${escapeHtml(err.message || 'erro desconhecido')}.</div>`;
    }
}

async function carregarContadores() {
    try {
        const statuses = ['em_analise', 'postada', 'rejeitada'];
        const resultados = await Promise.all(statuses.map(s =>
            supabaseAdmin
                .from('avaliacoes')
                .select('id', { count: 'exact', head: true })
                .eq('status', s)
        ));

        statuses.forEach((s, i) => {
            contadores[s] = resultados[i].count || 0;
        });

        document.getElementById('kpi-pending')?.replaceChildren(document.createTextNode(String(contadores.em_analise)));
        document.getElementById('kpi-posted')?.replaceChildren(document.createTextNode(String(contadores.postada)));
        document.getElementById('kpi-rejected')?.replaceChildren(document.createTextNode(String(contadores.rejeitada)));

        const tp = document.getElementById('tab-count-pending');
        const td = document.getElementById('tab-count-posted');
        const tr = document.getElementById('tab-count-rejected');
        if (tp) tp.textContent = contadores.em_analise;
        if (td) td.textContent = contadores.postada;
        if (tr) tr.textContent = contadores.rejeitada;
    } catch (err) {
        console.warn('Erro ao carregar contadores:', err);
    }
}

// ==========================================
// RENDERIZAR LISTA
// ==========================================
function renderizarLista() {
    const container = document.getElementById('reviews-admin-list');
    if (!container) return;
    container.replaceChildren();

    if (!cacheReviews.length) {
        const empty = document.createElement('div');
        empty.className = 'reviews-admin-empty';
        empty.textContent = filtroAtual === 'em_analise'
            ? 'Nenhuma avaliação aguardando moderação.'
            : 'Nenhuma avaliação encontrada neste filtro.';
        container.appendChild(empty);
        return;
    }

    cacheReviews.forEach(review => container.appendChild(criarCardReview(review)));
}

function criarCardReview(review) {
    const produto = review.produtos || {};
    const card = document.createElement('article');
    card.className = 'review-card';
    card.dataset.id = review.id;

    // --- Produto ---
    const prodDiv = document.createElement('div');
    prodDiv.className = 'review-product';
    const img = document.createElement('img');
    img.src = primeiraImagem(produto);
    img.alt = produto.title || '';
    img.loading = 'lazy';
    img.onerror = () => { img.src = PLACEHOLDER_IMAGE; };
    const link = document.createElement('a');
    link.href = `/?id=${review.product_id}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = produto.title || `Produto #${review.product_id}`;
    prodDiv.append(img, link);

    // --- Corpo ---
    const body = document.createElement('div');
    body.className = 'review-body';

    const head = document.createElement('div');
    head.className = 'review-head';

    const name = document.createElement('strong');
    name.textContent = review.user_name || 'Anônimo';

    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.setAttribute('aria-label', `${review.rating} de 5 estrelas`);
    stars.textContent = estrelas(review.rating);

    const badge = document.createElement('span');
    badge.className = `review-status-badge ${review.status}`;
    badge.textContent = REVIEW_STATUS_LABEL[review.status] || review.status;

    const time = document.createElement('time');
    time.dateTime = review.created_at || '';
    time.textContent = formatarData(review.posted_at || review.created_at);

    head.append(name, stars, badge, time);

    const comment = document.createElement('p');
    comment.className = 'review-comment';
    comment.textContent = review.comment || '';

    body.append(head, comment);

    // Imagens anexadas
    const imgs = Array.isArray(review.image_paths) ? review.image_paths.filter(Boolean) : [];
    if (imgs.length) {
        const gallery = document.createElement('div');
        gallery.className = 'review-images';
        imgs.forEach((src, i) => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.alt = `Imagem ${i + 1} da avaliação`;
            thumb.loading = 'lazy';
            thumb.addEventListener('click', () => window.open(src, '_blank', 'noopener'));
            gallery.appendChild(thumb);
        });
        body.appendChild(gallery);
    }

    // Info de moderação (se houver)
    if (review.moderated_by) {
        const info = document.createElement('p');
        info.className = 'review-moderated-info';
        info.textContent = `Moderado por ${review.moderated_by}` +
            (review.posted_at ? ` em ${formatarData(review.posted_at)}` : '');
        body.appendChild(info);
    }

    // --- Ações ---
    const actions = document.createElement('div');
    actions.className = 'review-actions';

    if (review.status !== 'postada') {
        const approve = document.createElement('button');
        approve.type = 'button';
        approve.className = 'btn-approve';
        approve.textContent = '✓ Aprovar';
        approve.addEventListener('click', () => moderar(review, 'postada', approve));
        actions.appendChild(approve);
    }

    if (review.status !== 'rejeitada') {
        const reject = document.createElement('button');
        reject.type = 'button';
        reject.className = 'btn-reject';
        reject.textContent = '✕ Rejeitar';
        reject.addEventListener('click', () => moderar(review, 'rejeitada', reject));
        actions.appendChild(reject);
    }

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-delete';
    remove.textContent = 'Excluir';
    remove.addEventListener('click', () => excluirReview(review, remove));
    actions.appendChild(remove);

    card.append(prodDiv, body, actions);
    return card;
}

// ==========================================
// AÇÕES
// ==========================================
async function moderar(review, novoStatus, botao) {
    if (botao) { botao.disabled = true; botao.textContent = 'Processando...'; }

    try {
        const { error } = await supabaseAdmin.rpc('moderar_avaliacao', {
            avaliacao_id: review.id,
            novo_status: novoStatus
        });
        if (error) throw error;

        // Atualiza em memória
        review.status = novoStatus;
        if (novoStatus === 'postada')   review.posted_at = new Date().toISOString();
        if (novoStatus === 'rejeitada') review.posted_at = null;
        review.moderated_by = adminUser?.email || null;

        // Se mudou de status, remove da lista atual (a não ser que filtro seja 'todas')
        if (filtroAtual !== 'todas' && review.status !== filtroAtual) {
            cacheReviews = cacheReviews.filter(r => r.id !== review.id);
        }
        renderizarLista();
        carregarContadores();
    } catch (err) {
        console.error('Erro ao moderar:', err);
        alert(`Não foi possível moderar: ${err.message || 'erro desconhecido'}`);
        if (botao) {
            botao.disabled = false;
            botao.textContent = novoStatus === 'postada' ? '✓ Aprovar' : '✕ Rejeitar';
        }
    }
}

async function excluirReview(review, botao) {
    const confirmado = window.confirm(
        `Tem certeza que deseja EXCLUIR permanentemente a avaliação de "${review.user_name}"?\n\nEssa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    if (botao) { botao.disabled = true; botao.textContent = 'Excluindo...'; }

    try {
        const { error } = await supabaseAdmin
            .from('avaliacoes')
            .delete()
            .eq('id', review.id);
        if (error) throw error;

        cacheReviews = cacheReviews.filter(r => r.id !== review.id);
        renderizarLista();
        carregarContadores();
    } catch (err) {
        console.error('Erro ao excluir:', err);
        alert(`Não foi possível excluir: ${err.message || 'erro desconhecido'}`);
        if (botao) { botao.disabled = false; botao.textContent = 'Excluir'; }
    }
}

// ==========================================
// FILTRO DE ABAS
// ==========================================
function configurarFiltros() {
    document.querySelectorAll('.review-filter-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.review-filter-tabs .tab').forEach(t => {
                t.classList.remove('is-active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('is-active');
            tab.setAttribute('aria-selected', 'true');
            filtroAtual = tab.dataset.status || 'em_analise';
            carregarAvaliacoes();
        });
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    supabaseAdmin = await obterClienteSupabase();
    if (!supabaseAdmin) {
        document.body.style.display = 'block';
        document.getElementById('reviews-admin-list').innerHTML =
            '<div class="reviews-admin-empty">Não foi possível conectar ao banco de dados.</div>';
        return;
    }

    // Auth
    const { data: { user }, error: erroSessao } = await supabaseAdmin.auth.getUser();
    if (erroSessao || !user) {
        window.location.replace('/auth/login');
        return;
    }

    const { data: perfil, error: erroPerfil } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).maybeSingle();

    if (erroPerfil || perfil?.role !== 'admin') {
        await supabaseAdmin.auth.signOut();
        alert('Acesso negado: usuário não é administrador.');
        window.location.replace('/auth/login');
        return;
    }

    adminUser = user;
    document.body.style.display = 'block';

    configurarFiltros();
    await carregarContadores();
    await carregarAvaliacoes();
});