// Función para guardar datos en un archivo CSV
async function guardarEnCSV(datos, nombreArchivo = 'datos_votacion.csv') {
    try {
        // Convertir los datos a formato CSV
        const encabezados = Object.keys(datos[0]);
        let csvContent = encabezados.join(',') + '\n';
        
        datos.forEach(fila => {
            const filaCSV = encabezados.map(encabezado => 
                `"${String(fila[encabezado] || '').replace(/"/g, '""')}"`
            ).join(',');
            csvContent += filaCSV + '\n';
        });

        // Crear el archivo y ofrecerlo para descarga
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.setAttribute('href', url);
        enlace.setAttribute('download', nombreArchivo);
        enlace.style.display = 'none';
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        
        return true;
    } catch (error) {
        console.error('Error al guardar el archivo CSV:', error);
        return false;
    }
}

// Función para leer un archivo CSV
function leerCSV(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        
        lector.onload = (evento) => {
            try {
                const texto = evento.target.result;
                const lineas = texto.split('\n');
                const encabezados = lineas[0].split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
                
                const datos = [];
                for (let i = 1; i < lineas.length; i++) {
                    if (lineas[i].trim() === '') continue;
                    
                    const valores = lineas[i].match(/\s*("[^"]*"|'[^']*'|[^,\s]*)\s*(?:,|$)/g)
                        .map(v => v.trim().replace(/^["']|["']$/g, ''));
                    
                    const fila = {};
                    encabezados.forEach((encabezado, indice) => {
                        fila[encabezado] = valores[indice] || '';
                    });
                    
                    datos.push(fila);
                }
                
                resolve(datos);
            } catch (error) {
                reject(new Error('Error al procesar el archivo CSV'));
            }
        };
        
        lector.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        
        lector.readAsText(archivo);
    });
}

export { guardarEnCSV, leerCSV };
