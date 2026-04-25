/**
 * OPERACIONES.JS - Navegación y gestión de entidades
 * Manejo de pantallas, artículos, variantes, marcas, categorías y gastos
 */

// =========================================================
// NAVEGACIÓN
// =========================================================

function cambiarPantalla(idPantallaDestino){
    const pantallas = document.querySelectorAll('.pantalla-sistema');
    pantallas.forEach(pantalla => pantalla.style.display = 'none');
    document.getElementById(idPantallaDestino).style.display = 'block';
}

function cambiarSubPantallaReportes(idSubPantalla, botonClickeado){
    document.querySelectorAll('.btn-reporte').forEach(btn => btn.classList.remove('active'));
    if(botonClickeado) botonClickeado.classList.add('active');

    const subPantallas = document.querySelectorAll('.sub-pantalla-reportes')
    subPantallas.forEach(subPantalla => subPantalla.style.display = 'none');
    document.getElementById(idSubPantalla).style.display = 'block';

    if(idSubPantalla === 'sub-pantalla-ventas') cargarHistorialVentas();
    else if(idSubPantalla === 'sub-pantalla-movimientos') cargarHistorialMovimientos();
    else if(idSubPantalla === 'sub-pantalla-compras') cargarHistorialCompras();
    else if(idSubPantalla === 'sub-pantalla-deudas') cargarDeudas();
    else if(idSubPantalla === 'sub-pantalla-historial-gastos') cargarHistorialGastos();
}

function cambiarSubPantallaAdmin(idSubPantalla){
    const subPantallas = document.querySelectorAll('.sub-pantalla-admin')
    subPantallas.forEach(subPantalla => subPantalla.style.display = 'none');
    document.getElementById(idSubPantalla).style.display = 'block';

    if(idSubPantalla === 'sub-pantalla-gastos'){
        cargarCategoriasGastos();
        cargarUltimosGastos();
    }
}

function cambiarPanelAdmin(idPanelAdmin){
    const paneles = document.querySelectorAll('.panel-admin')
    paneles.forEach(panel => panel.style.display = 'none');
    document.getElementById(idPanelAdmin).style.display = 'block';
}

function cerrarMenuNavbar() {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle: false});
        bsCollapse.hide();
    }
}

// =========================================================
// GESTIÓN DE PRODUCTOS
// =========================================================

function mostrarFormularioArticulo() {
    document.getElementById('formulario-articulo').reset();
    idArticuloEnEdicion = null;
    document.getElementById('titulo-modal-articulo').innerText = "Nuevo Artículo";
    document.getElementById('btn-guardar-articulo').innerText = "Crear Artículo";
}

function cargarArticuloParaEditar(id, nombre, marcaId, categoriaId, descripcion){
    idArticuloEnEdicion = id;
    document.getElementById('titulo-modal-articulo').innerText = "Editar Artículo";
    document.getElementById('nombre').value = nombre;
    document.getElementById('marca-articulo').value = marcaId;
    document.getElementById('categoria-articulo').value = categoriaId;
    document.getElementById('descripcion').value = descripcion;
    document.getElementById('btn-guardar-articulo').innerText = "Guardar Cambios";
}

function cancelarEdicionArticulo() {
    document.getElementById('formulario-articulo').reset();
    idArticuloEnEdicion = null;
}

function eliminarArticulo(idArticulo){
    Swal.fire({
        title: '¿Borrar Artículo?',
        text: "Se borrarán todos sus talles",
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar todo'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/articulos/${idArticulo}`,{ method: 'DELETE' })
                .then(res => res.text())
                .then(() => {
                    mostrarAlertaExito('¡Borrado!');
                    cargarArticulos();
                })
                .catch(() => mostrarAlertaError('Error', 'No se pudo eliminar.'));
        }
    });
}

// =========================================================
// GESTIÓN DE VARIANTES
// =========================================================

function prepararVariante(nombreArticulo, idArticulo){
    idArticuloEnMemoria = idArticulo;
    idVarianteEnEdicion = null;
    document.getElementById('formulario-variante').reset();
    document.getElementById('articulo-seleccionado').innerText = nombreArticulo;
    document.getElementById('btn-guardar-variante').innerText = "Guardar Variante";
}

function cargarVarianteParaEditar(idProd, idVar, talle, color, precio, codigo){
    idVarianteEnEdicion = idVar;
    idArticuloEnMemoria = idProd;
    document.getElementById('talle').value = talle;
    document.getElementById('color').value = color;
    document.getElementById('precio').value = precio;
    document.getElementById('codigo-barras').value = codigo;
    document.getElementById('btn-guardar-variante').innerText = "Guardar Cambios";
}

