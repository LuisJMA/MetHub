// js/views/compare.js

// Variables de estado global para la vista del comparador
let obraSeleccionadaA = null;
let obraSeleccionadaB = null;

/**
 * FUNCIÓN CENTRAL: renderCompare
 * Monta el cascarón de los paneles y gestiona la preselección desde Detalle.
 */
async function renderCompare() {
    const app = document.getElementById('app');
    
    // Capturamos el hash actual para ver si viene un ID de preselección (ej: #compare/436535)
    const hash = window.location.hash;
    let idPreseleccionado = null;
    
    if (hash.includes('/') && hash.split('/')[1]) {
        idPreseleccionado = hash.split('/')[1].trim();
    }

    // 1. Inyectamos la estructura estática controlada con los dos paneles vacíos
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

    // 2. Inicializamos de forma independiente el estado visual de cada panel
    // Inicialmente ambos muestran su buscador interno vacío
    renderEstadoBuscadorPanel('A');
    renderEstadoBuscadorPanel('B');

    // 3. REQUISITO 4.6.7: Si hay un ID preseleccionado por URL, lo clavamos en el Panel A
    if (idPreseleccionado) {
        const panelA = document.getElementById('panel-A');
        if (panelA) {
            panelA.innerHTML = `<div class="loader-mini">Cargando obra preseleccionada...</div>`;
            try {
                const obra = await MetApi.getObject(idPreseleccionado);
                obraSeleccionadaA = obra;
                // Dibujamos la obra fijada en el panel A
                renderObraFijadaPanel('A', obra);
            } catch (error) {
                console.error("Error al cargar obra preseleccionada:", error);
                renderEstadoBuscadorPanel('A'); // Si falla, vuelve al buscador
            }
        }
    }
}

/**
 * FUNCIÓN: renderEstadoBuscadorPanel
 * Dibuja el input de texto inicial para un panel específico (A o B).
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
                placeholder="Busca una obra por nombre, artista..." 
                autocomplete="off"
            >
            <p class="panel-status-text" id="status-${panelId}">Busca y elige una obra para comparar.</p>
            <div id="results-cascade-${panelId}" class="results-cascade"></div>
        </div>
    `;
    
    // Aquí conectaremos el Debounce en la siguiente fase...
}

/**
 * FUNCIÓN: renderObraFijadaPanel
 * Muestra la tarjeta definitiva de la obra elegida en su respectivo panel.
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
}