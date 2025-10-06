// Función para validar RUT chileno
function validarRut(rut) {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace(/\-/g, '').trim().toLowerCase();
    
    // Verificar formato
    if (!/^\d{7,8}[0-9kK]?$/.test(rut)) {
        return false;
    }

    // Separar número y dígito verificador
    let numero = rut.slice(0, -1);
    let dv = rut.slice(-1);
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = numero.length - 1; i >= 0; i--) {
        suma += parseInt(numero.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    let dvEsperado = 11 - (suma % 11);
    dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString();
    
    return dv === dvEsperado;
}

// Función para formatear RUT
function formatearRut(rut) {
    // Eliminar todo lo que no sea número ni 'k' y convertir a minúsculas
    rut = rut.replace(/[^0-9kK]/g, '').toLowerCase();
    
    // Agregar puntos y guión
    if (rut.length > 1) {
        rut = rut.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + rut.slice(-1);
    }
    
    return rut;
}

export { validarRut, formatearRut };