function cancelarEdicionVariante() {
    document.getElementById('formulario-variante').reset();
    idVarianteEnEdicion = null;
}

function eliminarVariante(idArticulo, idVariante, botonElement){
    Swal.fire({
        title: '¿Borrar Variante?',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            const filaVariante = botonElement.closest('li[data-variante-id]');

            fetch(`/api/articulos/${idArticulo}/variantes/${idVariante}`, { method: 'DELETE' })
                .then(res => {
                    if (!res.ok) {
                        if (res.status === 404) {
                            throw new Error('La variante ya fue eliminada o no existe.');
                        }
                        throw new Error('Error al eliminar la variante.');
                    }
                    return res.text();
                })
                .then(() => {
                    if (filaVariante) filaVariante.remove();
                    mostrarAlertaExito('¡Variante eliminada!');
                })
                .catch(error => {
                    mostrarAlertaError('Error', error.message);
                    cargarArticulos();
                });
        }
    });
}

// =========================================================
// GESTIÓN DE STOCK
// =========================================================

function prepararStock(idVariante,nombreArticulo,talle) {
    idVarianteEnMemoria = idVariante;
    document.getElementById('formulario-stock').reset();
    document.getElementById('articulo-seleccionado-mov').innerText = nombreArticulo;
    document.getElementById('talle-seleccionado-mov').innerText = talle;
}

function cancelarStock() {
    document.getElementById('formulario-stock').reset();
    idVarianteEnMemoria = null;
}

// =========================================================
// GESTIÓN DE MARCAS
// =========================================================

function mostrarFormularioMarca() {
    document.getElementById('formulario-marca').reset();
    idMarcaEnEdicion = null;
    document.getElementById('titulo-modal-marca').innerText = "Nueva Marca";
    document.getElementById('btn-guardar-marca').innerText = "Crear Marca";
}

function cargarMarcaParaEditar(id, nombre, descripcion){
    idMarcaEnEdicion = id;
    document.getElementById('titulo-modal-marca').innerText = "Editar Marca";
    document.getElementById('nombre-marca').value = nombre;
    document.getElementById('descripcion-marca').value = descripcion;
    document.getElementById('btn-guardar-marca').innerText = "Guardar Cambios";
}

function cancelarEdicionMarca() {
    document.getElementById('formulario-marca').reset();
    idMarcaEnEdicion = null;
}

function cargarMarcas() {
    fetch('/api/marcas')
        .then(respuesta => respuesta.json())
        .then(datos => {
            const selectMarca = document.getElementById('marca-articulo');
            const filtroMarca = document.getElementById('filtro-marca-admin');
            const listaMarcas = document.getElementById('lista-admin-marcas');

            if(selectMarca) selectMarca.innerHTML = '';
            if(filtroMarca) filtroMarca.innerHTML = '<option value="TODAS">Todas</option>';
            if(listaMarcas) listaMarcas.innerHTML = '';

            const fragment = document.createDocumentFragment();

            datos.forEach(marca => {
                const marcaId = parseInt(marca.id);
                const marcaName = sanitizeText(marca.name);
                const marcaDesc = sanitizeText(marca.description);

                const opcion = document.createElement('option');
                opcion.value = marcaId;
                opcion.text = marcaName;

                if(selectMarca) selectMarca.appendChild(opcion);
                if(filtroMarca) filtroMarca.appendChild(opcion.cloneNode(true));

                const li = document.createElement('li');
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.setAttribute('data-marca-id', marcaId);
                li.innerHTML = `
                    <div>
                        <strong>${marcaName}</strong> <br>
                        <small class="text-muted">${marcaDesc || ''}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalMarca" onclick="cargarMarcaParaEditar(${marcaId}, '${escapeQuotes(marcaName)}', '${escapeQuotes(marcaDesc)}')">✏️ Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarMarca(${marcaId}, this)">🗑️ Borrar</button>
                    </div>
                `;
                fragment.appendChild(li);
            });

            if(listaMarcas) listaMarcas.appendChild(fragment);
        })
        .catch(error => {
            console.error("Error al cargar marcas:", error);
            mostrarAlertaError('Error', 'No se pudieron cargar las marcas');
        });
}

function eliminarMarca(idMarca, botonElement){
    Swal.fire({
        title: '¿Borrar Marca?',
        text: "Verificá que no tenga artículos asociados",
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            const elementoLista = botonElement.closest('li[data-marca-id]');

            fetch(`/api/marcas/${idMarca}`,{ method: 'DELETE' })
                .then(res => {
                    if (!res.ok) throw new Error('Error al eliminar la marca');
                    return res.text();
                })
                .then(() => {
                    if (elementoLista) elementoLista.remove();
                    mostrarAlertaExito('¡Marca eliminada!');
                })
                .catch(error => {
                    mostrarAlertaError('Error', error.message);
                    cargarMarcas();
                });
        }
    });
}

