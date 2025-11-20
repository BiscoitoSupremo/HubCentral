// Seleções principais
const cards = Array.from(document.querySelectorAll(".profile-card"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const featureTitle = document.getElementById("featureTitle");
const featureText = document.getElementById("featureText");

// Modal
const previewBackdrop = document.getElementById("previewBackdrop");
const previewTitle = document.getElementById("previewTitle");
const previewText = document.getElementById("previewText");
const previewImage = document.getElementById("previewImage");
const previewOpenBtn = document.getElementById("previewOpen");
const previewCloseBtn = document.getElementById("previewClose");

let currentIndex = 0;
let currentLink = "#";

// Função para atualizar as classes de profundidade
function updateCarousel() {
    const total = cards.length;

    cards.forEach((card, index) => {
        card.classList.remove("active", "left", "right", "far-left", "far-right", "hidden");

        // diferença circular
        const diff = (index - currentIndex + total) % total;

        if (diff === 0) {
            card.classList.add("active");
        } else if (diff === 1) {
            card.classList.add("right");
        } else if (diff === 2) {
            card.classList.add("far-right");
        } else if (diff === total - 1) {
            card.classList.add("left");
        } else if (diff === total - 2) {
            card.classList.add("far-left");
        } else {
            card.classList.add("hidden");
        }
    });

    // Atualiza título/descrição da área abaixo
    const activeCard = cards[currentIndex];
    featureTitle.textContent = activeCard.dataset.title;
    featureText.textContent = activeCard.dataset.desc;
}

// Rotação para a direita/esquerda
function goNext() {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCarousel();
}

function goPrev() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCarousel();
}

// Abrir modal com dados do card ativo
function openPreview(card) {
    const imgEl = card.querySelector("img");

    previewTitle.textContent = card.dataset.title;
    previewText.textContent = card.dataset.desc;
    previewImage.src = imgEl ? imgEl.src : "";
    currentLink = card.dataset.link || "#";

    previewBackdrop.classList.add("show");
}

// Fechar modal
function closePreview() {
    previewBackdrop.classList.remove("show");
}

// Eventos das setas
if (nextBtn && prevBtn) {
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);
}

// Clique nos cards
cards.forEach((card, index) => {
    card.addEventListener("click", () => {
        // Se já for o card central => abre pré-visualização
        if (card.classList.contains("active")) {
            openPreview(card);
        } else {
            // Senão, traz ele para o centro
            currentIndex = index;
            updateCarousel();
        }
    });
});

// Botão "Abrir página"
previewOpenBtn.addEventListener("click", () => {
    if (currentLink && currentLink !== "#") {
        window.open(currentLink, "_blank");
    }
});

// Botão X
previewCloseBtn.addEventListener("click", closePreview);

// Clique fora do modal também fecha
previewBackdrop.addEventListener("click", (event) => {
    if (event.target === previewBackdrop) {
        closePreview();
    }
});

// Inicializa estado
updateCarousel();
