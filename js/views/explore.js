// js/views/explore.js

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
    if (loader) loader.classList.remove('hidden'); // Mostramos el spinner de carga
    if (messageContainer) messageContainer.textContent = '';  // Limpiamos mensajes anteriores
    if (gridContainer) gridContainer.textContent = '';     // Vaciamos la cuadrícula de imágenes

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

        // 4. OPTIMIZACIÓN DE RENDIMIENTO
        // Limitamos el arreglo masivo para procesar solo los primeros 12 IDs.
        const topIDs = data.objectIDs.slice(0, 12);
        
        if (messageContainer) {
            messageContainer.innerHTML = `
                <p class="success-message">Se encontraron ${data.total} registros. Cargando una muestra de las primeras ${topIDs.length} obras...</p>
            `;
        }

        // 5. ENVIAR A RENDERIZAR LOS ID TEMPORALES
        fetchAndRenderCards(topIDs);

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
 * Recibe un lote de IDs y dibuja cajitas temporales en el grid.
 */
async function fetchAndRenderCards(ids) {
    const gridContainer = document.getElementById('results-grid');
    if (!gridContainer) return;

    ids.forEach(id => {
        const placeholderCard = document.createElement('div');
        placeholderCard.className = 'card-placeholder';
        placeholderCard.textContent = `Cargando datos de la obra ID: ${id}...`;
        gridContainer.appendChild(placeholderCard);
    });
}