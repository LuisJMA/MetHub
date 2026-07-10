// js/views/views/detail.js

/**
 * FUNCIÓN CENTRAL: renderDetail
 * Recibe el ID que el enrutador cortó de la URL y monta la pantalla de detalle.
 */
async function renderDetail(id) {
    const app = document.getElementById('app');
    
    // 1. COLOCAMOS UN ESTADO DE CARGA (Loader) MIENTRAS LLEGAN LOS DATOS
    app.innerHTML = `
        <div class="view-container">
            <button id="btn-back" class="btn-secondary">⬅️ Volver a Explorar</button>
            <div id="detail-loader" class="loader">Cargando detalles de la obra...</div>
            <div id="detail-content" class="hidden"></div>
        </div>
    `;

    // Configurar el botón de volver atrás usando el historial del navegador
    document.getElementById('btn-back').addEventListener('click', () => {
        window.history.back();
    });

    try {
        // 2. PEDIR LOS DATOS REALES A LA API
        // Usamos el método getObject(id) que ya programaste en MetApi
        const obra = await MetApi.getObject(id);
        
        const loader = document.getElementById('detail-loader');
        const contentContainer = document.getElementById('detail-content');

        if (loader) loader.classList.add('hidden');

        // 3. RENDERIZADO SEGURO (Cero innerHTML)
        // Creamos la estructura con elementos nativos de JS para evitar inyecciones XSS
        const detailWrapper = document.createElement('div');
        detailWrapper.className = 'detail-grid';

        // Sección de la Imagen
        const imgContainer = document.createElement('div');
        imgContainer.className = 'detail-image-container';
        
        const img = document.createElement('img');
        img.className = 'detail-img';
        // Si no hay imagen grande (primaryImage), usamos el placeholder gris
        img.src = obra.primaryImage || 'https://placehold.co/400x500?text=Sin+Imagen+Disponible';
        img.alt = obra.title || 'Obra del museo';
        imgContainer.appendChild(img);

        // Sección de Información (Metadatos)
        const infoContainer = document.createElement('div');
        infoContainer.className = 'detail-info';

        const title = document.createElement('h1');
        title.textContent = obra.title || 'Título Desconocido';

        const artist = document.createElement('p');
        artist.innerHTML = `<strong>Artista:</strong> ${obra.artistDisplayName || 'Anónimo'}`;

        const date = document.createElement('p');
        date.innerHTML = `<strong>Fecha:</strong> ${obra.objectDate || 'Fecha desconocida'}`;

        const culture = document.createElement('p');
        culture.innerHTML = `<strong>Cultura:</strong> ${obra.culture || 'No especificada'}`;

        const medium = document.createElement('p');
        medium.innerHTML = `<strong>Medio / Técnica:</strong> ${obra.medium || 'No especificado'}`;

        const dimensions = document.createElement('p');
        dimensions.innerHTML = `<strong>Dimensiones:</strong> ${obra.dimensions || 'No especificadas'}`;

        // Metemos todos los textos en su contenedor
        infoContainer.appendChild(title);
        infoContainer.appendChild(artist);
        infoContainer.appendChild(date);
        infoContainer.appendChild(culture);
        infoContainer.appendChild(medium);
        infoContainer.appendChild(dimensions);

        // Juntamos la imagen y la info en el contenedor principal
        detailWrapper.appendChild(imgContainer);
        detailWrapper.appendChild(infoContainer);

        // Mostramos el contenido real en la pantalla
        if (contentContainer) {
            contentContainer.appendChild(detailWrapper);
            contentContainer.classList.remove('hidden');
        }

    } catch (error) {
        // En caso de que el ID no exista o la API falle
        const loader = document.getElementById('detail-loader');
        if (loader) loader.classList.add('hidden');

        const contentContainer = document.getElementById('detail-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <p class="error-message">❌ No se pudieron cargar los detalles de esta obra. Es posible que el servidor del MET esté congestionado.</p>
            `;
            contentContainer.classList.remove('hidden');
        }
        console.error("Error al obtener detalle de la obra:", error);
    }
}