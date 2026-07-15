// js/router.js

/**
 * Creamos un objeto global llamado Router.
 * Centralizar la navegación aquí evita tener variables sueltas por todo el proyecto
 * y hace que nuestro código sea modular y fácil de mantener.
 */
const Router = {
    
    /**
     * 1. EL DICCIONARIO DE RUTAS (O MAPA DE LA APP)
     * Aquí definimos qué función de JavaScript se debe ejecutar según el Hash (#) 
     * que aparezca en la URL del navegador.
     */
    routes: {
        '#home': () => renderHome(),
        '#explore': () => renderExplore(),
        '#detail/': (id) => renderDetail(id),
        '#departments': () => renderDepartments(),
        '#compare': () => renderCompare(),
        '#artist/': (name) => renderArtist(name) // Nueva ruta dinámica de artista (js/views/artist.js)
    },

    /**
     * 2. EL INICIALIZADOR:
     * Esta función se ejecuta una sola vez cuando la aplicación arranca.
     * Su trabajo es poner al navegador a escuchar los clics del usuario en el menú.
     */
    init() {
        // Le decimos al navegador: "Cada vez que el 'hash' (#) de la URL cambie,
        // ejecuta automáticamente nuestra función 'handleRoute'".
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Ejecutamos 'handleRoute' manualmente la primera vez que se carga el archivo.
        // ¿Por qué? Porque si el usuario escribe en la barra directamente "methub.com/#explore",
        // la página debe cargar la pantalla de exploración de inmediato sin esperar a que haga clic en nada.
        this.handleRoute();
    },



    /**
     * 3. EL CONTROLADOR (El cerebro de la navegación):
     * Esta función analiza la URL actual, limpia la pantalla y decide qué vista pintar.
     */
    handleRoute() {
        const hash = window.location.hash || '#home';
        const app = document.getElementById('app');

        // Cada vez que cambiamos de pantalla, limpiamos el contenedor principal
        if (app) app.innerHTML = '';

        // --- MANEJO DE RUTAS DINÁMICAS (PARÁMETROS) ---

        // CASO A: Detalle de Obra (#detail/ID)
        if (hash.startsWith('#detail/')) {
            const id = hash.split('/')[1];
            this.routes['#detail/'](id);
            return;
        }

        // CASO B: Obras del Artista (#artist/NombreArtista)
        if (hash.startsWith('#artist/')) {
            const rawName = hash.split('/')[1];
            // Decodificamos el nombre por si tiene caracteres especiales como espacios o tildes
            const name = decodeURIComponent(rawName);
            this.routes['#artist/'](name);
            return;
        }

        // CASO C: Comparador con o sin preselección (#compare o #compare/ID)
        if (hash.startsWith('#compare')) {
            this.routes['#compare']();
            return;
        }

        // --- CASO NORMAL (RUTAS ESTÁTICAS) ---
        if (this.routes[hash]) {
            this.routes[hash]();
        } else {
            // Si la ruta no existe, rescata al usuario llevándolo a Inicio
            window.location.hash = '#home';
        }

        // --- INDICADOR VISUAL ACTIVO  ---
        // Sincroniza dinámicamente qué enlace del menú tiene la clase '.active'
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            // Si el enlace coincide con el inicio del hash actual, lo activa
            if (href && hash.startsWith(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

};







