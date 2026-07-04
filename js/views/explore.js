// js/views/explore.js



let allResultsIds = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

/**
 * Renderiza la interfaz base del buscador global.
 * Esta función destruye el cascarón antiguo y dibuja el formulario real.
 */


function renderExplore() {
    const app = document.getElementById('app');

    console.log("🚀 ¡Sí! El enrutador llamó a renderExplore() con éxito.");
    // 1. Inyectamos el esqueleto HTML del buscador de forma dinámica
    app.innerHTML = `
        <div class="explore-view">
            <header class="explore-header">
                <h2>Explorar la Colección</h2>
                <p>Busca entre más de 500,000 años de historia del arte universal.</p>
            </header>

            <!-- Formulario de Búsqueda -->
            <form id="search-form" class="search-box">
                <input 
                    type="text" 
                    id="search-input" 
                    placeholder="Ej: sunflowers, Rembrandt, Da Vinci, armor..." 
                    required
                    autocomplete="off"
                >
                <button type="submit" id="search-btn">Buscar</button>
            </form>

            <!-- Contenedor del Loader (Se mostrará mientras descarga de internet) -->
            <div id="search-loader" class="loader-container hidden">
                <div class="spinner"></div>
                <p>Viajando a los servidores del MET...</p>
            </div>

            <!-- Zona de Mensajes o Errores -->
            <div id="search-message" class="search-message"></div>

            <!-- Cuadrícula (Grid) donde se pintarán las tarjetas de las obras -->
            <div id="results-grid" class="results-grid"></div>

            <!-- NUEVO: Controles de Paginación -->
            <div class="pagination-controls">
                <button id="prev-btn" onclick="prevPage()" disabled>Anterior</button>
                <span id="page-indicator">Página 1 de 1</span>
                <button id="next-btn" onclick="nextPage()" disabled>Siguiente</button>
            </div>
        </div>
    `;

    // 2. Capturamos los elementos recién creados en el DOM para asignarles lógica
    const searchForm = document.getElementById('search-form');
    
    // Escuchamos el evento 'submit' (cuando el usuario presiona Enter o hace clic en Buscar)
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que la página se recargue e interrumpa la SPA
        
        const query = document.getElementById('search-input').value.trim();
        
        if (query) {
            executeSearch(query);
        }
    });
}

/**
 * Coordina la búsqueda llamando a la API, controla los estados de carga
 * y gestiona los posibles errores de red o timeouts.
 */
