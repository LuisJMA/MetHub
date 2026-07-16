// js/views/departments.js

/**
 * FUNCIÓN CENTRAL: renderDepartments
 * Renderiza la pantalla con la lista completa de departamentos reales del MET.
 */
async function renderDepartments() {
    const app = document.getElementById('app');
    if (!app) return;

    // 1. COLOCAMOS UN ESTADO DE CARGA (Loader) MIENTRAS CONECTAMOS CON LA API
    app.innerHTML = `
        <div class="view-container">
            <header class="explore-header">
                <h2>Departamentos del MET</h2>
                <p>Explora las colecciones del museo clasificadas por sus áreas curatoriales oficiales.</p>
            </header>
            
            <div id="departments-loader" class="loader-container">
                <div class="spinner"></div>
                <p>Cargando departamentos oficiales...</p>
            </div>
            
            <div id="departments-grid" class="results-grid hidden"></div>
        </div>
    `;

    try {
        // 2. CONSUMIR LA API REAL DEL MUSEO
        const data = await MetApi.getDepartments();
        
        const loader = document.getElementById('departments-loader');
        const gridContainer = document.getElementById('departments-grid');

        if (loader) loader.classList.add('hidden');

        // Validamos que la API nos haya devuelto departamentos válidos
        if (!data || !data.departments || data.departments.length === 0) {
            if (gridContainer) {
                gridContainer.innerHTML = `
                    <p class="error-message">⚠️ No se encontraron departamentos disponibles en este momento.</p>
                `;
                gridContainer.classList.remove('hidden');
            }
            return;
        }

        // 3. RENDERIZADO SEGURO DE LAS TARJETAS (Cero innerHTML)
        data.departments.forEach(dept => {
            const card = document.createElement('div');
            card.className = 'card-item';
            card.style.cursor = 'pointer';
            card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

            // Contenedor visual de la tarjeta
            const cardInfo = document.createElement('div');
            cardInfo.className = 'card-info';
            cardInfo.style.padding = '20px';
            cardInfo.style.display = 'flex';
            cardInfo.style.flexDirection = 'column';
            cardInfo.style.justifyContent = 'space-between';
            cardInfo.style.height = '100%';

            // Ícono decorativo según el departamento para mejorar la experiencia de usuario
            const iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '2.5rem';
            iconSpan.style.marginBottom = '15px';
            iconSpan.textContent = obtenerIconoDepartamento(dept.departmentId);

            // Título del departamento
            const title = document.createElement('h3');
            title.className = 'card-title';
            title.textContent = dept.displayName;
            title.style.fontSize = '1.1rem';
            title.style.margin = '0 0 15px 0';

            // Botón de acción interactivo
            const exploreBtn = document.createElement('button');
            exploreBtn.className = 'card-btn';
            exploreBtn.textContent = 'Ver Colección';
            exploreBtn.style.marginTop = 'auto';

            // Ensamblaje seguro
            cardInfo.appendChild(iconSpan);
            cardInfo.appendChild(title);
            cardInfo.appendChild(exploreBtn);
            card.appendChild(cardInfo);

            // Efecto Hover visual por JS
            card.addEventListener('mouseover', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            });
            card.addEventListener('mouseout', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            });

            // LOGICA DE REDIRECCIÓN FILTRADA:
            // Al hacer clic en la tarjeta, redirige a explore inyectando el departamento en el selector
            card.addEventListener('click', () => {
                window.location.hash = '#explore';
                
                // Esperamos un instante a que el router pinte explore e inyectamos el valor
                setTimeout(() => {
                    const selector = document.getElementById('department-select');
                    if (selector) {
                        selector.value = dept.departmentId;
                        // Disparamos la búsqueda automáticamente simulando un envío del formulario
                        const searchForm = document.getElementById('search-form');
                        if (searchForm) {
                            const event = new Event('submit', { cancelable: true });
                            searchForm.dispatchEvent(event);
                        }
                    }
                }, 100);
            });

            gridContainer.appendChild(card);
        });

        if (gridContainer) {
            gridContainer.classList.remove('hidden');
        }

    } catch (error) {
        const loader = document.getElementById('departments-loader');
        if (loader) loader.classList.add('hidden');

        const gridContainer = document.getElementById('departments-grid');
        if (gridContainer) {
            gridContainer.innerHTML = `
                <p class="error-message">❌ Hubo un error al conectar con el servidor del MET. Por favor, recarga la página.</p>
            `;
            gridContainer.classList.remove('hidden');
        }
        console.error("Error al obtener los departamentos:", error);
    }
}

/**
 * Función auxiliar para asignar un ícono temático visual a cada departamento
 */
function obtenerIconoDepartamento(id) {
    const iconos = {
        1: '🇺🇸',  // Artes Decorativas Americanas
        3: '🏺',  // Arte del Antiguo Oriente Próximo
        4: '🛡️',  // Armas y Armaduras
        5: '🗿',  // Arte de África, Oceanía y América
        6: '🏮',  // Arte Asiático
        7: '🏰',  // The Cloisters
        8: '👗',  // Instituto del Vestido
        9: '✍️',  // Dibujos y Grabados
        10: '🇪🇬', // Arte Egipcio
        11: '🎨', // Pinturas Europeas
        12: '⚜️',  // Escultura y Artes Decorativas Europeas
        13: '🏛️', // Arte Griego y Romano
        14: '🕌', // Arte Islámico
        15: '💎', // Colección Robert Lehman
        16: '🛡️', // Arte Medieval
        17: '🖼️', // Arte Moderno y Contemporáneo
        18: '🎻', // Instrumentos Musicales
        19: '📷', // Fotografías
        21: '🌽'  // Arte de las Civilizaciones de América
    };
    return iconos[id] || '🏛️';
}