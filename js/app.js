// js/app.js

/**
 * Este archivo es el "botón de encendido" de toda la aplicación.
 * Usamos el evento 'DOMContentLoaded' que dispara el navegador de forma nativa.
 * Significa: "Tan pronto como el esqueleto HTML esté completamente cargado y listo en pantalla,
 * ejecuta el código de adentro".
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // Llamamos al método init() de nuestro objeto Router para que empiece a escuchar 
    // los cambios en la URL y pinte la primera pantalla.
    Router.init();
    
});