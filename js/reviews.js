// ==========================================
// SISTEMA DE AVALIAÇÕES — GRÁFICO + LISTA + MODAL
// ==========================================
(function () {
    const STATE = {
        productId: null,
        reviews: [],
        activeFilter: null,   // null = todas | 1..5
        loaded: false,
        ghast: null,
        jaAvaliou: false
    };

    const STAR_COLOR = '#f1c40f';
    const STAR_EMPTY_COLOR = '#d9d9d9';
    const LOCAL_KEY = 'alfa:avaliacoes_enviadas';

    // ==========================================
    // INICIALIZAÇÃO E LIMPEZA DE LIXO
    // ==========================================

    function boot() {
        // Limpa chaves antigas que possam conflitar (opcional)
        try {
            const registro = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
            const novoRegistro = {};
            Object.keys(registro).forEach(key => {
                // Mantém apenas chaves no novo formato (contém 'alfa:avaliacao:')
                if (key.startsWith('alfa:avaliacao:')) {
                    novoRegistro[key] = registro[key];
                }
            });
            localStorage.setItem(LOCAL_KEY, JSON.stringify(novoRegistro));
        } catch (_) { /* ignora */ }

        configurarEstrelasFormulario();
        configurarFormulario();
        configurarFiltroBotao();
        document.getElementById('writeReviewBtn')
            ?.addEventListener('click', () => {
                if (STATE.jaAvaliou) return;
                abrirModal();
            });
    }

    // ------------------------------------------
    // TRADUÇÃO DE ERROS DO SUPABASE / POSTGRES
    // ------------------------------------------
    function traduzirErroAvaliacao(err) {
        const msg = String(err?.message || err?.error_description || err?.hint || '').toLowerCase();
        const code = String(err?.code || '');

        // Violação de Row-Level Security (bloqueio de envio por ghast não reconhecido,
        // envio de outro navegador/dispositivo, etc.)
        if (
            code === '42501' ||
            msg.includes('row-level security') ||
            msg.includes('row level security') ||
            msg.includes('violates row-level') ||
            msg.includes('new row violates') ||
            msg.includes('permission denied')
        ) {
            return 'Boa Tentativa';
        }

        // Duplicidade explícita (caso o backend use unique constraint)
        if (code === '23505' || msg.includes('duplicate key')) {
            return 'Você já avaliou este produto.';
        }

        // Fallback: mensagem genérica
        return err?.message || 'Não foi possível enviar a avaliação. Tente novamente.';
    }

    // ------------------------------------------
    // GHAST — identificação do usuário público
    // (NÃO usa supabase.auth)
    // ------------------------------------------
    function obterGhast() {
        // Delega para o sistema oficial de identidade persistente do global.js
        if (typeof window.obterUserToken === 'function') {
            try {
                const t = window.obterUserToken();
                if (t) return String(t);
            } catch (_) { /* ignora */ }
        }

        // Fallback: tenta as chaves antigas (para retrocompatibilidade)
        try {
            const keys = ['alfa_user_token_v1', 'ghast', 'GHAST', 'user_ghast'];
            for (let i = 0; i < keys.length; i++) {
                const v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
                if (v) return v;
            }
        } catch (_) { /* ignora */ }

        try {
            const m = document.cookie.match(/(?:^|;\s*)alfa_user_token_v1=([^;]+)/);
            if (m) return decodeURIComponent(m[1]);
        } catch (_) { /* ignora */ }

        return null;
    }

    // ------------------------------------------
    // REGISTRO LOCAL (fallback de deduplicação)
    // ------------------------------------------
    function lerRegistroLocal() {
        try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); }
        catch (_) { return {}; }
    }

    function chaveRegistro(ghast, productId) {
        // Usa uma chave única que combina o token do usuário e o ID do produto
        return `alfa:avaliacao:${productId}:${ghast || 'anonimo'}`;
    }

    function marcarAvaliacaoEnviada() {
        if (!STATE.productId) return;
        try {
            const produtoAtual = String(STATE.productId);
            const registro = lerRegistroLocal();
            const chave = chaveRegistro(STATE.ghast, produtoAtual);
            registro[chave] = Date.now();
            localStorage.setItem(LOCAL_KEY, JSON.stringify(registro));
            console.log(`💾 [marcarAvaliacaoEnviada] Avaliação do produto ${produtoAtual} registrada localmente.`);
        } catch (_) { /* ignora */ }
    }

    function limparRegistroLocal() {
        if (!STATE.productId || !STATE.ghast) return;
        try {
            const registro = lerRegistroLocal();
            const chave = chaveRegistro(STATE.ghast, STATE.productId);
            if (registro[chave]) {
                delete registro[chave];
                localStorage.setItem(LOCAL_KEY, JSON.stringify(registro));
                console.log(`🧹 [limparRegistroLocal] Registro local do produto ${STATE.productId} removido (avaliação não está mais ativa).`);
            }
        } catch (_) { /* ignora */ }
    }

    async function verificarSeJaAvaliou() {
    if (!STATE.productId || !STATE.ghast) {
        console.log('🔍 [verificarSeJaAvaliou] Sem productId ou GHAST. Retornando false.');
        return false;
    }

    const produtoAtual = String(STATE.productId);
    console.log(`🔍 [verificarSeJaAvaliou] Verificando produto: ${produtoAtual} | GHAST: ${STATE.ghast}`);

    const supabaseClient = window.supabaseClient;
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('avaliacoes')
                .select('id, status')
                .eq('product_id', produtoAtual)
                .eq('user_token', STATE.ghast)
                // Só considera se a avaliação estiver ATIVA (em análise ou publicada).
                // Se foi rejeitada, o registro é ignorado.
                .in('status', ['em_analise', 'postada'])
                .maybeSingle();

            if (error) {
                console.warn('⚠️ [verificarSeJaAvaliou] Erro no Supabase:', error);
                // Cai no fallback local
            } else if (data) {
                console.log('🔍 [verificarSeJaAvaliou] Supabase encontrou avaliação ativa:', data);
                return true;
            } else {
                // Supabase respondeu e NÃO há avaliação ativa.
                // Isso significa que foi rejeitada ou excluída.
                // Limpa o cache local para destravar o botão.
                console.log('🔍 [verificarSeJaAvaliou] Supabase não encontrou avaliação ativa. Limpando cache local.');
                limparRegistroLocal();
                return false;
            }
        } catch (err) {
            console.warn('⚠️ [verificarSeJaAvaliou] Exceção no Supabase:', err);
            // Cai no fallback local
        }
    } else {
        console.log('🔍 [verificarSeJaAvaliou] supabaseClient não disponível. Usando fallback local.');
    }

    // Fallback local (só se Supabase estiver indisponível)
    const registro = lerRegistroLocal();
    const chave = chaveRegistro(STATE.ghast, produtoAtual);
    const jaAvaliouLocal = Boolean(registro[chave]);
    console.log(`🔍 [verificarSeJaAvaliou] Fallback local. Chave: ${chave} | Resultado: ${jaAvaliouLocal}`);
    
    return jaAvaliouLocal;
}
    // ------------------------------------------
    // BOTÃO DE AVALIAR — estado
    // ------------------------------------------
    function atualizarBotaoAvaliar() {
        const btn = document.getElementById('writeReviewBtn');
        if (!btn) {
            console.warn('⚠️ [atualizarBotaoAvaliar] Botão #writeReviewBtn não encontrado!');
            return;
        }

        console.log('🔄 [atualizarBotaoAvaliar] Atualizando botão. Já avaliou?', STATE.jaAvaliou);

        if (STATE.jaAvaliou) {
            btn.textContent = 'Você já avaliou este produto';
            btn.disabled = true;
            btn.classList.add('is-reviewed');
            btn.setAttribute('aria-disabled', 'true');
            btn.title = 'Você já enviou uma avaliação para este produto.';
            btn.hidden = true; // Esconde o botão
            console.log('🔄 [atualizarBotaoAvaliar] Botão escondido (usuário já avaliou).');
        } else {
            btn.textContent = 'Escrever uma avaliação';
            btn.disabled = false;
            btn.classList.remove('is-reviewed');
            btn.removeAttribute('aria-disabled');
            btn.removeAttribute('title');
            btn.hidden = false; // Mostra o botão
            console.log('🔄 [atualizarBotaoAvaliar] Botão visível.');
        }
    }
    // ------------------------------------------
    // UTIL
    // ------------------------------------------
    function calcularDistribuicao(reviews) {
        return [5, 4, 3, 2, 1].map(stars => ({
            stars,
            value: reviews.filter(r => Number(r.rating) === stars).length,
            color: STAR_COLOR
        }));
    }

    function estrelasVisuais(nota) {
        const n = Math.max(0, Math.min(5, Number(nota) || 0));
        return '★'.repeat(n) + '☆'.repeat(5 - n);
    }

    function formatarData(iso) {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } catch (_) { return ''; }
    }

    // ------------------------------------------
    // VISIBILIDADE DA ÁREA DE AVALIAÇÕES
    // ------------------------------------------
    function updateReviewsVisibility(reviews) {
        const list = document.getElementById('reviewsList');
        const title = document.getElementById('reviewsListTitle');
        const clearBtn = document.getElementById('clearReviewFilter');

        console.log('👁️ [updateReviewsVisibility] Chamado. Lista existe?', !!list, '| Título existe?', !!title);

        if (!list || !title) {
            console.warn('⚠️ [updateReviewsVisibility] Elementos essenciais não encontrados! Abortando.');
            return;
        }

        const total = Array.isArray(reviews) ? reviews.length : 0;
        const totalPublicadas = STATE.reviews.length;
        const filtro = STATE.activeFilter;

        title.textContent = filtro
            ? `Avaliações com ${filtro} ${filtro === 1 ? 'estrela' : 'estrelas'} (${total})`
            : `Todas as avaliações (${totalPublicadas})`;

        if (clearBtn) clearBtn.hidden = !filtro;

        // A LISTA NUNCA DEVE SER ESCONDIDA! Isso estava fazendo o botão sumir.
        list.hidden = false;
        console.log('👁️ [updateReviewsVisibility] Lista forçada a ficar visível. Total de avaliações:', total);
    }
    // ------------------------------------------
    // GRÁFICO DE DISTRIBUIÇÃO
    // ------------------------------------------
    function renderizarDistribuicaoAvaliacoes(data) {
        const chart = document.getElementById('ratingDistributionChart');
        const legend = document.getElementById('ratingDistributionLegend');
        const title = document.getElementById('ratingChartTitle');
        const description = document.getElementById('ratingChartDescription');
        if (!chart || !legend || !title || !description) return;

        const centerX = 200, centerY = 200, outerRadius = 175, innerRadius = 75, totalSegments = 10;
        const totalReviews = data.reduce((sum, item) => sum + item.value, 0);
        const average = totalReviews > 0
            ? data.reduce((sum, item) => sum + item.stars * item.value, 0) / totalReviews
            : 0;

        const starPoints = Array.from({ length: totalSegments }, (_, index) => {
            const angle = (Math.PI * 2 * index) / totalSegments - Math.PI / 2;
            const radius = index % 2 === 0 ? outerRadius : outerRadius * 0.45;
            return {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            };
        });

        chart.replaceChildren(title, description);
        chart.classList.toggle('has-active-filter', Boolean(STATE.activeFilter));
        legend.replaceChildren();

        description.textContent = totalReviews > 0
            ? `${totalReviews} avaliações. Média de ${average.toFixed(1).replace('.', ',')} estrelas.`
            : 'Este produto ainda não possui avaliações publicadas.';

        data.forEach((item, index) => {
            const previousValley = (index * 2 - 1 + totalSegments) % totalSegments;
            const tip = (index * 2) % totalSegments;
            const nextValley = (index * 2 + 1) % totalSegments;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const firstPoint = starPoints[previousValley];
            const tipPoint = starPoints[tip];
            const lastPoint = starPoints[nextValley];

            path.setAttribute('d',
                `M ${centerX} ${centerY} L ${firstPoint.x} ${firstPoint.y} L ${tipPoint.x} ${tipPoint.y} L ${lastPoint.x} ${lastPoint.y} Z`);
            path.classList.add('slice');
            if (item.value > 0) {
                path.classList.add('has-reviews');
                path.style.setProperty('--slice-color', item.color);
            }
            if (STATE.activeFilter === item.stars) path.classList.add('is-active');

            path.setAttribute('role', 'button');
            path.setAttribute('tabindex', '0');
            path.setAttribute('aria-label',
                `${item.stars} estrelas: ${item.value} avaliações. Clique para filtrar.`);
            path.dataset.stars = String(item.stars);
            chart.appendChild(path);

            const legendItem = document.createElement('button');
            legendItem.type = 'button';
            legendItem.className = 'rating-distribution-legend-item';
            if (STATE.activeFilter === item.stars) legendItem.classList.add('is-active');
            legendItem.dataset.stars = String(item.stars);

            const label = document.createElement('div');
            label.className = 'rating-distribution-legend-label';
            const color = document.createElement('span');
            color.className = 'rating-distribution-legend-color';
            color.style.backgroundColor = item.value > 0 ? item.color : STAR_EMPTY_COLOR;
            const stars = document.createElement('span');
            stars.textContent = `${item.stars} ${item.stars === 1 ? 'estrela' : 'estrelas'}`;
            const count = document.createElement('span');
            count.className = 'rating-distribution-legend-count';
            count.textContent = `${item.value} ${item.value === 1 ? 'avaliação' : 'avaliações'}`;

            label.append(color, stars);
            legendItem.append(label, count);
            legend.appendChild(legendItem);
        });

        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        outline.setAttribute('points', starPoints.map(p => `${p.x},${p.y}`).join(' '));
        outline.classList.add('star-outline');
        outline.setAttribute('aria-hidden', 'true');
        outline.style.pointerEvents = 'none';
        chart.appendChild(outline);

        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', String(centerX));
        center.setAttribute('cy', String(centerY));
        center.setAttribute('r', String(innerRadius));
        center.classList.add('chart-center');
        chart.appendChild(center);

        const averageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        averageText.setAttribute('x', String(centerX));
        averageText.setAttribute('y', String(centerY - 8));
        averageText.setAttribute('text-anchor', 'middle');
        averageText.classList.add('chart-average');
        averageText.textContent = totalReviews > 0 ? average.toFixed(1).replace('.', ',') : '—';
        chart.appendChild(averageText);

        const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        totalText.setAttribute('x', String(centerX));
        totalText.setAttribute('y', String(centerY + 20));
        totalText.setAttribute('text-anchor', 'middle');
        totalText.classList.add('chart-total');
        totalText.textContent = `${totalReviews} ${totalReviews === 1 ? 'avaliação' : 'avaliações'}`;
        chart.appendChild(totalText);

        // Eventos do gráfico
        chart.querySelectorAll('path.slice').forEach(p => {
            p.addEventListener('mousedown', e => e.preventDefault());
            p.addEventListener('click', e => {
                e.preventDefault();
                aplicarFiltro(Number(p.dataset.stars));
            });
            p.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    aplicarFiltro(Number(p.dataset.stars));
                }
            });
        });
        legend.querySelectorAll('.rating-distribution-legend-item').forEach(btn => {
            btn.addEventListener('click', () => aplicarFiltro(Number(btn.dataset.stars)));
        });
    }

    // ------------------------------------------
    // LISTA DE AVALIAÇÕES
    // ------------------------------------------
    function renderizarListaAvaliacoes() {
        const container = document.getElementById('reviewsList');
        if (!container) {
            console.warn('⚠️ [renderizarListaAvaliacoes] #reviewsList não encontrado!');
            return;
        }

        const filtro = STATE.activeFilter;
        const lista = filtro
            ? STATE.reviews.filter(r => Number(r.rating) === filtro)
            : STATE.reviews;

        console.log('📝 [renderizarListaAvaliacoes] Renderizando. Total de reviews:', STATE.reviews.length, '| Reviews filtradas:', lista.length);

        updateReviewsVisibility(lista);

        // 1. Preservar o botão antes de limpar a lista
        const btn = document.getElementById('writeReviewBtn');
        const footerNote = document.querySelector('.reviews-footer-note');

        if (btn && btn.parentElement === container) {
            // Remove o botão do container, mas mantém a referência
            btn.remove();
            console.log('📝 [renderizarListaAvaliacoes] Botão removido do container para preservação.');
        }

        // 2. Limpar a lista
        container.replaceChildren();

        // 3. Se não houver avaliações, reinserir o botão e a mensagem
        if (lista.length === 0) {
            console.log('📝 [renderizarListaAvaliacoes] Lista vazia. Reinserindo botão e mensagem.');
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'reviews-empty';

            if (STATE.reviews.length === 0) {
                emptyMsg.textContent = 'Este produto ainda não possui avaliações publicadas.';
            } else if (filtro) {
                emptyMsg.textContent = `Nenhuma avaliação com ${filtro} ${filtro === 1 ? 'estrela' : 'estrelas'} por enquanto.`;
            } else {
                emptyMsg.textContent = 'Este produto ainda não possui avaliações publicadas.';
            }

            if (btn) {
                container.appendChild(btn);
                console.log('📝 [renderizarListaAvaliacoes] Botão reinserido dentro da lista.');
            }
            container.appendChild(emptyMsg);
            return;
        }

        // 4. Se houver avaliações, garantir que o botão volte para a posição original (fora da lista)
        if (btn && footerNote) {
            if (btn.parentElement !== footerNote.parentElement) {
                console.log('📝 [renderizarListaAvaliacoes] Lista possui avaliações. Movendo botão de volta para fora.');
                footerNote.parentElement.insertBefore(btn, footerNote);
            } else {
                console.log('📝 [renderizarListaAvaliacoes] Botão já está na posição correta (fora da lista).');
            }
        } else if (btn && !footerNote) {
            console.warn('⚠️ [renderizarListaAvaliacoes] footerNote não encontrado, botão pode ficar órfão.');
        }

        // 5. Renderizar as avaliações normalmente...
        lista.forEach(review => {
            const article = document.createElement('article');
            article.className = 'review-item';

            const header = document.createElement('div');
            header.className = 'review-item-header';

            const nameEl = document.createElement('strong');
            nameEl.className = 'review-item-name';
            nameEl.textContent = review.user_name || 'Anônimo';

            const starsEl = document.createElement('span');
            starsEl.className = 'review-item-stars';
            starsEl.setAttribute('aria-label', `${review.rating} de 5 estrelas`);
            starsEl.textContent = estrelasVisuais(review.rating);

            const dateEl = document.createElement('span');
            dateEl.className = 'review-item-date';
            dateEl.textContent = formatarData(review.posted_at || review.created_at);

            header.append(nameEl, starsEl, dateEl);

            const body = document.createElement('p');
            body.className = 'review-item-comment';
            body.textContent = review.comment || '';

            article.append(header, body);

            const imgs = Array.isArray(review.image_paths)
                ? review.image_paths.filter(Boolean) : [];
            if (imgs.length > 0) {
                const gallery = document.createElement('div');
                gallery.className = 'review-item-gallery';
                imgs.forEach((src, i) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = `Imagem ${i + 1} da avaliação de ${review.user_name || 'usuário'}`;
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    img.addEventListener('click', () => window.open(src, '_blank', 'noopener'));
                    gallery.appendChild(img);
                });
                article.appendChild(gallery);
            }

            container.appendChild(article);
        });
    }

    function aplicarFiltro(stars) {
        STATE.activeFilter = (STATE.activeFilter === stars) ? null : stars;
        renderizarDistribuicaoAvaliacoes(calcularDistribuicao(STATE.reviews));
        renderizarListaAvaliacoes();
    }

    // ------------------------------------------
    // MODAL
    // ------------------------------------------
    function abrirModal() {
        if (STATE.jaAvaliou) return;
        const modal = document.getElementById('reviewModal');
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        setTimeout(() => document.getElementById('reviewName')?.focus(), 60);
    }

    function fecharModal() {
        const modal = document.getElementById('reviewModal');
        if (!modal) return;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    function resetarFormulario() {
        document.getElementById('reviewForm')?.reset();
        document.querySelectorAll('#ratingInput .star')
            .forEach(s => s.classList.remove('active', 'hover'));
        const ratingInput = document.getElementById('reviewRating');
        if (ratingInput) ratingInput.value = '0';
        const count = document.getElementById('commentCount');
        if (count) count.textContent = '0';
        document.getElementById('reviewImagePreviews')?.replaceChildren();
        const status = document.getElementById('reviewFormStatus');
        if (status) {
            status.hidden = true;
            status.textContent = '';
            status.className = 'review-form-status';
        }
    }

    function configurarEstrelasFormulario() {
        const ratingInput = document.getElementById('reviewRating');
        const estrelas = document.querySelectorAll('#ratingInput .star');

        estrelas.forEach((btn, idx) => {
            const value = Number(btn.dataset.value) || (idx + 1);
            const setHover = (on) => {
                estrelas.forEach((s, i) => s.classList.toggle('hover', on && i <= idx));
            };
            const commit = () => {
                if (ratingInput) ratingInput.value = String(value);
                estrelas.forEach((s, i) => s.classList.toggle('active', i <= idx));
            };
            btn.addEventListener('mouseenter', () => setHover(true));
            btn.addEventListener('mouseleave', () => setHover(false));
            btn.addEventListener('focus', () => setHover(true));
            btn.addEventListener('blur', () => setHover(false));
            btn.addEventListener('click', commit);
        });
    }

    function configurarFormulario() {
        const form = document.getElementById('reviewForm');
        if (!form) return;

        const comment = document.getElementById('reviewComment');
        const commentCount = document.getElementById('commentCount');
        comment?.addEventListener('input', () => {
            if (commentCount) commentCount.textContent = String(comment.value.length);
        });

        const fileInput = document.getElementById('reviewImages');
        const previews = document.getElementById('reviewImagePreviews');
        fileInput?.addEventListener('change', () => {
            if (!previews) return;
            previews.replaceChildren();
            const files = Array.from(fileInput.files || []).slice(0, 3);
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const url = URL.createObjectURL(file);
                const img = document.createElement('img');
                img.src = url;
                img.alt = file.name;
                img.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
                previews.appendChild(img);
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const statusEl = document.getElementById('reviewFormStatus');
            const submitBtn = document.getElementById('submitReview');
            const setStatus = (msg, type = '') => {
                if (!statusEl) return;
                statusEl.hidden = !msg;
                statusEl.textContent = msg || '';
                statusEl.className = 'review-form-status' + (type ? ' ' + type : '');
            };

            if (!STATE.productId) {
                setStatus('Não foi possível identificar o produto.', 'error');
                return;
            }

            const userName = document.getElementById('reviewName')?.value || '';
            const rating = document.getElementById('reviewRating')?.value || '0';
            const commentText = document.getElementById('reviewComment')?.value || '';
            const files = fileInput?.files || [];

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }
            setStatus('Enviando avaliação...', '');

            try {
                console.log('📤 [submit] Enviando avaliação. productId:', STATE.productId, '| Tipo:', typeof STATE.productId);
                console.log('📤 [submit] Dados:', { userName, rating, comment: commentText, filesCount: files.length });

                await window.enviarAvaliacao({
                    userName,
                    rating,
                    comment: commentText,
                    files,
                    productId: STATE.productId,
                });

                // ✅ marca localmente e trava o botão
                marcarAvaliacaoEnviada();
                STATE.jaAvaliou = true;
                atualizarBotaoAvaliar();

                setStatus('✅ Avaliação enviada! Será publicada após moderação.', 'success');
                resetarFormulario();
                setTimeout(fecharModal, 1800);
            } catch (err) {
                console.error(err);

                // Traduz erros técnicos do Supabase/Postgres para mensagens amigáveis
                const mensagem = traduzirErroAvaliacao(err);
                setStatus(mensagem, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar avaliação';
                }
            }
        });

        document.getElementById('closeReviewModal')
            ?.addEventListener('click', fecharModal);
        document.getElementById('cancelReview')
            ?.addEventListener('click', () => { resetarFormulario(); fecharModal(); });
        document.getElementById('reviewModal')
            ?.addEventListener('click', (e) => {
                if (e.target?.id === 'reviewModal') fecharModal();
            });
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('reviewModal');
            if (e.key === 'Escape' && modal && !modal.hidden) fecharModal();
        });
    }

    function configurarFiltroBotao() {
        document.getElementById('clearReviewFilter')?.addEventListener('click', () => {
            STATE.activeFilter = null;
            renderizarDistribuicaoAvaliacoes(calcularDistribuicao(STATE.reviews));
            renderizarListaAvaliacoes();
        });
    }

    // ------------------------------------------
    // API PÚBLICA — chamada por product.js
    // ------------------------------------------
    async function inicializarAvaliacoesProduto(productId) {
        if (!productId) {
            console.warn('⚠️ [inicializarAvaliacoesProduto] productId não fornecido!');
            return;
        }

        // Garante que o ID seja sempre string
        const idProduto = String(productId);

        // Se o produto mudou, reseta o estado de "já avaliou"
        if (STATE.productId !== idProduto) {
            console.log(`🔄 [inicializarAvaliacoesProduto] Produto mudou de ${STATE.productId} para ${idProduto}. Resetando estado.`);
            STATE.jaAvaliou = false;
        }

        STATE.productId = idProduto;
        STATE.activeFilter = null;
        STATE.loaded = false;
        STATE.ghast = obterGhast();
        STATE.jaAvaliou = false; // Garante que começa como false

        console.log('🚀 [inicializarAvaliacoesProduto] Iniciando para o produto:', idProduto);
        console.log('🔍 [inicializarAvaliacoesProduto] GHAST obtido:', STATE.ghast);

        // Estado inicial (carregando)
        atualizarBotaoAvaliar();
        renderizarDistribuicaoAvaliacoes(calcularDistribuicao([]));
        renderizarListaAvaliacoes();

        try {
            console.log('⏳ [inicializarAvaliacoesProduto] Buscando avaliações e status do usuário...');
            const reviewsPromise = window.carregarAvaliacoesProduto(idProduto);
            const jaAvaliouPromise = verificarSeJaAvaliou();

            const reviews = await reviewsPromise;
            STATE.reviews = Array.isArray(reviews) ? reviews : [];
            STATE.loaded = true;

            console.log('✅ [inicializarAvaliacoesProduto] Avaliações carregadas:', STATE.reviews.length);

            renderizarDistribuicaoAvaliacoes(calcularDistribuicao(STATE.reviews));
            renderizarListaAvaliacoes();

            STATE.jaAvaliou = await jaAvaliouPromise;
            console.log('✅ [inicializarAvaliacoesProduto] Status "Já avaliou" resolvido:', STATE.jaAvaliou);

            atualizarBotaoAvaliar();

            console.log('🏁 [inicializarAvaliacoesProduto] Finalizado. GHAST:', STATE.ghast, '| Product ID:', idProduto, '| Já avaliou?', STATE.jaAvaliou);
        } catch (err) {
            console.error('❌ [inicializarAvaliacoesProduto] Falha ao carregar avaliações:', err);
        }
    }
    window.inicializarAvaliacoesProduto = inicializarAvaliacoesProduto;
    // ------------------------------------------
    // BOOTSTRAP
    // ------------------------------------------
    function boot() {
        configurarEstrelasFormulario();
        configurarFormulario();
        configurarFiltroBotao();
        document.getElementById('writeReviewBtn')
            ?.addEventListener('click', () => {
                if (STATE.jaAvaliou) return;
                abrirModal();
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();