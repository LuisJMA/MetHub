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
        '#detail': (id) => renderDetail(id),
        '#departments': () => renderDepartments(),
        '#compare': () => renderCompare()
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
        // Captura el hash actual (ej: "#explore"). 
        // Si está vacío (porque el usuario acaba de entrar a la web), por defecto le asignamos '#home'.
        const hash = window.location.hash || '#home';
        
        // Buscamos nuestro contenedor principal (en el HTML).
        const appContainer = document.getElementById('app');
        
        /**
         * Borramos todo lo que había de la pantalla anterior.
         */
        appContainer.textContent = '';

        /**
         * CASO ESPECIAL (Rutas con ID dinámico):
         * Si el hash empieza con '#detail/', significa que el usuario quiere ver una obra específica (ej: #detail/436535).
         * No podemos buscar "#detail/436535" directamente en nuestro diccionario 'routes' porque ese número cambia siempre.
         */
        if (hash.startsWith('#detail/')) {
            // Dividimos el texto usando la barra '/' como separador. 
            // Si el texto es "#detail/436535", split('/') nos devuelve un arreglo: ["#detail", "436535"].
            // Guardamos la posición [1], que es justamente el número de ID de la obra.
            const id = hash.split('/')[1];
            
            // Buscamos la ruta '#detail' en nuestro diccionario y la ejecutamos pasándole el ID como argumento.
            this.routes['#detail'](id);
            
            // Cortamos la ejecución de la función aquí con un 'return' para que no intente ejecutar el código de abajo.
            return;
        }

        /**
         * CASO NORMAL:
         * Si la ruta existe textualmente en nuestro diccionario (ej: '#explore'), ejecutamos su función asociada.
         */
        if (this.routes[hash]) {
            this.routes[hash]();
        } else {
            // Si el usuario se pone creativo y escribe una ruta que no existe (ej: '#perrito'), 
            // el sistema lo rescata y lo redirige automáticamente a la pantalla de Inicio.
            this.routes['#home']();
        }
    }

};


// --- 4. FUNCIONES TEMPORALES DE RENDERIZADO ---
// Estas funciones simulan las pantallas de la app de forma temporal. 
// Crean un título HTML en el aire y lo meten dentro del contenedor '#app'.

function renderHome() {
    const app = document.getElementById('app');
    const h1 = document.createElement('h1');
    h1.textContent = "Bienvenido a la Página Principal (#home)";
    app.appendChild(h1);
}


function renderDetail(id) {
    const app = document.getElementById('app');
    const h1 = document.createElement('h1');
    // Usamos comillas invertidas (backticks) para poder meter la variable 'id' directamente en el texto
    h1.textContent = `Detalle de la Obra con ID: ${id} (#detail)`;
    app.appendChild(h1);
}

function renderDepartments() {
    const app = document.getElementById('app');
    const h1 = document.createElement('h1');
    h1.textContent = "Áreas Curatoriales y Departamentos (#departments)";
    app.appendChild(h1);
}

function renderCompare() {
    const app = document.getElementById('app');
    const h1 = document.createElement('h1');
    h1.textContent = "Comparador de Obras Lado a Lado (#compare)";
    app.appendChild(h1);
}