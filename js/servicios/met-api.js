// js/servicios/met-api.js

// La URL base del servidor del museo de Nueva York. 
const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';

/**
 * Creamos un objeto global llamado MetApi.
 * Adentro de este objeto meteremos todas las funciones que necesiten "hablar" con internet.
 */
const MetApi = {

    /**
     * FUNCIÓN AUXILIAR: _fetchWithTimeout
     * Esta función es la que hace el trabajo pesado de ir a internet, pero con un "temporizador".
     * Si el servidor del museo tarda demasiado en responder, cancela la búsqueda automáticamente.
     */
    async _fetchWithTimeout(url, timeout = 10000) { //  10 segundos
        
        // El AbortController es una herramienta nativa de JavaScript. 
        // Funciona como un interruptor de emergencia para cancelar peticiones de red.
        const controller = new AbortController();
        
        // Iniciamos un temporizador (setTimeout). Si pasan 10 segundos,
        // se ejecuta controller.abort(), que "corta el cable" de la petición.
        const timerId = setTimeout(() => controller.abort(), timeout);

        try {
            // Hacemos la petición real a internet usando 'fetch'.
            // Le pasamos la señal de nuestro interruptor de emergencia (signal).
            const response = await fetch(url, { signal: controller.signal });
            
            // Si la respuesta llegó a tiempo (antes de los 10 segundos), 
            // limpiamos el temporizador para que no se active después.
            clearTimeout(timerId);

            // Verificamos si el servidor respondió bien (código 200). 
            // Si hubo un error en el servidor (ej: código 404 o 500), lanzamos un error.
            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            // Convertimos la respuesta de texto plano a un objeto JavaScript (JSON) y la devolvemos.
            return await response.json();

        } catch (error) {
            // Si algo falló (red caída, error de servidor o se cumplieron los 10 segundos),
            // nos aseguramos de apagar el temporizador y relanzar el error para que la pantalla sepa que falló.
            clearTimeout(timerId);
            throw error;
        }
    },


    /**
     * 1. BUSCAR OBRA POR PALABRA CLAVE
     * Envía una solicitud al endpoint de búsqueda (/search?q=palabra)
     * @param {string} query - El texto que el usuario quiere buscar (ej: "sunflower")
     * @param {string} filters - Filtros adicionales opcionales en formato de texto (ej: "&hasImages=true")
     */

    async searchObjects(query, filters = '') {
        // encodeURIComponent se asegura de limpiar el texto por si el usuario escribe espacios o acentos,
        // evitando que la URL se rompa (por ejemplo, convierte un espacio en %20).
        const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}${filters}`;
        
        // Reutilizamos nuestra función con timeout para hacer la petición de forma segura
        return await this._fetchWithTimeout(url);
    },

    /**
     * 2. OBTENER DETALLES DE UNA OBRA ESPECÍFICA
     * Envía una solicitud al endpoint de objetos (/objects/ID)
     * @param {number|string} id - El número de identificación de la obra de arte (ej: 436535)
     */
    async getObject(id) {
        const url = `${BASE_URL}/objects/${id}`;
        return await this._fetchWithTimeout(url);
    },

    /**
     * 3. OBTENER LA LISTA DE DEPARTAMENTOS
     * Envía una solicitud al endpoint (/departments) para traer las 19 áreas del museo
     */
    async getDepartments() {
        const url = `${BASE_URL}/departments`;
        return await this._fetchWithTimeout(url);
    }

};

