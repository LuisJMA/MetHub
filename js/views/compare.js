// js/views/compare.js

/**
 * FUNCIÓN CENTRAL: renderCompare
 * Monta la interfaz del comparador en el contenedor principal.
 */
function renderCompare() {
    const app = document.getElementById('app');
    
    // 1. Dibujamos la estructura inicial: Un formulario con dos inputs para los IDs
    app.innerHTML = `
        <div class="view-container">
            <h1 class="view-title">⚖️ Comparador de Obras Lado a Lado</h1>
            <p class="view-description">Introduce el ID de dos obras del MET para contrastar su información y arte.</p>
            
            <form id="compare-form" class="compare-form-container">
                <div class="input-group">
                    <label for="compare-id-1">Obra 1 (ID):</label>
                    <input type="number" id="compare-id-1" required placeholder="Ej: 436535">
                </div>
                <div class="input-group">
                    <label for="compare-id-2">Obra 2 (ID):</label>
                    <input type="number" id="compare-id-2" required placeholder="Ej: 437984">
                </div>
                <button type="submit" class="btn-primary">Comparar Obras</button>
            </form>

            <div id="compare-results" class="compare-grid hidden"></div>
        </div>
    `;

    // 2. Escuchamos el envío del formulario
    const form = document.getElementById('compare-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos que la página se recargue
        
        const id1 = document.getElementById('compare-id-1').value.trim();
        const id2 = document.getElementById('compare-id-2').value.trim();
        
        await ejecutarComparacion(id1, id2);
    });
}

/**
 * FUNCIÓN AUXILIAR: ejecutarComparacion
 * Pide los datos de ambas obras al mismo tiempo y las renderiza de forma segura.
 */
async function ejecutarComparacion(id1, id2) {
    const resultsContainer = document.getElementById('compare-results');
    if (!resultsContainer) return;

    // Mostramos el contenedor y ponemos un mensaje de carga temporal
    resultsContainer.className = "compare-grid"; 
    resultsContainer.innerHTML = `<div class="loader-compare">Consultando ambas obras en los servidores del MET...</div>`;

    try {
        // PARALELISMO SEGURO: Disparamos ambas peticiones a la vez para ahorrar tiempo
        // Usamos Promise.all porque aquí SÍ necesitamos que ambas se cumplan con éxito para comparar
        const [obra1, obra2] = await Promise.all([
            MetApi.getObject(id1),
            MetApi.getObject(id2)
        ]);

        // Limpiamos el cargador
        resultsContainer.textContent = '';

        // Creamos las dos columnas usando el DOM nativo de forma limpia y segura (RNF-07)
        const columna1 = generarColumnaObra(obra1);
        const columna2 = generarColumnaObra(obra2);

        // Las metemos juntas al grid principal para que se pongan lado a lado
        resultsContainer.appendChild(columna1);
        resultsContainer.appendChild(columna2);

    } catch (error) {
        resultsContainer.innerHTML = `
            <p class="error-message">❌ Hubo un error al cargar las obras. Por favor, verifica que ambos IDs sean correctos y existan en el museo.</p>
        `;
        console.error("Error en el comparador:", error);
    }
}

/**
 * FUNCIÓN AUXILIAR: generarColumnaObra
 * Crea el elemento de columna DOM para una sola obra. Elige los campos clave para contrastar.
 */
function generarColumnaObra(obra) {
    const col = document.createElement('div');
    col.className = 'compare-column';

    // Imagen
    const img = document.createElement('img');
    img.className = 'compare-img';
    img.src = obra.primaryImageSmall || 'https://placehold.co/300x400?text=Sin+Imagen';
    img.alt = obra.title || 'Obra del museo';

    // Datos Técnicos organizados
    const title = document.createElement('h3');
    title.textContent = obra.title || 'Título Desconocido';

    const infoList = document.createElement('div');
    infoList.className = 'compare-info-list';

    const fields = [
        { label: 'Artista', value: obra.artistDisplayName || 'Anónimo' },
        { label: 'Fecha', value: obra.objectDate || 'Desconocida' },
        { label: 'Cultura', value: obra.culture || 'No especificada' },
        { label: 'Medio', value: obra.medium || 'No especificado' },
        { label: 'Departamento', value: obra.department || 'No especificado' }
    ];

    fields.forEach(field => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
        infoList.appendChild(p);
    });

    col.appendChild(img);
    col.appendChild(title);
    col.appendChild(infoList);

    return col;
}