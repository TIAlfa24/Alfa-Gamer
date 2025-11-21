// =======================================================
// DADOS DE AVALIAÇÃO (SIMULAÇÃO DO BACKEND)
// =======================================================

// Adicionei 'productId' para ligar o comentário ao produto
const ALL_REVIEWS = [
    {
        id: 101,
        productId: 1,
        author: "Emmanuel Gunter",
        score: 5,
        date: "2024-10-25",
        comment: "Excelente placa de vídeo! Rodou todos os jogos no ultra.",
        isVerified: true
    },
    {
        id: 102,
        productId: 1, 
        author: "Jancinto Pinto",
        score: 4,
        date: "2024-10-20",
        comment: "Muito bom, atendeu minhas expectativas.",
        isVerified: true
    },
    {
        id: 45435,
        productId: 1, 
        author: "Tilanbo Cano",
        score: 5,
        date: "2024-10-20",
        comment: "La ele 1000X.",
        isVerified: true
    },
    {
        id: 103,
        productId: 2, // Comentário do Produto ID 2 (ex: Processador)
        author: "Carlos Santos",
        score: 5,
        date: "2024-10-18",
        comment: "Melhor processador que já tive!",
        isVerified: false
    }
    // Produtos novos (sem ID aqui) cairão na lista vazia automaticamente
];

const FULL_STAR = '★';
const EMPTY_STAR = '☆';

// =======================================================
// FUNÇÕES DE RENDERIZAÇÃO
// =======================================================

function createStars(score) {
    const fullStars = Math.floor(score);
    const emptyStars = 5 - fullStars;
    return FULL_STAR.repeat(fullStars) + EMPTY_STAR.repeat(emptyStars);
}

function renderReview(review) {
    const formattedDate = new Date(review.date).toLocaleDateString('pt-BR');

    // Mantém a verificação para uso interno, mas não exibe
    const isVerified = review.isVerified;

    return `
        <div class="review">
    <div class="left">
        <div class="author">${review.author}</div>
        <div class="stars">${createStars(review.score)}</div>
        <div class="date">${formattedDate}</div>
    </div>
    <div class="body">
        <p>
          ${review.comment}
        </p>
    </div>
</div>
    `;

}

function renderStats(reviews) {
    const totalReviews = reviews.length;
    
    // Se não houver reviews, zera tudo
    if (totalReviews === 0) {
        document.getElementById('avgScore').textContent = '0.0';
        document.getElementById('countReviews').textContent = '0';
        document.getElementById('avgStars').innerHTML = createStars(0);
        document.getElementById('distText').textContent = '—';
        return;
    }

    const totalScore = reviews.reduce((sum, r) => sum + r.score, 0);
    const avgScore = (totalScore / totalReviews).toFixed(1);
    const avgStarsRounded = Math.round(avgScore);

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => starCounts[r.score]++);

    const distributionText = Object.entries(starCounts)
        .sort(([a], [b]) => b - a)
        .map(([star, count]) => `${star}★ (${count})`)
        .join(' | ');

    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('countReviews').textContent = totalReviews;
    document.getElementById('avgStars').innerHTML = `<span style="color:#ffcc00;font-size:40px;">${createStars(avgStarsRounded)}</span>`;
    document.getElementById('distText').textContent = distributionText;
}

/**
 * NOVA FUNÇÃO: Agora aceita o ID do produto para filtrar
 */
function loadReviews(currentProductId) {
    // Filtra apenas as reviews que tem o productId igual ao da página
    const filteredReviews = ALL_REVIEWS.filter(r => r.productId === currentProductId);

    const reviewsListEl = document.getElementById('reviewsList');
    
    if (filteredReviews.length === 0) {
        reviewsListEl.innerHTML = '<p style="text-align:center;color:var(--muted);margin-top:20px;">Este produto ainda não tem avaliações. Seja o primeiro!</p>';
    } else {
        reviewsListEl.innerHTML = filteredReviews.map(renderReview).join('');
    }

    renderStats(filteredReviews);
}

// Removemos o EventListener automático daqui. 
// Quem vai chamar o loadReviews agora é o produto.js, pois ele sabe qual é o ID.