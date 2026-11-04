document.addEventListener('DOMContentLoaded', () => {
    // 1. CONTROL DEL FORMULARIO DE FEEDBACK
    const formulario = document.getElementById('form-feedback');

    if (formulario) {
        formulario.addEventListener('submit', (event) => {
            // Evitamos que la página se recargue por defecto al enviar
            event.preventDefault();

            // Capturamos los valores que ha introducido el usuario
            const nombreUsuario = document.getElementById('nombre').value.trim();
            const mensajeUsuario = document.getElementById('mensaje').value.trim();

            // Validación básica de seguridad por si acaso
            if (nombreUsuario === "" || mensajeUsuario === "") {
                alert("Por favor, rellena todos los campos antes de enviar.");
                return;
            }

            // Creamos un mensaje visual de éxito dinámico
            const mensajeExito = document.createElement('div');
            mensajeExito.style.marginTop = '20px';
            mensajeExito.style.padding = '15px';
            mensajeExito.style.backgroundColor = 'rgba(0, 229, 255, 0.1)';
            mensajeExito.style.border = '1px solid #00e5ff';
            mensajeExito.style.borderRadius = '6px';
            mensajeExito.style.color = '#00e5ff';
            mensajeExito.style.textAlign = 'center';
            mensajeExito.style.fontWeight = '600';
            mensajeExito.innerHTML = `¡Gracias por tu feedback, ${nombreUsuario}! Tu opinión ha sido registrada correctamente.`;

            // Añadimos el mensaje de éxito al final de la sección de feedback
            formulario.appendChild(mensajeExito);

            // Limpiamos los campos del formulario para que quede listo otra vez
            formulario.reset();

            // Borramos el mensaje de éxito automáticamente a los 5 segundos
            setTimeout(() => {
                mensajeExito.remove();
            }, 5000);
        });
    }

    // 2. EFECTO VISUAL EN LA BARRA DE NAVEGACIÓN
    // Cambia el estilo de la barra superior cuando el usuario hace scroll
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.style.backgroundColor = 'rgba(13, 12, 29, 0.98)';
            nav.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        } else {
            nav.style.backgroundColor = 'rgba(13, 12, 29, 0.95)';
            nav.style.boxShadow = 'none';
        }
    });
});
