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
    // 1. Inyectamos el esqueleto HTML con el nuevo panel de filtros
    app.innerHTML = `
        <div class="explore-view">
            <header class="explore-header">
                <h2>Explorar la Colección</h2>
                <p>Busca entre más de 500,000 años de historia del arte universal.</p>
            </header>

            <!-- Formulario de Búsqueda y Filtros -->
            <form id="search-form" class="search-box">
                <div class="search-main-row">
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Ej: sunflowers, Rembrandt, Da Vinci, armor..." 
                        required
                        autocomplete="off"
                    >
                    <button type="submit" id="search-btn">Buscar</button>
                </div>

                <!-- NUEVO: Panel de Filtros Opcionales -->
                <div class="filters-panel">
                    <div class="filter-group">
                        <label for="department-select">Departamento:</label>
                        <select id="department-select">
                            <option value="">Todos los departamentos</option>
                            <option value="11">Pinturas Europeas</option>
                            <option value="9">Arte Egipcio</option>
                            <option value="13">Arte Griego y Romano</option>
                            <option value="1">Artes Decorativas Americanas</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Rango de Años:</label>
                        <div class="year-inputs">
                            <input type="number" id="date-begin" placeholder="Desde (ej: 1500)">
                            <input type="number" id="date-end" placeholder="Hasta (ej: 1900)">
                        </div>
                    </div>
                </div>
            </form>

            <!-- Contenedor del Loader -->
            <div id="search-loader" class="loader-container hidden">
                <div class="spinner"></div>
                <p>Viajando a los servidores del MET...</p>
            </div>

            <!-- Zona de Mensajes o Errores -->
            <div id="search-message" class="search-message"></div>

            <!-- Cuadrícula (Grid) donde se pintarán las tarjetas de las obras -->
            <div id="results-grid" class="results-grid"></div>

            <!-- Controles de Paginación -->
            <div class="pagination-controls">
                <button id="prev-btn" onclick="prevPage()" disabled>Anterior</button>
                <span id="page-indicator">Página 1 de 1</span>
                <button id="next-btn" onclick="nextPage()" disabled>Siguiente</button>
            </div>
        </div>
    `;

    // 2. Capturamos los elementos recién creados en el DOM para asignarles lógica
    const searchForm = document.getElementById('search-form');
    
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que la página se recargue
        
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

    // 1.5. CAPTURAR LOS FILTROS DEL DOM
    const department = document.getElementById('department-select')?.value || '';
    const dateBegin = document.getElementById('date-begin')?.value || '';
    const dateEnd = document.getElementById('date-end')?.value || '';

    // Creamos un objeto con los filtros limpios para pasárselo a la API
    const options = {
        departmentId: department,
        dateBegin: dateBegin,
        dateEnd: dateEnd
    };

    try {
        // 2. CONSUMIR LA API REAL (Pasándole la query y los filtros opcionales)
        const data = await MetApi.searchObjects(query, options);

        // Ocultamos el loader inmediatamente al recibir respuesta
        if (loader) loader.classList.add('hidden');

        // 3. VALIDAR SI EL MUSEO TIENE RESULTADOS
        if (!data || data.total === 0 || !data.objectIDs) {
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <p class="info-message">No se encontraron obras de arte para <strong>"${query}"</strong> con los filtros seleccionados. ¡Prueba otra combinación!</p>
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

        // 5. LLAMADA AL RENDERIZADO CENTRALIZADO
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


        // Forzamos el cambio de hash por JavaScript
        // Al hacer clic, le decimos explícitamente al navegador que actualice la URL.
        // Esto garantiza que el evento 'hashchange' que escucha tu router.js se dispare sí o sí.
        viewMoreBtn.addEventListener('click', (e) => {
            // Permitimos que cambie el hash de la URL normalmente
            window.location.hash = `#detail/${obra.objectID}`;
        });

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