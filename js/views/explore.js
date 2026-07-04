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