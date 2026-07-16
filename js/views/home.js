// js/views/home.js

/**
 * FUNCIÓN CENTRAL: renderHome
 * Renderiza la página de bienvenida con estadísticas y una galería de obras maestras destacadas.
 */
async function renderHome() {
    const app = document.getElementById('app');
    if (!app) return;

    // 1. ESTRUCTURA BASE: Banner de bienvenida, estadísticas y sección de destacados
    app.innerHTML = `
        <div class="view-container">
            <!-- Hero Section -->
            <section class="explore-header" style="text-align: center; margin-bottom: 40px; padding: 40px 20px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%); border-radius: 16px;">
                <h1 style="font-size: 3rem; font-weight: 800; margin-bottom: 15px; background: linear-gradient(to right, var(--brand-color), #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    El Arte te Espera
                </h1>
                <p style="font-size: 1.2rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 25px auto; line-height: 1.6;">
                    Explora más de 5,000 años de creatividad humana a través del catálogo abierto del Museo Metropolitano de Arte de Nueva York.
                </p>
                <a href="#explore" class="btn-primary" style="display: inline-block; padding: 12px 30px; font-weight: 700; border-radius: 30px; text-decoration: none; transition: transform 0.2s;">
                    Comenzar a Explorar 🚀
                </a>
            </section>

            <!-- Estadísticas en Vivo -->
            <section style="margin-bottom: 50px;">
                <div class="aggregates-card" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="agg-item">
                        <span class="agg-icon">🏛️</span>
                        <div class="agg-info">
                            <label>Colección Abierta</label>
                            <strong>+470k Obras</strong>
                        </div>
                    </div>
                    <div class="agg-item">
                        <span class="agg-icon">🎨</span>
                        <div class="agg-info">
                            <label>Secciones Curatoriales</label>
                            <strong>19 Departamentos</strong>
                        </div>
                    </div>
                    <div class="agg-item">
                        <span class="agg-icon">⚡</span>
                        <div class="agg-info">
                            <label>Acceso Directo</label>
                            <strong>API en Tiempo Real</strong>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sección de Obras Destacadas -->
            <section>
                <h2 style="font-size: 1.8rem; margin-bottom: 25px; color: var(--text-main); font-weight: 700; border-left: 5px solid var(--brand-color); padding-left: 15px;">
                    Obras Maestras Recomendadas
                </h2>
                
                <div id="home-loader" class="loader-container">
                    <div class="spinner"></div>
                    <p>Preparando la galería de bienvenida...</p>
                </div>

                <div id="featured-grid" class="results-grid hidden"></div>
            </section>
        </div>
    `;

    // Lista fija de IDs de obras de arte icónicas y hermosas del MET para la página de inicio:
    // 436535: Van Gogh (La llanura de Auvers), 438015: Monet (Nenúfares), 437394: Pierre-Auguste Renoir, etc.
    const featuredIds = [436535, 438015, 437394, 459123, 437980, 436529];

    const loader = document.getElementById('home-loader');
    const gridContainer = document.getElementById('featured-grid');

    try {
        // 2. LLAMADAS CONCURRENTES PARALELAS SEGURAS
        const promesas = featuredIds.map(id => MetApi.getObject(id));
        const resultados = await Promise.allSettled(promesas);

        if (loader) loader.classList.add('hidden');

        // 3. RENDERIZADO SEGURO DE LAS TARJETAS (Cero innerHTML)
        resultados.forEach(resultado => {
            if (resultado.status !== 'fulfilled' || !resultado.value) return;

            const obra = resultado.value;

            const card = document.createElement('div');
            card.className = 'card-item';

            const img = document.createElement('img');
            img.className = 'card-img';
            img.src = obra.primaryImageSmall || 'https://placehold.co/300x400?text=Sin+Imagen';
            img.alt = obra.title || 'Obra Destacada';

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

            // Ensamblaje
            cardInfo.appendChild(title);
            cardInfo.appendChild(artist);
            cardInfo.appendChild(viewMoreBtn);

            card.appendChild(img);
            card.appendChild(cardInfo);

            gridContainer.appendChild(card);
        });

        if (gridContainer) {
            gridContainer.classList.remove('hidden');
        }

    } catch (error) {
        if (loader) loader.classList.add('hidden');
        console.error("Error al cargar obras de la página de inicio:", error);
    }
}