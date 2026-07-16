// js/views/artist.js

let artistResultsIds = [];
let artistCurrentPage = 1;
const ARTIST_ITEMS_PER_PAGE = 12;
let currentArtistName = "";

/**
 * FUNCIÓN CENTRAL: renderArtist
 * Recibe el nombre del artista de la URL y monta la grilla de sus obras.
 */
async function renderArtist(name) {
    const app = document.getElementById('app');
    if (!app) return;

    currentArtistName = name;
    artistCurrentPage = 1;
    artistResultsIds = [];

    // 1. Inyectamos la estructura base para la vista del artista
    app.innerHTML = `
        <div class="view-container">
            <header class="explore-header" style="text-align: left; margin-bottom: 30px;">
                <button id="btn-back-artist" class="btn-secondary" style="margin-bottom: 20px;">⬅️ Volver</button>
                <h1 style="font-size: 2.5rem; color: var(--text-main); margin-bottom: 8px;">${name}</h1>
                <p style="color: var(--brand-color); font-weight: 600; font-size: 1.1rem;">Obras expuestas en el Metropolitan Museum of Art</p>
            </header>

            <div id="artist-loader" class="loader-container">
                <div class="spinner"></div>
                <p>Buscando el catálogo de ${name}...</p>
            </div>

            <div id="artist-message" class="search-message"></div>

            <div id="artist-grid" class="results-grid"></div>

            <div class="pagination-controls hidden" id="artist-pagination">
                <button id="art-prev-btn" onclick="prevArtistPage()" disabled>Anterior</button>
                <span id="art-page-indicator">Página 1 de 1</span>
                <button id="art-next-btn" onclick="nextArtistPage()" disabled>Siguiente</button>
            </div>
        </div>
    `;

    // Asignar comportamiento de regreso al botón
    document.getElementById('btn-back-artist').addEventListener('click', () => {
        window.history.back();
    });

    const loader = document.getElementById('artist-loader');
    const messageContainer = document.getElementById('artist-message');
    const paginationContainer = document.getElementById('artist-pagination');

    try {
        // 2. BUSCAR LAS OBRAS DEL ARTISTA EN LA API
        // Usamos artistOrCulture: true en las opciones de búsqueda
        const data = await MetApi.searchObjects(name, { artistOrCulture: true });

        if (loader) loader.classList.add('hidden');

        // Validamos si la API trajo resultados
        if (!data || data.total === 0 || !data.objectIDs) {
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <p class="info-message">No se encontraron obras registradas bajo el nombre de <strong>"${name}"</strong> en la colección abierta.</p>
                `;
            }
            return;
        }

        // Guardamos los IDs obtenidos y mostramos la paginación
        artistResultsIds = data.objectIDs;
        if (paginationContainer) paginationContainer.classList.remove('hidden');

        // 3. RENDERIZAR LA PRIMERA PÁGINA
        renderArtistPage();

    } catch (error) {
        if (loader) loader.classList.add('hidden');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <p class="error-message">❌ Hubo un error al intentar cargar las obras de este artista.</p>
            `;
        }
        console.error("Error al cargar obras del artista:", error);
    }
}

/**
 * Descarga en paralelo y renderiza el lote de 12 obras del artista actual
 */
async function fetchAndRenderArtistCards(ids) {
    const gridContainer = document.getElementById('artist-grid');
    if (!gridContainer) return;

    gridContainer.textContent = '';

    const promesas = ids.map(id => MetApi.getObject(id));
    const resultados = await Promise.allSettled(promesas);

    resultados.forEach(resultado => {
        if (resultado.status !== 'fulfilled' || !resultado.value) return;

        const obra = resultado.value;

        // Construcción segura del DOM (sin innerHTML para evitar XSS)
        const card = document.createElement('div');
        card.className = 'card-item';

        const img = document.createElement('img');
        img.className = 'card-img';
        img.src = obra.primaryImageSmall || 'https://placehold.co/300x400?text=Sin+Imagen';
        img.alt = obra.title || 'Obra del artista';

        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = obra.title || 'Título no disponible';

        const date = document.createElement('p');
        date.className = 'card-artist'; // Reutiliza estilo sutil
        date.textContent = obra.objectDate || 'Fecha desconocida';

        const viewMoreBtn = document.createElement('a');
        viewMoreBtn.className = 'card-btn';
        viewMoreBtn.href = `#detail/${obra.objectID}`;
        viewMoreBtn.textContent = 'Ver detalles';

        cardInfo.appendChild(title);
        cardInfo.appendChild(date);
        cardInfo.appendChild(viewMoreBtn);

        card.appendChild(img);
        card.appendChild(cardInfo);

        gridContainer.appendChild(card);
    });
}

/**
 * Extrae y renderiza el lote de IDs correspondiente a la página actual de artista
 */
async function renderArtistPage() {
    const inicio = (artistCurrentPage - 1) * ARTIST_ITEMS_PER_PAGE;
    const fin = inicio + ARTIST_ITEMS_PER_PAGE;
    const idsPagina = artistResultsIds.slice(inicio, fin);

    await fetchAndRenderArtistCards(idsPagina);
    actualizarControlesPaginacionArtist();

    // Scroll suave hacia arriba para mejorar usabilidad al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Controla el estado y texto de los botones de paginación
 */
function actualizarControlesPaginacionArtist() {
    const prevBtn = document.getElementById('art-prev-btn');
    const nextBtn = document.getElementById('art-next-btn');
    const pageText = document.getElementById('art-page-indicator');
    
    const totalPages = Math.ceil(artistResultsIds.length / ARTIST_ITEMS_PER_PAGE) || 1;

    if (pageText) pageText.textContent = `Página ${artistCurrentPage} de ${totalPages}`;
    if (prevBtn) prevBtn.disabled = (artistCurrentPage === 1);
    if (nextBtn) nextBtn.disabled = (artistCurrentPage === totalPages);
}

/**
 * Avanza una página en la vista del artista
 */
function nextArtistPage() {
    const totalPages = Math.ceil(artistResultsIds.length / ARTIST_ITEMS_PER_PAGE);
    if (artistCurrentPage < totalPages) {
        artistCurrentPage++;
        renderArtistPage();
    }
}

/**
 * Retrocede una página en la vista del artista
 */
function prevArtistPage() {
    if (artistCurrentPage > 1) {
        artistCurrentPage--;
        renderArtistPage();
    }
}