// js/views/compare.js

// Variables de estado global para rastrear las obras fijadas en cada panel
let obraSeleccionadaA = null;
let obraSeleccionadaB = null;

// Objeto para almacenar los temporizadores del Debounce de cada panel
const timersDebounce = { A: null, B: null };

/**
 * FUNCIÓN CENTRAL: renderCompare
 * Monta el cascarón de los paneles y gestiona la preselección desde Detalle.
 */
async function renderCompare() {
    const app = document.getElementById('app');
    
    const hash = window.location.hash;
    let idPreseleccionado = null;
    
    if (hash.includes('/') && hash.split('/')[1]) {
        idPreseleccionado = hash.split('/')[1].trim();
    }

    app.innerHTML = `
        <div class="view-container">
            <h1 class="view-title">⚖️ Comparador de Obras Lado a Lado</h1>
            <p class="view-description">Busca y selecciona dos piezas del museo para contrastar su historia y datos técnicos.</p>
            
            <div class="compare-grid">
                <div id="panel-A" class="compare-panel-box"></div>
                
                <div id="panel-B" class="compare-panel-box"></div>
            </div>

            <div id="compare-table-container" class="hidden"></div>
        </div>
    `;

    renderEstadoBuscadorPanel('A');
    renderEstadoBuscadorPanel('B');

    if (idPreseleccionado) {
        const panelA = document.getElementById('panel-A');
        if (panelA) {
            panelA.innerHTML = `<div class="loader-mini">Cargando obra preseleccionada...</div>`;
            try {
                const obra = await MetApi.getObject(idPreseleccionado);
                obraSeleccionadaA = obra;
                renderObraFijadaPanel('A', obra);
            } catch (error) {
                console.error("Error al cargar obra preseleccionada:", error);
                renderEstadoBuscadorPanel('A');
            }
        }
    }
}

/**
 * FUNCIÓN: renderEstadoBuscadorPanel
 * Dibuja el campo de texto e inicializa los eventos con Debounce.
 */
function renderEstadoBuscadorPanel(panelId) {
    const panel = document.getElementById(`panel-${panelId}`);
    if (!panel) return;

    panel.innerHTML = `
        <div class="search-panel-wrapper">
            <label class="panel-label">Panel ${panelId}</label>
            <input 
                type="text" 
                id="search-input-${panelId}" 
                class="compare-search-input" 
                placeholder="Busca una obra por nombre, artista, tema..." 
                autocomplete="off"
            >
            <p class="panel-status-text" id="status-${panelId}">Busca y elige una obra para comparar.</p>
            <div id="results-cascade-${panelId}" class="results-cascade"></div>
        </div>
    `;

    const input = document.getElementById(`search-input-${panelId}`);
    
    // Escuchamos la escritura del usuario aplicando DEBOUNCE de 400ms (Req. 4.6.2.2)
    input.addEventListener('input', (e) => {
        const termino = e.target.value.trim();
        
        // Limpiamos el temporizador anterior si el usuario sigue escribiendo rápido
        clearTimeout(timersDebounce[panelId]);

        if (termino.length < 3) {
            document.getElementById(`results-cascade-${panelId}`).innerHTML = '';
            document.getElementById(`status-${panelId}`).textContent = 'Busca y elige una obra para comparar.';
            return;
        }

        // Activamos el temporizador: Espera 400ms de silencio antes de disparar a la API
        timersDebounce[panelId] = setTimeout(() => {
            ejecutarBusquedaInterna(panelId, termino);
        }, 400);
    });
}

/**
 * FUNCIÓN: ejecutarBusquedaInterna
 * Llama a la API, resuelve los primeros 5-6 IDs en paralelo y pinta las mini-tarjetas.
 */
