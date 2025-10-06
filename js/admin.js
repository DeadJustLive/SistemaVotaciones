// Importar módulos
import { guardarEnCSV, leerCSV } from './csvManager.js';
import { validarRut, formatearRut } from './validarRut.js';

// Variables globales
let votos = [];
let configuracion = {
    pregunta: "¿Cuál es tu opción preferida?",
    opciones: ["Opción 1", "Opción 2", "Opción 3"],
    fechaInicio: new Date().toISOString(),
    fechaFin: null,
    estado: "activa" // activa, pausada, finalizada
};

// Elementos del DOM
const elementos = {
    // Navegación
    sidebar: document.getElementById('sidebar'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    navLinks: document.querySelectorAll('.sidebar-nav a'),
    contentSections: document.querySelectorAll('.content-section'),
    
    // Formulario de pregunta
    preguntaForm: document.getElementById('preguntaForm'),
    inputPregunta: document.getElementById('pregunta'),
    contenedorOpciones: document.getElementById('opciones'),
    btnAgregarOpcion: document.getElementById('agregarOpcion'),
    
    // Resultados
    resultadosChart: document.getElementById('resultadosChart') ? new Chart(
        document.getElementById('resultadosChart').getContext('2d'),
        {
            type: 'bar',
            data: { labels: [], datasets: [{
                label: 'Votos',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]},
            options: {
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = Math.round((value / total) * 100) || 0;
                                return `${value} votos (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        }
    ) : null,
    
    // Elementos de la UI
    preguntaActual: document.getElementById('pregunta-actual'),
    totalVotos: document.getElementById('total-votos'),
    totalParticipantes: document.getElementById('total-participantes'),
    resumenResultados: document.getElementById('resumenResultados'),
    
    // Botones de acción
    btnExportarCSV: document.getElementById('exportarCSV'),
    btnExportarTodoCSV: document.getElementById('exportarTodoCSV'),
    btnImportarCSV: document.getElementById('importarCSV'),
    btnResetDatos: document.getElementById('resetDatos'),
    
    // Modal
    modal: document.getElementById('confirmModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    btnConfirmar: document.getElementById('confirmAction'),
    btnCancelar: document.getElementById('cancelAction'),
    btnCerrarModal: document.querySelector('.close-modal')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    inicializarEventos();
    actualizarUI();
});

// Cargar datos guardados
function cargarDatos() {
    const datosGuardados = localStorage.getItem('votacionConfig');
    if (datosGuardados) {
        try {
            const datos = JSON.parse(datosGuardados);
            configuracion = { ...configuracion, ...datos };
        } catch (e) {
            console.error('Error al cargar la configuración:', e);
        }
    }
    
    const votosGuardados = localStorage.getItem('votos');
    if (votosGuardados) {
        try {
            votos = JSON.parse(votosGuardados);
        } catch (e) {
            console.error('Error al cargar los votos:', e);
        }
    }
}

// Guardar datos
function guardarDatos() {
    try {
        localStorage.setItem('votacionConfig', JSON.stringify(configuracion));
        localStorage.setItem('votos', JSON.stringify(votos));
        return true;
    } catch (e) {
        console.error('Error al guardar los datos:', e);
        return false;
    }
}

// Inicializar eventos
function inicializarEventos() {
    // Navegación
    if (elementos.toggleSidebar) {
        elementos.toggleSidebar.addEventListener('click', () => {
            elementos.sidebar.classList.toggle('collapsed');
        });
    }
    
    elementos.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-section');
            if (target) {
                mostrarSeccion(target);
                elementos.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // Formulario de pregunta
    if (elementos.preguntaForm) {
        elementos.preguntaForm.addEventListener('submit', manejarEnvioFormulario);
    }
    
    // Botón agregar opción
    if (elementos.btnAgregarOpcion) {
        elementos.btnAgregarOpcion.addEventListener('click', agregarCampoOpcion);
    }
    
    // Delegación de eventos para botones eliminar opción
    if (elementos.contenedorOpciones) {
        elementos.contenedorOpciones.addEventListener('click', (e) => {
            if (e.target.closest('.btn-eliminar-opcion')) {
                const opcionItem = e.target.closest('.opcion-item');
                if (opcionItem && elementos.contenedorOpciones.children.length > 2) {
                    opcionItem.remove();
                    actualizarIndicesOpciones();
                }
            }
        });
    }
    
    // Botones de exportación
    if (elementos.btnExportarCSV) {
        elementos.btnExportarCSV.addEventListener('click', exportarResultadosCSV);
    }
    
    if (elementos.btnExportarTodoCSV) {
        elementos.btnExportarTodoCSV.addEventListener('click', exportarTodoCSV);
    }
    
    // Importar CSV
    if (elementos.btnImportarCSV) {
        elementos.btnImportarCSV.addEventListener('change', importarCSV);
    }
    
    // Reset de datos
    if (elementos.btnResetDatos) {
        elementos.btnResetDatos.addEventListener('click', () => {
            mostrarConfirmacion(
                'Restablecer datos',
                '¿Estás seguro de que deseas eliminar todos los datos de la votación?',
                resetearDatos
            );
        });
    }
    
    // Modal
    if (elementos.btnCerrarModal) {
        elementos.btnCerrarModal.addEventListener('click', cerrarModal);
    }
    
    if (elementos.btnCancelar) {
        elementos.btnCancelar.addEventListener('click', cerrarModal);
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === elementos.modal) {
            cerrarModal();
        }
    });
}

// Manejar envío del formulario
function manejarEnvioFormulario(e) {
    e.preventDefault();
    
    // Obtener la pregunta
    const pregunta = elementos.inputPregunta.value.trim();
    if (!pregunta) {
        mostrarError('La pregunta no puede estar vacía');
        return;
    }
    
    // Obtener las opciones
    const opciones = [];
    const inputsOpciones = elementos.contenedorOpciones.querySelectorAll('input[type="text"]');
    
    inputsOpciones.forEach((input, index) => {
        const valor = input.value.trim();
        if (valor) {
            opciones.push(valor);
        }
    });
    
    if (opciones.length < 2) {
        mostrarError('Debe haber al menos dos opciones');
        return;
    }
    
    // Actualizar configuración
    configuracion.pregunta = pregunta;
    configuracion.opciones = opciones;
    configuracion.fechaInicio = new Date().toISOString();
    
    // Guardar y actualizar UI
    if (guardarDatos()) {
        actualizarUI();
        mostrarExito('Configuración guardada correctamente');
    } else {
        mostrarError('Error al guardar la configuración');
    }
}

// Agregar campo de opción
function agregarCampoOpcion() {
    if (elementos.contenedorOpciones.children.length >= 10) {
        mostrarError('No se pueden agregar más de 10 opciones');
        return;
    }
    
    const index = elementos.contenedorOpciones.children.length + 1;
    const opcionHTML = `
        <div class="opcion-item">
            <input type="text" name="opcion[]" placeholder="Opción ${index}" required>
            <button type="button" class="btn-eliminar-opcion">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    elementos.contenedorOpciones.insertAdjacentHTML('beforeend', opcionHTML);
    
    // Habilitar botones de eliminar si hay más de 2 opciones
    if (elementos.contenedorOpciones.children.length > 2) {
        document.querySelectorAll('.btn-eliminar-opcion').forEach(btn => {
            btn.disabled = false;
        });
    }
}

// Actualizar índices de las opciones
function actualizarIndicesOpciones() {
    const opciones = elementos.contenedorOpciones.querySelectorAll('.opcion-item');
    opciones.forEach((opcion, index) => {
        const input = opcion.querySelector('input');
        input.placeholder = `Opción ${index + 1}`;
    });
    
    // Deshabilitar botones de eliminar si solo hay 2 opciones
    if (opciones.length <= 2) {
        document.querySelectorAll('.btn-eliminar-opcion').forEach(btn => {
            btn.disabled = true;
        });
    }
}

// Mostrar sección específica
function mostrarSeccion(seccionId) {
    elementos.contentSections.forEach(seccion => {
        seccion.classList.toggle('active', seccion.id === seccionId);
    });
    
    // Actualizar gráfico si es la sección de resultados
    if (seccionId === 'resultados') {
        actualizarGraficoResultados();
    }
}

// Actualizar gráfico de resultados
function actualizarGraficoResultados() {
    if (!elementos.resultadosChart) return;
    
    const conteoVotos = contarVotos();
    
    elementos.resultadosChart.data.labels = configuracion.opciones;
    elementos.resultadosChart.data.datasets[0].data = conteoVotos;
    elementos.resultadosChart.update();
    
    // Actualizar resumen de resultados
    actualizarResumenResultados(conteoVotos);
}

// Contar votos por opción
function contarVotos() {
    const conteo = new Array(configuracion.opciones.length).fill(0);
    
    votos.forEach(voto => {
        if (voto.opcionIndex >= 0 && voto.opcionIndex < conteo.length) {
            conteo[voto.opcionIndex]++;
        }
    });
    
    return conteo;
}

// Actualizar resumen de resultados
function actualizarResumenResultados(conteoVotos) {
    if (!elementos.resumenResultados) return;
    
    const totalVotos = conteoVotos.reduce((a, b) => a + b, 0);
    let html = '<h3>Resumen de Votación</h3>';
    
    if (totalVotos === 0) {
        html += '<p>No hay votos registrados aún.</p>';
    } else {
        html += '<div class="results-summary">';
        
        conteoVotos.forEach((votos, index) => {
            const porcentaje = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
            html += `
                <div class="result-item">
                    <span class="result-label">${configuracion.opciones[index]}:</span>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${porcentaje}%;">${porcentaje}%</div>
                    </div>
                    <span class="result-count">${votos} votos</span>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    elementos.resumenResultados.innerHTML = html;
}

// Exportar resultados a CSV
async function exportarResultadosCSV() {
    const conteoVotos = contarVotos();
    const datos = configuracion.opciones.map((opcion, index) => ({
        'Opción': opcion,
        'Votos': conteoVotos[index],
        'Porcentaje': totalVotos > 0 ? 
            `${Math.round((conteoVotos[index] / totalVotos) * 100)}%` : '0%'
    }));
    
    const fecha = new Date().toISOString().split('T')[0];
    await guardarEnCSV(datos, `resultados_votacion_${fecha}.csv`);
}

// Exportar todos los datos a CSV
async function exportarTodoCSV() {
    const datos = votos.map((voto, index) => ({
        'ID': index + 1,
        'RUT': voto.rut,
        'Opción': configuracion.opciones[voto.opcionIndex] || 'Desconocida',
        'Fecha': new Date(voto.fecha).toLocaleString(),
        'Dirección IP': voto.ip || 'No disponible'
    }));
    
    const fecha = new Date().toISOString().split('T')[0];
    await guardarEnCSV(datos, `datos_completos_${fecha}.csv`);
}

// Importar datos desde CSV
async function importarCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    
    try {
        const datos = await leerCSV(archivo);
        // Aquí puedes procesar los datos importados según sea necesario
        console.log('Datos importados:', datos);
        mostrarExito('Datos importados correctamente');
    } catch (error) {
        console.error('Error al importar el archivo:', error);
        mostrarError('Error al importar el archivo');
    }
    
    // Limpiar el input para permitir cargar el mismo archivo de nuevo
    event.target.value = '';
}

// Reiniciar todos los datos
function resetearDatos() {
    if (confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('votacionConfig');
        localStorage.removeItem('votos');
        location.reload();
    }
}

// Mostrar confirmación
function mostrarConfirmacion(titulo, mensaje, callback) {
    if (!elementos.modal) return;
    
    elementos.modalTitle.textContent = titulo;
    elementos.modalMessage.textContent = mensaje;
    
    // Eliminar el manejador anterior si existe
    const nuevoBtnConfirmar = elementos.btnConfirmar.cloneNode(true);
    elementos.btnConfirmar.parentNode.replaceChild(nuevoBtnConfirmar, elementos.btnConfirmar);
    elementos.btnConfirmar = nuevoBtnConfirmar;
    
    elementos.btnConfirmar.onclick = () => {
        if (typeof callback === 'function') {
            callback();
        }
        cerrarModal();
    };
    
    elementos.modal.style.display = 'block';
}

// Cerrar modal
function cerrarModal() {
    if (elementos.modal) {
        elementos.modal.style.display = 'none';
    }
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    // Implementar lógica para mostrar mensajes de error
    console.error(mensaje);
    alert(`Error: ${mensaje}`);
}

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
    // Implementar lógica para mostrar mensajes de éxito
    console.log(mensaje);
    alert(`Éxito: ${mensaje}`);
}

// Actualizar la interfaz de usuario
function actualizarUI() {
    // Actualizar formulario
    if (elementos.inputPregunta) {
        elementos.inputPregunta.value = configuracion.pregunta || '';
    }
    
    // Actualizar opciones
    if (elementos.contenedorOpciones) {
        elementos.contenedorOpciones.innerHTML = '';
        
        const opciones = configuracion.opciones.length > 0 ? 
            configuracion.opciones : ['Opción 1', 'Opción 2'];
        
        opciones.forEach((opcion, index) => {
            const opcionHTML = `
                <div class="opcion-item">
                    <input type="text" name="opcion[]" value="${opcion}" placeholder="Opción ${index + 1}" required>
                    <button type="button" class="btn-eliminar-opcion" ${opciones.length <= 2 ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            elementos.contenedorOpciones.insertAdjacentHTML('beforeend', opcionHTML);
        });
    }
    
    // Actualizar panel de inicio
    if (elementos.preguntaActual) {
        elementos.preguntaActual.textContent = configuracion.pregunta || 'No hay pregunta configurada';
    }
    
    // Actualizar contadores
    const totalVotos = votos.length;
    if (elementos.totalVotos) {
        elementos.totalVotos.textContent = totalVotos;
    }
    
    if (elementos.totalParticipantes) {
        // Contar participantes únicos por RUT
        const participantesUnicos = new Set(votos.map(voto => voto.rut));
        elementos.totalParticipantes.textContent = participantesUnicos.size;
    }
    
    // Actualizar gráfico si está en la sección de resultados
    if (document.querySelector('#resultados.active')) {
        actualizarGraficoResultados();
    }
}

// Inicializar la aplicación
function inicializarAplicacion() {
    cargarDatos();
    inicializarEventos();
    actualizarUI();
    
    // Mostrar la sección de inicio por defecto
    mostrarSeccion('inicio');
}

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
    inicializarAplicacion();
}

// Hacer que las funciones estén disponibles globalmente si es necesario
window.validarRut = validarRut;
window.formatearRut = formatearRut;