// =========================================================
// GESTIÓN DE CATEGORÍAS DE ARTÍCULOS
// =========================================================

function mostrarFormularioCategoriaArticulo() {
    document.getElementById('formulario-categoria-articulo').reset();
    idCategoriaArticuloEnEdicion = null;
    document.getElementById('titulo-modal-cat-art').innerText = "Nueva Categoría";
    document.getElementById('btn-guardar-categoria-articulo').innerText = "Crear Categoría";
}

function cargarCategoriaArticuloParaEditar(id, nombre, descripcion){
    idCategoriaArticuloEnEdicion = id;
    document.getElementById('titulo-modal-cat-art').innerText = "Editar Categoría";
    document.getElementById('nombre-categoria-articulo').value = nombre;
    document.getElementById('descripcion-categoria-articulo').value = descripcion;
    document.getElementById('btn-guardar-categoria-articulo').innerText = "Guardar Cambios";
}

function cancelarEdicionCategoriaArticulo() {
    document.getElementById('formulario-categoria-articulo').reset();
    idCategoriaArticuloEnEdicion = null;
}

function cargarCategoriasArticulos() {
    fetch('/api/categorias-articulos')
        .then(respuesta => respuesta.json())
        .then(datos => {
            const selectCategoria = document.getElementById('categoria-articulo');
            const filtroCategoria = document.getElementById('filtro-categoria-articulo-admin');
            const listaCategorias = document.getElementById('lista-admin-categorias-articulos');

            selectCategoria.innerHTML = '';
            filtroCategoria.innerHTML = '<option value="TODAS">Todas</option>';
            listaCategorias.innerHTML = '';

            const fragment = document.createDocumentFragment();

            datos.forEach(categoria => {
                const categoriaId = parseInt(categoria.id);
                const categoriaName = sanitizeText(categoria.name);
                const categoriaDesc = sanitizeText(categoria.description);

                const opcion = document.createElement('option');
                opcion.value = categoriaId;
                opcion.text = categoriaName;
                selectCategoria.appendChild(opcion);
                filtroCategoria.appendChild(opcion.cloneNode(true));

                const li = document.createElement('li');
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.setAttribute('data-categoria-art-id', categoriaId);
                li.innerHTML = `
                    <div>
                        <strong>${categoriaName}</strong> <br>
                        <small class="text-muted">${categoriaDesc || ''}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalCategoriaArticulo" onclick="cargarCategoriaArticuloParaEditar(${categoriaId}, '${escapeQuotes(categoriaName)}', '${escapeQuotes(categoriaDesc)}')">✏️ Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoriaArticulo(${categoriaId}, this)">🗑️ Borrar</button>
                    </div>
                `;
                fragment.appendChild(li);
            });

            listaCategorias.appendChild(fragment);
        })
        .catch(error => {
            console.error("Error al cargar categorías:", error);
            mostrarAlertaError('Error', 'No se pudieron cargar las categorías');
        });
}

function eliminarCategoriaArticulo(idCategoria, botonElement){
    Swal.fire({
        title: '¿Borrar Categoría?',
        text: "Verificá que no tenga artículos asociados",
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            const elementoLista = botonElement.closest('li[data-categoria-art-id]');

            fetch(`/api/categorias-articulos/${idCategoria}`,{ method: 'DELETE' })
                .then(res => {
                    if (!res.ok) throw new Error('Error al eliminar la categoría');
                    return res.text();
                })
                .then(() => {
                    if (elementoLista) elementoLista.remove();
                    mostrarAlertaExito('¡Categoría eliminada!');
                })
                .catch(error => {
                    mostrarAlertaError('Error', error.message);
                    cargarCategoriasArticulos();
                });
        }
    });
}

// =========================================================
// GESTIÓN DE GASTOS GENERALES
// =========================================================

function cargarCategoriasGastos() {
    fetch('/api/categorias')
        .then(respuesta => respuesta.json())
        .then(datos => {
            const selectCategoria = document.getElementById('categoria-gasto');
            const listaCategorias = document.getElementById('lista-categorias-gastos');

            if(selectCategoria) selectCategoria.innerHTML = '';
            if(listaCategorias) listaCategorias.innerHTML = '';

            const fragment = document.createDocumentFragment();

            datos.forEach(categoria => {
                const categoriaId = parseInt(categoria.id);
                const categoriaName = sanitizeText(categoria.name);

                const opcion = document.createElement('option');
                opcion.value = categoriaId;
                opcion.text = categoriaName;
                if(selectCategoria) selectCategoria.appendChild(opcion);

                const li = document.createElement('li');
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.setAttribute('data-categoria-gasto-id', categoriaId);
                li.innerHTML = `
                    <span>${categoriaName}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarCategoriaGastoParaEditar(${categoriaId}, '${escapeQuotes(categoriaName)}')">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoriaGasto(${categoriaId}, this)">Eliminar</button>
                    </div>`;
                fragment.appendChild(li);
            });

            if(listaCategorias) listaCategorias.appendChild(fragment);
        })
        .catch(error => {
            console.error("Error al cargar categorías:", error);
            mostrarAlertaError('Error', 'No se pudieron cargar las categorías');
        });
}