async function ejecutarBusquedaInterna(panelId, termino) {
    const statusText = document.getElementById(`status-${panelId}`);
    const cascadeContainer = document.getElementById(`results-cascade-${panelId}`);
    
    if (!statusText || !cascadeContainer) return;

    statusText.textContent = '⏳ Buscando coincidencias...';
    cascadeContainer.innerHTML = '';

    try {
        // Buscamos obras con imágenes basándonos en el término
        const dataIds = await MetApi.searchObjects(termino);

        if (!dataIds || !dataIds.objectIDs || dataIds.objectIDs.length === 0) {
            statusText.textContent = '❌ No se encontraron obras con ese término.';
            return;
        }

        statusText.textContent = '⏳ Cargando previsualizaciones...';

        // Tomamos únicamente los primeros 5 a 6 IDs (Req. 4.6.2.2)
        const subsetIds = dataIds.objectIDs.slice(0, 6);

        // Disparamos las solicitudes en paralelo controlado con Promise.allSettled
        const promesas = subsetIds.map(id => MetApi.getObject(id));
        const resultados = await Promise.allSettled(promesas);

        statusText.textContent = 'Resultados encontrados:';

        // Renderizado seguro de las mini-tarjetas en cascada utilizando el DOM nativo
        resultados.forEach(item => {
            if (item.status === 'fulfilled' && item.value) {
                const obra = item.value;
                
                // Determinamos si esta obra ya está seleccionada en el panel opuesto (Req. 4.6.4)
                const panelOpuesto = (panelId === 'A') ? obraSeleccionadaB : obraSeleccionadaA;
                const esDuplicado = panelOpuesto && String(panelOpuesto.objectID) === String(obra.objectID);

                // Creamos el contenedor de la mini-tarjeta
                const miniCard = document.createElement('div');
                miniCard.className = `mini-target-cascade ${esDuplicado ? 'disabled-card' : ''}`;

                // Imagen pequeña
                const img = document.createElement('img');
                img.src = obra.primaryImageSmall || 'https://placehold.co/80x80?text=No+Img';
                img.alt = obra.title || 'Arte';

                // Textos
                const infoDiv = document.createElement('div');
                infoDiv.className = 'mini-card-info';
                
                const title = document.createElement('h4');
                title.textContent = obra.title || 'Título Desconocido';
                
                const artist = document.createElement('p');
                artist.textContent = obra.artistDisplayName || 'Anónimo';

                infoDiv.appendChild(title);
                infoDiv.appendChild(artist);
                miniCard.appendChild(img);
                miniCard.appendChild(infoDiv);

                if (esDuplicado) {
                    const alertText = document.createElement('span');
                    alertText.className = 'duplicate-alert';
                    alertText.textContent = 'Ya seleccionada';
                    miniCard.appendChild(alertText);
                } else {
                    // Si no es duplicado, el usuario puede hacer clic para fijarla
                    miniCard.addEventListener('click', () => {
                        if (panelId === 'A') obraSeleccionadaA = obra;
                        if (panelId === 'B') obraSeleccionadaB = obra;
                        renderObraFijadaPanel(panelId, obra);
                    });
                }

                cascadeContainer.appendChild(miniCard);
            }
        });

    } catch (error) {
        console.error("Error en búsqueda interna del comparador:", error);
        statusText.textContent = '❌ Error en la búsqueda. Inténtalo de nuevo.';
    }
}

/**
 * FUNCIÓN: renderObraFijadaPanel
 * Muestra la tarjeta definitiva de la obra seleccionada en su respectivo panel.
 */
function renderObraFijadaPanel(panelId, obra) {
    const panel = document.getElementById(`panel-${panelId}`);
    if (!panel) return;

    panel.innerHTML = `
        <div class="fixed-artwork-card">
            <span class="panel-badge">Panel ${panelId}</span>
            <img class="compare-img" src="${obra.primaryImageSmall || 'https://placehold.co/300x400?text=Sin+Imagen'}" alt="${obra.title || 'Obra'}">
            <h3 class="artwork-title-mini">${obra.title || 'Título Desconocido'}</h3>
            <p class="artwork-artist-mini">${obra.artistDisplayName || 'Artista Anónimo'}</p>
            <button id="btn-change-${panelId}" class="btn-change-selection">Cambiar selección</button>
        </div>
    `;

    document.getElementById(`btn-change-${panelId}`).addEventListener('click', () => {
        if (panelId === 'A') obraSeleccionadaA = null;
        if (panelId === 'B') obraSeleccionadaB = null;
        
        const tableContainer = document.getElementById('compare-table-container');
        if (tableContainer) tableContainer.className = 'hidden';
        
        renderEstadoBuscadorPanel(panelId);
    });
    
    // NOTA: La verificación cruzada y disparo de la Tabla Comparativa se conectará en la Fase 3.
}