async function executeSearch(query) {
    const loader = document.getElementById('search-loader');
    const messageContainer = document.getElementById('search-message');
    const gridContainer = document.getElementById('results-grid');

    // 1. PREPARAR LA INTERFAZ (Estado de carga)
    if (loader) loader.classList.remove('hidden'); 
    if (messageContainer) messageContainer.textContent = '';  
    if (gridContainer) gridContainer.textContent = '';     

    try {
        // 2. CONSUMIR LA API REAL
        const data = await MetApi.searchObjects(query);

        // Ocultamos el loader inmediatamente al recibir respuesta
        if (loader) loader.classList.add('hidden');

        // 3. VALIDAR SI EL MUSEO TIENE RESULTADOS
        if (!data || data.total === 0 || !data.objectIDs) {
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <p class="info-message">No se encontraron obras de arte para <strong>"${query}"</strong>. ¡Prueba con otro término!</p>
                `;
            }
            return; 
        }

        // 4. Almacenar la totalidad de los IDs y reiniciar el puntero de página
        allResultsIds = data.objectIDs;
        currentPage = 1;
        
        if (messageContainer) {
            messageContainer.innerHTML = `
                <p class="success-message">Se encontraron ${data.total} registros. Cargando resultados...</p>
            `;
        }

        // 5. DEJAR LISTA LA LLAMADA AL RENDERIZADO CENTRALIZADO
        renderPage();

    } catch (error) {
        if (loader) loader.classList.add('hidden');

        if (messageContainer) {
            if (error.name === 'AbortError') {
                messageContainer.innerHTML = `
                    <p class="error-message">⚠️ La consulta tardó demasiado. Los servidores del MET están congestionados. Inténtalo de nuevo.</p>
                `;
            } else {
                messageContainer.innerHTML = `
                    <p class="error-message">❌ Hubo un problema al conectar con el servidor del museo.</p>
                `;
            }
        }
        console.error("Error en la búsqueda:", error);
    }
}

/**
 * Recibe un lote de IDs, descarga sus datos en paralelo y dibuja
 * las tarjetas reales de forma segura en la cuadrícula.
 */
async function fetchAndRenderCards(ids) {
    const gridContainer = document.getElementById('results-grid');
    if (!gridContainer) return;

    // 1. PASO ASÍNCRONO: Creamos un arreglo de promesas (peticiones a la API)
    // Usamos el método getObject que creaste en tu met-api.js
    const promesas = ids.map(id => MetApi.getObject(id));

    // 2. PARALELISMO SEGURO: Disparamos las 12 peticiones al mismo tiempo
    // Promise.allSettled garantiza que si una obra falla, las otras 11 se muestren igual
    const resultados = await Promise.allSettled(promesas);

    // Limpiamos los textos temporales de "Cargando datos..." para meter las tarjetas reales
    gridContainer.textContent = '';

    // 3. RENDERIZADO: Procesamos los resultados que devolvieron los servidores
    resultados.forEach(resultado => {
        // Si el servidor rechazó la solicitud de este ID específico, lo saltamos silenciosamente
        if (resultado.status !== 'fulfilled') return;

        // Extraemos los datos puros de la obra de arte exitosa
        const obra = resultado.value;

        // 4. REGLA RNF-07: Construcción limpia usando el DOM nativo (Cero innerHTML)
        const card = document.createElement('div');
        card.className = 'card-item';

        // Imagen de la obra con control de nulos (fallback si no tiene foto)
        const img = document.createElement('img');
        img.className = 'card-img';
        img.src = obra.primaryImageSmall || 'https://placehold.co/300x400?text=Sin+Imagen';
        img.alt = obra.title || 'Obra del Met Museum';

        // Contenedor de la información escrita
        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';

        // Título de la obra
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = obra.title || 'Título no disponible';

        // Nombre del artista
        const artist = document.createElement('p');
        artist.className = 'card-artist';
        artist.textContent = obra.artistDisplayName || 'Artista desconocido';

        // Botón/Enlace dinámico para ir a la vista de detalle (#detail/ID)
        const viewMoreBtn = document.createElement('a');
        viewMoreBtn.className = 'card-btn';
        viewMoreBtn.href = `#detail/${obra.objectID}`;
        viewMoreBtn.textContent = 'Ver detalles';

        // 5. ENSAMBLAJE: Unimos las piezas de adentro hacia afuera
        cardInfo.appendChild(title);
        cardInfo.appendChild(artist);
        cardInfo.appendChild(viewMoreBtn);

        card.appendChild(img);
        card.appendChild(cardInfo);

        // Empujamos la tarjeta terminada al grid de la pantalla
        gridContainer.appendChild(card);
    });
}

/**
 * Extrae el lote de 12 IDs correspondiente a la página actual
 * y los envía al motor de renderizado de tarjetas.
 */
async function renderPage() {
    const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
    const fin = inicio + ITEMS_PER_PAGE;
    const idsPagina = allResultsIds.slice(inicio, fin);

    await fetchAndRenderCards(idsPagina);
    actualizarControlesPaginacion();

    // Sube automáticamente al inicio de la pantalla con un efecto suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Modifica el texto del indicador de página y deshabilita los 
 * botones si el usuario llegó al límite.
 */
function actualizarControlesPaginacion() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageText = document.getElementById('page-indicator');
    
    const totalPages = Math.ceil(allResultsIds.length / ITEMS_PER_PAGE) || 1;

    if (pageText) pageText.textContent = `Página ${currentPage} de ${totalPages}`;
    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
}

/**
 * Incrementa el contador y redibuja la pantalla con los siguientes IDs
 */
function nextPage() {
    const totalPages = Math.ceil(allResultsIds.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        renderPage();
    }
}

/**
 * Decrementa el contador y redibuja la pantalla con los IDs previos
 */
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPage();
    }
}