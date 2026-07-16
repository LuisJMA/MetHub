// js/views/explore.js

let allResultsIds = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

/**
 * Renderiza la interfaz base del buscador global con el panel de filtros y agregados.
 */
function renderExplore() {
    const app = document.getElementById('app');

    console.log("🚀 ¡Sí! El enrutador llamó a renderExplore() con éxito.");
    
    // 1. Inyectamos el esqueleto HTML con los 19 departamentos y contenedor de agregados
    app.innerHTML = `
        <div class="explore-view">
            <header class="explore-header">
                <h2>Explorar la Colección</h2>
                <p>Busca entre más de 500,000 años de historia del arte universal.</p>
            </header>

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

                <div class="filters-panel">
                    <div class="filter-group">
                        <label for="department-select">Departamento:</label>
                        <select id="department-select">
                            <option value="">Todos los departamentos (19 áreas)</option>
                            <option value="1">Artes Decorativas Americanas</option>
                            <option value="3">Arte del Antiguo Oriente Próximo</option>
                            <option value="4">Armas y Armaduras</option>
                            <option value="5">Arte de África, Oceanía y América</option>
                            <option value="6">Arte Asiático</option>
                            <option value="7">The Cloisters</option>
                            <option value="8">Instituto del Vestido</option>
                            <option value="9">Dibujos y Grabados</option>
                            <option value="10">Arte Egipcio</option>
                            <option value="11">Pinturas Europeas</option>
                            <option value="12">Escultura y Artes Decorativas Europeas</option>
                            <option value="13">Arte Griego y Romano</option>
                            <option value="14">Arte Islámico</option>
                            <option value="15">Colección Robert Lehman</option>
                            <option value="16">Arte Medieval</option>
                            <option value="17">Arte Moderno y Contemporáneo</option>
                            <option value="18">Instrumentos Musicales</option>
                            <option value="19">Fotografías</option>
                            <option value="21">Arte de las Civilizaciones de América</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Rango de Años:</label>
                        <div class="year-inputs">
                            <input type="number" id="date-begin" placeholder="Desde (ej: -1000 para A.C.)">
                            <input type="number" id="date-end" placeholder="Hasta (ej: 2000)">
                        </div>
                    </div>
                </div>
            </form>

            <div id="aggregates-panel" class="hidden">
                <div class="aggregates-card">
                    <div class="agg-item">
                        <span class="agg-icon">🏛️</span>
                        <div class="agg-info">
                            <label>Dpto. Dominante</label>
                            <strong id="agg-department">-</strong>
                        </div>
                    </div>
                    <div class="agg-item">
                        <span class="agg-icon">⏳</span>
                        <div class="agg-info">
                            <label>Siglo más Frecuente</label>
                            <strong id="agg-century">-</strong>
                        </div>
                    </div>
                    <div class="agg-item">
                        <span class="agg-icon">🌍</span>
                        <div class="agg-info">
                            <label>Cultura Dominante</label>
                            <strong id="agg-culture">-</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div id="search-loader" class="loader-container hidden">
                <div class="spinner"></div>
                <p>Viajando a los servidores del MET...</p>
            </div>

            <div id="search-message" class="search-message"></div>

            <div id="results-grid" class="results-grid"></div>

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
    const aggPanel = document.getElementById('aggregates-panel');

    // 1. PREPARAR LA INTERFAZ (Estado de carga)
    if (loader) loader.classList.remove('hidden'); 
    if (messageContainer) messageContainer.textContent = '';  
    if (gridContainer) gridContainer.textContent = '';     
    if (aggPanel) aggPanel.classList.add('hidden'); // Ocultar estadísticas viejas

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
        // 2. CONSUMIR LA API REAL
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
 * Calcula en tiempo real las estadísticas de los 12 elementos actualmente visibles (Requisito 4.2.2).
 */
function calcularAgregadosEnVivo(obras) {
    const aggPanel = document.getElementById('aggregates-panel');
    if (!aggPanel || obras.length === 0) return;

    // --- 1. DEPARTAMENTO DOMINANTE ---
    const dptos = obras.map(o => o.department).filter(Boolean);
    const dptoDominante = encontrarModa(dptos) || 'Ninguno';

    // --- 2. SIGLO MÁS FRECUENTE (Soporta A.C. / D.C.) ---
    const siglos = obras.map(o => {
        const anio = parseInt(o.objectBeginDate);
        if (isNaN(anio)) return null;
        
        // El siglo se calcula dividiendo el año entre 100 y redondeando hacia arriba
        const sigloNro = Math.ceil(Math.abs(anio) / 100);
        if (sigloNro === 0) return null;
        
        return anio < 0 ? `Siglo ${sigloNro} a.C.` : `Siglo ${sigloNro} d.C.`;
    }).filter(Boolean);
    const sigloFrecuente = encontrarModa(siglos) || 'Mixto';

    // --- 3. CULTURA DOMINANTE ---
    const culturas = obras.map(o => o.culture).filter(Boolean);
    const culturaComun = encontrarModa(culturas) || 'Variada';

    // Inyectar en el DOM de forma reactiva
    document.getElementById('agg-department').textContent = dptoDominante;
    document.getElementById('agg-century').textContent = sigloFrecuente;
    document.getElementById('agg-culture').textContent = culturaComun;

    // Hacemos el panel visible
    aggPanel.classList.remove('hidden');
}

/**
 * Función auxiliar para encontrar el elemento que más se repite en un array.
 */
function encontrarModa(arr) {
    if (arr.length === 0) return null;
    const frecuencias = {};
    let maxElem = arr[0];
    let maxCount = 1;

    for (const elem of arr) {
        frecuencias[elem] = (frecuencias[elem] || 0) + 1;
        if (frecuencias[elem] > maxCount) {
            maxElem = elem;
            maxCount = frecuencias[elem];
        }
    }
    return maxElem;
}

/**
 * Recibe un lote de IDs, descarga sus datos en paralelo y dibuja
 * las tarjetas reales de forma segura en la cuadrícula.
 */
async function fetchAndRenderCards(ids) {
    const gridContainer = document.getElementById('results-grid');
    if (!gridContainer) return;

    // 1. PASO ASÍNCRONO: Creamos un arreglo de promesas (peticiones a la API)
    const promesas = ids.map(id => MetApi.getObject(id));

    // 2. PARALELISMO SEGURO: Disparamos las 12 peticiones al mismo tiempo
    const resultados = await Promise.allSettled(promesas);

    // Limpiamos la cuadrícula
    gridContainer.textContent = '';

    // Filtramos únicamente las respuestas exitosas de la API para el cálculo de agregados
    const obrasValidas = resultados
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

    // 3. RENDERIZADO: Procesamos los resultados que devolvieron los servidores
    resultados.forEach(resultado => {
        if (resultado.status !== 'fulfilled' || !resultado.value) return;

        const obra = resultado.value;

        // Construcción limpia usando el DOM nativo (Cero innerHTML)
        const card = document.createElement('div');
        card.className = 'card-item';

        const img = document.createElement('img');
        img.className = 'card-img';
        img.src = obra.primaryImageSmall || 'https://placehold.co/300x400?text=Sin+Imagen';
        img.alt = obra.title || 'Obra del Met Museum';

        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = obra.title || 'Título no disponible';

        const artist = document.createElement('p');
        artist.className = 'card-artist';
        artist.textContent = obra.artistDisplayName || 'Artista desconocido';

        const viewMoreBtn = document.createElement('a');
        viewMoreBtn.className = 'card-btn';
        viewMoreBtn.href = `#detail/${obra.objectID}`;
        viewMoreBtn.textContent = 'Ver detalles';

        viewMoreBtn.addEventListener('click', (e) => {
            window.location.hash = `#detail/${obra.objectID}`;
        });

        cardInfo.appendChild(title);
        cardInfo.appendChild(artist);
        cardInfo.appendChild(viewMoreBtn);

        card.appendChild(img);
        card.appendChild(cardInfo);

        gridContainer.appendChild(card);
    });

    // 4. CALCULO DE AGREGADOS EN VIVO (Con el lote real descargado)
    calcularAgregadosEnVivo(obrasValidas);
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