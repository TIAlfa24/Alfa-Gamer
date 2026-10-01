// ==========================================
// 1. SUPABASE CLIENTE & HELPERS DE AUTENTICAÇÃO
// ==========================================
async function obterClienteSupabase() {
    if (window.supabaseClient?.auth) return window.supabaseClient;
    return typeof window.inicializarSupabase === 'function'
        ? await window.inicializarSupabase()
        : null;
}

let trafficChartInstance = null;
let deviceChartInstance = null;
let quotesChartInstance = null;

// ==========================================
// 2. FILTRO DE DATAS
// ==========================================
function obterDataInicioFiltro(periodo) {
    const agora = new Date();
    if (periodo === 'hoje') {
        agora.setHours(0, 0, 0, 0);
        return agora.toISOString();
    } else if (periodo === '30dias') {
        agora.setDate(agora.getDate() - 30);
        return agora.toISOString();
    } else {
        agora.setDate(agora.getDate() - 7);
        return agora.toISOString();
    }
}

// ==========================================
// 3. CARREGAMENTO PRINCIPAL DO DASHBOARD
// ==========================================
async function carregarDashboard(periodo = '7dias') {
    const supabase = await obterClienteSupabase();
    if (!supabase) return;

    const dataInicio = obterDataInicioFiltro(periodo);

    // A. PRODUTOS NO CATÁLOGO (COUNT REAL DA TABELA 'produtos')
    const { count: totalCatCount } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true });

    const elTotalProducts = document.getElementById('kpi-total-products');
    if (elTotalProducts) elTotalProducts.textContent = totalCatCount || 0;

    // B. BUSCA EVENTOS NO ANALYTICS NO PERÍODO
    const { data: analyticsData, error: errAnalytics } = await supabase
        .from('analytics')
        .select('id, event_type, page_path, produto_id, session_id, created_at, produtos(id, title, images, price)')
        .gte('created_at', dataInicio);

    if (errAnalytics) {
        console.error('Erro ao buscar analytics:', errAnalytics);
        return;
    }

    const eventos = analyticsData || [];

    // C. VISITANTES ÚNICOS
    const sessoesUnicas = new Set(eventos.map(e => e.session_id).filter(Boolean)).size;
    const elVisitors = document.getElementById('kpi-visitors');
    if (elVisitors) elVisitors.textContent = sessoesUnicas;

    // D. TOTAL DE COTAÇÕES (Eventos do tipo 'quote')
    const cotacoesEventos = eventos.filter(e => e.event_type === 'quote');
    const elQuotes = document.getElementById('kpi-quotes');
    if (elQuotes) elQuotes.textContent = cotacoesEventos.length;

    // E. PRODUTOS DESTAQUE
    renderizarTopProduto(eventos.filter(e => e.event_type === 'product_view'), 'top-viewed-container', 'visualizações');
    renderizarTopProduto(cotacoesEventos, 'top-quoted-container', 'cotações');

    // F. DESENHAR OS 3 GRÁFICOS
    renderizarGraficoTrafego(eventos);
    renderizarGraficoDispositivos(eventos);
    renderizarGraficoCotacoes(cotacoesEventos);
}

// ==========================================
// 4. RENDERIZAÇÃO DOS PRODUTOS DESTAQUE
// ==========================================
function renderizarTopProduto(listaEventos, containerId, sufixoTexto) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const validos = listaEventos.filter(e => e.produtos);

    if (validos.length === 0) {
        container.innerHTML = `<p style="font-size: 13px; color: #888; margin: 0; font-style: italic;">Nenhum dado registrado no período.</p>`;
        return;
    }

    const contagem = {};
    let campeao = null;
    let maxCount = 0;

    validos.forEach(e => {
        const p = e.produtos;
        if (!p) return;
        contagem[p.id] = contagem[p.id] || { produto: p, total: 0 };
        contagem[p.id].total += 1;

        if (contagem[p.id].total > maxCount) {
            maxCount = contagem[p.id].total;
            campeao = contagem[p.id];
        }
    });

    if (campeao) {
        const prod = campeao.produto;
        let imgSrc = '/images/products/placeholder.png';
        if (Array.isArray(prod.images) && prod.images.length > 0) {
            imgSrc = prod.images[0];
        }

        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${imgSrc}" alt="${prod.title}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; background: #f8f9fa; border: 1px solid #eee;" onerror="this.src='/images/products/placeholder.png'">
                <div>
                    <h4 style="margin: 0; font-size: 14px; color: #2c3e50;">${prod.title}</h4>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--primary, #00926b); font-weight: 700;">${campeao.total} ${sufixoTexto}</p>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `<p style="font-size: 13px; color: #888; margin: 0; font-style: italic;">Nenhum dado registrado no período.</p>`;
    }
}

// ==========================================
// 5. GRÁFICOS (CHART.JS)
// ==========================================

// GRÁFICO 1: FLUXO DE ACESSOS
function renderizarGraficoTrafego(eventos) {
    const canvas = document.getElementById('trafficChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const datas = {};
    eventos.forEach(e => {
        const d = new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        datas[d] = (datas[d] || 0) + 1;
    });

    const labels = Object.keys(datas);
    const dataValues = Object.values(datas);

    if (trafficChartInstance) trafficChartInstance.destroy();

    trafficChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                label: 'Acessos',
                data: dataValues.length ? dataValues : [0],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// GRÁFICO 2: DISPOSITIVOS
function renderizarGraficoDispositivos(eventos) {
    const canvas = document.getElementById('deviceChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    let mobile = 0;
    let desktop = 0;

    eventos.forEach(e => {
        if (e.page_path && e.page_path.includes('mobile')) {
            mobile++;
        } else {
            desktop++;
        }
    });

    if (deviceChartInstance) deviceChartInstance.destroy();

    deviceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Desktop', 'Mobile'],
            datasets: [{
                data: (mobile === 0 && desktop === 0) ? [1, 0] : [desktop, mobile],
                backgroundColor: ['#2c3e50', '#00926b']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// GRÁFICO 3: COTAÇÕES AO LONGO DO TEMPO
function renderizarGraficoCotacoes(cotacoesEventos) {
    const canvas = document.getElementById('quotesChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const datas = {};
    cotacoesEventos.forEach(e => {
        const d = new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        datas[d] = (datas[d] || 0) + 1;
    });

    const labels = Object.keys(datas);
    const dataValues = Object.values(datas);

    if (quotesChartInstance) quotesChartInstance.destroy();

    quotesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sem cotações'],
            datasets: [{
                label: 'Cotações',
                data: dataValues.length ? dataValues : [0],
                backgroundColor: '#00926b',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

window.atualizarPeriodoDashboard = function (periodo) {
    carregarDashboard(periodo);
};

// ==========================================
// 6. INICIALIZAÇÃO & AUTENTICAÇÃO DO ADMIN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Autenticação
    const supabase = await obterClienteSupabase();
    if (!supabase) {
        document.body.style.display = 'block';
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

    document.body.style.display = 'block';
    carregarDashboard('7dias');
});

// Inicialização do Editor Quill para a Descrição Detalhada
const editorContainer = document.getElementById('editor-desc');
if (editorContainer) {
    window.quillEditor = new Quill('#editor-desc', {
        theme: 'snow',
        placeholder: 'Escreva a descrição detalhada do produto aqui...'
    });

    window.quillEditor.on('text-change', () => {
        if (typeof atualizarPreviewTagsAutomaticas === 'function') {
            atualizarPreviewTagsAutomaticas();
        }
    });
}