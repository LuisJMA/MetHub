// js/views/detail.js

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
        const obra = await MetApi.getObject(id);
        
        const loader = document.getElementById('detail-loader');
        const contentContainer = document.getElementById('detail-content');

        if (loader) loader.classList.add('hidden');

        // 3. RENDERIZADO SEGURO (Cero innerHTML)
        const detailWrapper = document.createElement('div');
        detailWrapper.className = 'detail-grid';

        // --- COLUMNA IZQUIERDA: IMAGEN PRINCIPAL Y GALERÍA ---
        const leftColumn = document.createElement('div');
        leftColumn.className = 'detail-image-section';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'detail-image-container';

        const img = document.createElement('img');
        img.className = 'detail-img';
        img.alt = obra.title || 'Obra de arte sin título';
        img.src = obra.primaryImageSmall || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=500&auto=format&fit=crop';
        imgContainer.appendChild(img);
        leftColumn.appendChild(imgContainer);

        // GALERÍA DE IMÁGENES ADICIONALES (Máximo 8)
        if (obra.additionalImages && obra.additionalImages.length > 0) {
            const galleryTitle = document.createElement('h3');
            galleryTitle.textContent = "Imágenes Adicionales";
            galleryTitle.style.margin = "20px 0 10px 0";
            galleryTitle.style.fontSize = "1rem";
            galleryTitle.style.color = "var(--text-muted)";
            leftColumn.appendChild(galleryTitle);

            const galleryContainer = document.createElement('div');
            galleryContainer.style.display = 'flex';
            galleryContainer.style.flexWrap = 'wrap';
            galleryContainer.style.gap = '8px';

            obra.additionalImages.slice(0, 8).forEach(imgUrl => {
                const imgThumb = document.createElement('img');
                imgThumb.src = imgUrl;
                imgThumb.alt = 'Imagen adicional';
                imgThumb.style.width = '65px';
                imgThumb.style.height = '65px';
                imgThumb.style.objectFit = 'cover';
                imgThumb.style.borderRadius = '8px';
                imgThumb.style.cursor = 'pointer';
                imgThumb.style.border = '1px solid var(--bg-accent)';
                imgThumb.style.transition = 'transform 0.2s ease';

                imgThumb.addEventListener('click', () => {
                    img.src = imgUrl; // Cambia la principal al hacer clic
                });
                imgThumb.addEventListener('mouseover', () => {
                    imgThumb.style.transform = 'scale(1.05)';
                });
                imgThumb.addEventListener('mouseout', () => {
                    imgThumb.style.transform = 'scale(1.0)';
                });

                galleryContainer.appendChild(imgThumb);
            });
            leftColumn.appendChild(galleryContainer);
        }

        // --- COLUMNA DERECHA: FICHA TÉCNICA ---
        const infoContainer = document.createElement('div');
        infoContainer.className = 'detail-info';

        const title = document.createElement('h1');
        title.textContent = obra.title || 'Título desconocido';

        // ENLACE AL ARTISTA (Dina-Clickable a #artist/:name)
        const artist = document.createElement('p');
        if (obra.artistDisplayName) {
            const artistLink = document.createElement('a');
            artistLink.href = `#artist/${encodeURIComponent(obra.artistDisplayName)}`;
            artistLink.textContent = obra.artistDisplayName;
            artistLink.style.color = 'var(--brand-color)';
            artistLink.style.textDecoration = 'none';
            artistLink.style.fontWeight = '700';
            artistLink.style.borderBottom = '1px dashed var(--brand-color)';
            
            artist.innerHTML = `<strong>Artista:</strong> `;
            artist.appendChild(artistLink);
        } else {
            artist.innerHTML = `<strong>Artista:</strong> Anónimo / Desconocido`;
        }

        const date = document.createElement('p');
        date.innerHTML = `<strong>Fecha:</strong> ${obra.objectDate || 'No especificada'}`;

        const culture = document.createElement('p');
        culture.innerHTML = `<strong>Cultura:</strong> ${obra.culture || 'No especificada'}`;

        const medium = document.createElement('p');
        medium.innerHTML = `<strong>Medio / Técnica:</strong> ${obra.medium || 'No especificada'}`;

        const dimensions = document.createElement('p');
        dimensions.innerHTML = `<strong>Dimensiones:</strong> ${obra.dimensions || 'No especificadas'}`;

        // ETIQUETAS TÉCNICAS (Tags de la obra - Máximo 12)
        const tagsWrapper = document.createElement('div');
        if (obra.tags && obra.tags.length > 0) {
            const tagsTitle = document.createElement('h3');
            tagsTitle.textContent = "Etiquetas Técnicas";
            tagsTitle.style.fontSize = "0.9rem";
            tagsTitle.style.color = "var(--text-muted)";
            tagsTitle.style.marginTop = "10px";
            tagsWrapper.appendChild(tagsTitle);

            const tagsContainer = document.createElement('div');
            tagsContainer.style.display = 'flex';
            tagsContainer.style.flexWrap = 'wrap';
            tagsContainer.style.gap = '8px';
            tagsContainer.style.marginTop = '10px';

            obra.tags.slice(0, 12).forEach(tagObj => {
                const tagSpan = document.createElement('span');
                tagSpan.textContent = tagObj.term;
                tagSpan.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                tagSpan.style.color = 'var(--brand-color)';
                tagSpan.style.padding = '5px 12px';
                tagSpan.style.borderRadius = '20px';
                tagSpan.style.fontSize = '0.8rem';
                tagSpan.style.fontWeight = '600';
                tagsContainer.appendChild(tagSpan);
            });
            tagsWrapper.appendChild(tagsContainer);
        }

        // Metemos todos los textos en su contenedor
        infoContainer.appendChild(title);
        infoContainer.appendChild(artist);
        infoContainer.appendChild(date);
        infoContainer.appendChild(culture);
        infoContainer.appendChild(medium);
        infoContainer.appendChild(dimensions);
        infoContainer.appendChild(tagsWrapper);

        // Juntamos la columna izquierda y derecha en el Grid principal
        detailWrapper.appendChild(leftColumn);
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
                <p class="error-message">❌ No se pudieron cargar los detalles de esta obra. Es posible que el servidor del MET esté en mantenimiento.</p>
            `;
            contentContainer.classList.remove('hidden');
        }
        console.error("Error al obtener detalle de la obra:", error);
    }
}