function eliminarCategoriaGasto(idCategoria, botonElement) {
    Swal.fire({
        title: '¿Estás seguro?',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const elementoLista = botonElement.closest('li[data-categoria-gasto-id]');

            fetch(`/api/categorias/${idCategoria}`, { method: 'DELETE' })
                .then(respuesta => {
                    if(!respuesta.ok) throw new Error("Error al borrar");
                    return respuesta.text();
                })
                .then(() => {
                    if (elementoLista) elementoLista.remove();
                    mostrarAlertaExito('¡Categoría eliminada!');
                })
                .catch(error => {
                    mostrarAlertaError('Error', error.message);
                    cargarCategoriasGastos();
                });
        }
    });
}

function cargarCategoriaGastoParaEditar(id, nombre) {
    idCategoriaGastoEnEdicion = id;
    document.getElementById('nombre-nueva-categoria').value = nombre;
    document.getElementById('btn-guardar-categoria-gasto').innerText = "Guardar";
    document.getElementById('btn-cancelar-edicion-categoria-gasto').style.display = 'block';
}

function cancelarEdicionCategoriaGasto() {
    document.getElementById('formulario-nueva-categoria').reset();
    idCategoriaGastoEnEdicion = null;
    document.getElementById('btn-guardar-categoria-gasto').innerText = "+";
    document.getElementById('btn-cancelar-edicion-categoria-gasto').style.display = 'none';
}

function prepararNuevoGasto() {
    document.getElementById('formulario-gastos').reset();
    idGastoEnEdicion = null;
    document.getElementById('titulo-modal-gasto').innerText = "Registrar Gasto";
    document.getElementById('fecha-gasto').value = new Date().toISOString().split('T')[0];
}

function cargarUltimosGastos() {
    fetch('/api/expensas')
        .then(respuesta => respuesta.json())
        .then(gastos => {
            const tbody = document.getElementById('tbody-ultimos-gastos');
            if(!tbody) return;

            let filasHTML = '';

            gastos.slice(0, 20).forEach(gasto => {
                filasHTML += `<tr id="gasto-row-${gasto.id}">
                    <td>${new Date(gasto.date).toLocaleDateString('es-AR')}</td>
                    <td><span class="badge bg-secondary">${gasto.category.name}</span></td>
                    <td>${gasto.description || '-'}</td>
                    <td class="text-danger fw-bold">$${gasto.amount}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarGastoParaEditar(${gasto.id},${gasto.category.id},${gasto.amount},'${gasto.description || ''}', '${gasto.date}')" data-bs-toggle="modal" data-bs-target="#modalGasto">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto(${gasto.id}, this)">Eliminar</button>
                    </td>
                </tr>`;
            });

            tbody.innerHTML = filasHTML;
        })
        .catch(error => console.error("Error al cargar gastos:", error));
}

function eliminarGasto(idGasto, botonElement){
    Swal.fire({
        title: '¿Borrar Gasto?',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            const fila = botonElement.closest('tr[id^="gasto-row-"]');

            fetch(`/api/expensas/${idGasto}`,{ method: 'DELETE' })
                .then(respuesta => {
                    if(!respuesta.ok) throw new Error("Error al eliminar");
                    return respuesta.text();
                })
                .then(() => {
                    if (fila) fila.remove();
                    mostrarAlertaExito('¡Gasto eliminado!');
                })
                .catch(error => {
                    mostrarAlertaError('Error', error.message);
                    cargarUltimosGastos();
                });
        }
    });
}

function cargarGastoParaEditar(id, categoriaId, monto, descripcion, fecha) {
    idGastoEnEdicion = id;
    const fechaHTML = fecha.split('T')[0];

    document.getElementById('titulo-modal-gasto').innerText = "Editar Gasto";
    document.getElementById('categoria-gasto').value = categoriaId;
    document.getElementById('monto-gasto').value = monto;
    document.getElementById('descripcion-gasto').value = descripcion;
    document.getElementById('fecha-gasto').value = fechaHTML;
}

function cancelarEdicionGasto() {
    document.getElementById('formulario-gastos').reset();
    idGastoEnEdicion = null;
}
