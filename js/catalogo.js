/**
 * CATALOGO.JS - Gestión de catálogo de artículos
 * Carga, filtrado, escáner de códigos y administración
 */

// =========================================================
// CARGA DE CATÁLOGO
// =========================================================

function cargarArticulos() {
    fetch('/api/articulos', { method: 'GET' })
        .then(respuesta => respuesta.json())
        .then(datos => {
            const listaVentas = document.getElementById('catalogo-ventas');
            const listaCompras = document.getElementById('catalogo-compras');
            const listaAdmin = document.getElementById('catalogo-admin');

            listaVentas.innerHTML = '';
            listaCompras.innerHTML = '';
            listaAdmin.innerHTML = '';

            const fragmentVentas = document.createDocumentFragment();
            const fragmentCompras = document.createDocumentFragment();
            const fragmentAdmin = document.createDocumentFragment();

            datos.forEach(articulo => {
                const articuloName = sanitizeText(articulo.name);
                const articuloBrand = sanitizeText(articulo.brand.name);
                const articuloDescription = sanitizeText(articulo.description);
                const articuloId = parseInt(articulo.id);
                const brandId = parseInt(articulo.brand.id);
                const categoryId = parseInt(articulo.category.id);
                const categoryName = sanitizeText(articulo.category.name);

                // Vista de Ventas
                const liVenta = document.createElement('li');
                liVenta.className = 'item-articulo';

                let htmlVentaItem = `
                <details>
                    <summary style="cursor: pointer; font-size: 1.1em; padding: 5px; background-color: #f1f1f1;">
                        <strong>${articuloName}</strong> - ${articuloBrand}
                    </summary>
                    <p style="margin: 5px 10px; font-style: italic; color: #666; font-size: 0.9em;">${articuloDescription}</p>
                    <ul style="margin-top: 10px;">`;

                articulo.variants.forEach(variante => {
                    const varianteSize = sanitizeText(variante.size);
                    const varianteColor = sanitizeText(variante.color);
                    const variantePrice = parseFloat(variante.price);
                    const varianteStock = parseInt(variante.stock);
                    const varianteId = parseInt(variante.id);

                    let controlesVenta = '';
                    if (varianteStock > 0) {
                        controlesVenta = `
                            <input type="number" id="cant-${varianteId}" value="1" min="1" max="${varianteStock}" style="width: 50px;">
                            <button onclick="agregarAlCarrito(${varianteId},'${escapeQuotes(articuloName)}','${escapeQuotes(articuloBrand)}','${escapeQuotes(varianteSize)}','${escapeQuotes(varianteColor)}',${variantePrice}, document.getElementById('cant-${varianteId}').value)">Agregar</button>`;
                    } else {
                        controlesVenta = `<span style="color: red; font-weight: bold;">AGOTADO</span>`;
                    }
                    htmlVentaItem += `<li>Talle: ${varianteSize} | Color: ${varianteColor} | Precio: ${variantePrice} | Stock: ${varianteStock}
                        <br>${controlesVenta}</li>`;
                });
                htmlVentaItem += `</ul></details><hr>`;
                liVenta.innerHTML = htmlVentaItem;
                fragmentVentas.appendChild(liVenta);

                // Vista de Compras
                const liCompra = document.createElement('li');
                liCompra.className = 'item-articulo';

                let htmlCompraItem = `
                <details>
                    <summary style="cursor: pointer; font-size: 1.1em; padding: 5px; background-color: #f1f1f1;">
                        <strong>${articuloName}</strong> - ${articuloBrand}
                    </summary>
                    <p style="margin: 5px 10px; font-style: italic; color: #666; font-size: 0.9em;">${articuloDescription}</p>
                    <ul style="margin-top: 10px;">`;

                articulo.variants.forEach(variante => {
                    const varianteSize = sanitizeText(variante.size);
                    const varianteColor = sanitizeText(variante.color);
                    const variantePrice = parseFloat(variante.price);
                    const varianteStock = parseInt(variante.stock);
                    const varianteId = parseInt(variante.id);

                    let controlesCompra = '';
                    if (varianteStock <= 0) {
                        controlesCompra = `<span style="color: red; font-weight: bold;">AGOTADO</span>`;
                    }
                    controlesCompra += `
                        Cant: <input type="number" id="cant-${varianteId}" value="1" min="1" style="width: 50px;">
                        Precio Costo: $<input type="number" id="precio-${varianteId}" value="0" min="0" step="0.01" placeholder="0.00">
                        <button onclick="agregarAlIngreso(${varianteId},'${escapeQuotes(articuloName)}','${escapeQuotes(articuloBrand)}','${escapeQuotes(varianteSize)}','${escapeQuotes(varianteColor)}',document.getElementById('precio-${varianteId}').value, document.getElementById('cant-${varianteId}').value)">Agregar</button>`;
                    htmlCompraItem += `<li>Talle: ${varianteSize} | Color: ${varianteColor} | Precio Venta: ${variantePrice} | Stock: ${varianteStock}
                        <br>${controlesCompra}</li>`;
                });
                htmlCompraItem += `</ul></details><hr>`;
                liCompra.innerHTML = htmlCompraItem;
                fragmentCompras.appendChild(liCompra);

                // Vista de Administración
                const liAdmin = document.createElement('li');
                liAdmin.className = 'list-group-item mb-3 shadow-sm rounded';
                liAdmin.setAttribute('data-marca', brandId);
                liAdmin.setAttribute('data-categoria', categoryId);
                liAdmin.setAttribute('data-articulo-id', articuloId);

                let htmlAdminItem = `
                <div class="d-flex justify-content-between align-items-center p-2 mb-2">
                    <div>
                        <strong style="font-size: 1.1em;">${articuloName}</strong>
                        <span class="badge bg-secondary ms-2">${articuloBrand}</span>
                        <span class="badge bg-info text-dark ms-1">${categoryName}</span>
                        <p class="mb-0 text-muted small">${articuloDescription}</p>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="prepararVariante('${escapeQuotes(articuloName)}',${articuloId})" data-bs-toggle="modal" data-bs-target="#modalVariante">+ Agregar Talle</button>
                        <button class="btn btn-sm btn-outline-secondary mx-1" onclick="cargarArticuloParaEditar(${articuloId}, '${escapeQuotes(articuloName)}', ${brandId},${categoryId}, '${escapeQuotes(articuloDescription)}')" data-bs-toggle="modal" data-bs-target="#modalArticulo">✏️ Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarArticulo(${articuloId})">🗑️ Borrar</button>
                    </div>
                </div>
                <ul class="list-group list-group-flush border-top pt-2">`;

                articulo.variants.forEach(variante => {
                    const varianteSize = sanitizeText(variante.size);
                    const varianteColor = sanitizeText(variante.color);
                    const variantePrice = parseFloat(variante.price);
                    const varianteStock = parseInt(variante.stock);
                    const varianteId = parseInt(variante.id);

                    htmlAdminItem += `<li class="list-group-item d-flex justify-content-between align-items-center bg-light" data-variante-id="${varianteId}">
                        <span>Talle: <strong>${varianteSize}</strong> | Color: <strong>${varianteColor}</strong> | Precio: ${variantePrice} | Stock: <span id="stock-badge-${varianteId}" class="badge ${varianteStock > 0 ? 'bg-success' : 'bg-danger'}">${varianteStock}</span></span>
                        <div>
                            <button class="btn btn-sm btn-warning me-1" onclick="prepararStock(${varianteId},'${escapeQuotes(articuloName)}','${escapeQuotes(varianteSize)}')" data-bs-toggle="modal" data-bs-target="#modalStock">📦 Stock</button>
                            <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarVarianteParaEditar(${articuloId},${varianteId}, '${escapeQuotes(varianteSize)}', '${escapeQuotes(varianteColor)}', ${variantePrice}, '${escapeQuotes(variante.barCode || '')}')" data-bs-toggle="modal" data-bs-target="#modalVariante">✏️</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarVariante(${articuloId}, ${varianteId}, this)">🗑️</button>
                        </div>
                    </li>`;
                });
                htmlAdminItem += `</ul>`;
                liAdmin.innerHTML = htmlAdminItem;
                fragmentAdmin.appendChild(liAdmin);
            });

            listaVentas.appendChild(fragmentVentas);
            listaCompras.appendChild(fragmentCompras);
            listaAdmin.appendChild(fragmentAdmin);
        })
        .catch(error => {
            console.error("Error al cargar artículos:", error);
            mostrarAlertaError('Error', 'No se pudieron cargar los artículos');
        });
}

// =========================================================
// FILTRADO
// =========================================================

function filtrarCatalogo(idInput, idLista) {
    const textoBusqueda = document.getElementById(idInput).value.toLowerCase().trim();
    const lista = document.getElementById(idLista);
    if (!lista) return;

    const elementos = lista.children;
    for (let i = 0; i < elementos.length; i++) {
        const textoElemento = elementos[i].innerText.toLowerCase();
        if (textoElemento.includes(textoBusqueda)) {
            elementos[i].style.setProperty('display', '', 'important');
        } else {
            elementos[i].style.setProperty('display', 'none', 'important');
        }
    }
}

function filtrarArticulosAvanzado() {
    const textoBusqueda = document.getElementById('buscador-admin').value.toLowerCase();
    const idMarcaSeleccionada = document.getElementById('filtro-marca-admin').value;
    const idCategoriaSeleccionada = document.getElementById('filtro-categoria-articulo-admin').value;

    const lista = document.getElementById('catalogo-admin');
    const articulos = lista.getElementsByClassName('list-group-item');

    for (let i = 0; i < articulos.length; i++) {
        const textoArticulo = articulos[i].innerText.toLowerCase();
        const marcaArticulo = articulos[i].getAttribute('data-marca');
        const categoriaArticulo = articulos[i].getAttribute('data-categoria');

        const coincideTexto = textoArticulo.includes(textoBusqueda);
        const coincideMarca = (idMarcaSeleccionada === "TODAS" || idMarcaSeleccionada == marcaArticulo);
        const coincideCategoria = (idCategoriaSeleccionada === "TODAS" || idCategoriaSeleccionada == categoriaArticulo);

        articulos[i].style.display = (coincideTexto && coincideMarca && coincideCategoria) ? "" : "none";
    }
}

// =========================================================
// ESCANER DE CÓDIGOS DE BARRAS
// =========================================================

let escaneadoDatos = null;
let selectorVariantesDatos = null;
let selectorVariantesOrigen = null;

function buscarPorCodigoBarras(codigo, origen) {
    fetch(`/api/articulos/codigo/${codigo}`, { method: 'GET' })
        .then(respuesta => {
            if (!respuesta.ok) throw new Error("Código no encontrado");
            return respuesta.json();
        })
        .then(variantesEncontradas => {
            if (!variantesEncontradas || variantesEncontradas.length === 0) {
                throw new Error("Código no encontrado");
            }

            if (variantesEncontradas.length === 1) {
                procesarVarianteEscaneada(variantesEncontradas[0], origen);
            } else {
                mostrarSelectorVariantes(variantesEncontradas, origen);
            }
        })
        .catch(error => {
            if (origen === 'lector-codigo-admin') {
                mostrarAlertaError('Código no registrado', 'Busque el artículo en la lista y use \'+ Agregar Talle\' para asociar este código de barras.');
            } else {
                mostrarAlertaError('Producto no encontrado', 'El producto escaneado no existe en el sistema.');
            }
        });
}

function procesarVarianteEscaneada(variante, origen) {
    const idVar = variante.id;
    const nombreArt = variante.article.name;
    const nombreMarca = variante.article.brand.name;
    const talle = variante.size;
    const color = variante.color;
    const precio = variante.price;
    const stock = variante.stock;

    // Punto de Venta
    if (origen === 'lector-codigo-ventas') {
        if (stock <= 0) {
            Swal.fire({
                title: 'Sin stock',
                text: `El producto "${nombreArt}" (${talle} - ${color}) está agotado.`,
                icon: 'warning'
            });
            return;
        }
        agregarAlCarrito(idVar, nombreArt, nombreMarca, talle, color, precio, 1);

    // Compras - Modal de ingreso
    } else if (origen === 'lector-codigo-compras') {
        escaneadoDatos = {
            idVariante: idVar,
            nombre: nombreArt,
            marca: nombreMarca,
            talle: talle,
            color: color
        };

        document.getElementById('producto-escaneado-nombre').innerText = `${nombreArt} - ${nombreMarca}`;
        document.getElementById('producto-escaneado-detalles').innerText = `Talle: ${talle} | Color: ${color}`;

        document.getElementById('escaneado-id-variante').value = idVar;
        document.getElementById('escaneado-nombre').value = nombreArt;
        document.getElementById('escaneado-marca').value = nombreMarca;
        document.getElementById('escaneado-talle').value = talle;
        document.getElementById('escaneado-color').value = color;

        document.getElementById('precio-compra-escaneado').value = '';
        document.getElementById('cantidad-escaneado').value = '1';

        const modal = new bootstrap.Modal(document.getElementById('modalCompraEscaneada'));
        modal.show();

        setTimeout(() => document.getElementById('precio-compra-escaneado').focus(), 300);

    // Administración - Información de producto
    } else if (origen === 'lector-codigo-admin') {
        mostrarAlertaExito('Prenda Escaneada', `${nombreArt} - ${nombreMarca}\nTalle: ${talle} | Color: ${color}\nPrecio: $${precio} | Stock: ${stock}`);
    }
}

function mostrarSelectorVariantes(variantes, origen) {
    selectorVariantesDatos = variantes;
    selectorVariantesOrigen = origen;

    const primerVariante = variantes[0];
    const nombreArt = primerVariante.article.name;
    const nombreMarca = primerVariante.article.brand.name;
    const talle = primerVariante.size;

    document.getElementById('selector-variante-nombre').innerText = `${nombreArt} - ${nombreMarca}`;

    const container = document.getElementById('selector-variante-opciones');
    container.innerHTML = '';

    const coloresVarian = variantes.some(v => v.color !== primerVariante.color);
    const tallesVarian = variantes.some(v => v.size !== primerVariante.size);
    const preciosVarian = variantes.some(v => v.price !== primerVariante.price);

    let detallesComunes = '';
    if (!tallesVarian) {
        detallesComunes += `Talle: ${talle}`;
    }
    document.getElementById('selector-variante-detalles').innerText = detallesComunes ? `(${detallesComunes})` : 'Seleccione la variante deseada:';

    variantes.forEach(variante => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary text-start';
        btn.style.cssText = 'white-space: normal; word-break: break-word;';

        const partes = [];
        if (coloresVarian) partes.push(`<strong>Color: ${variante.color}</strong>`);
        if (tallesVarian) partes.push(`<strong>Talle: ${variante.size}</strong>`);
        if (preciosVarian) partes.push(`Precio: $${variante.price}`);

        let stockBadge = '';
        let deshabilitado = false;

        if (origen === 'lector-codigo-ventas') {
            if (variante.stock > 0) {
                stockBadge = `<span class="badge bg-success ms-2">Stock: ${variante.stock}</span>`;
            } else {
                stockBadge = `<span class="badge bg-danger ms-2">SIN STOCK</span>`;
                deshabilitado = true;
            }
        } else if (origen === 'lector-codigo-compras') {
            stockBadge = `<span class="badge bg-secondary ms-2">Stock: ${variante.stock}</span>`;
        }

        btn.innerHTML = `${partes.join(' | ')}${stockBadge}`;

        if (deshabilitado) {
            btn.disabled = true;
            btn.classList.add('disabled');
        }

        btn.onclick = function() {
            bootstrap.Modal.getInstance(document.getElementById('modalSelectorVariante')).hide();
            procesarVarianteEscaneada(variante, origen);
        };

        container.appendChild(btn);
    });

    const modal = new bootstrap.Modal(document.getElementById('modalSelectorVariante'));
    modal.show();
}

function confirmarIngresoEscaneado() {
    const precioCompra = parseFloat(document.getElementById('precio-compra-escaneado').value);
    const cantidad = parseInt(document.getElementById('cantidad-escaneado').value);

    if (isNaN(precioCompra) || precioCompra < 0) {
        Swal.fire({ title: 'Error', text: 'Ingrese un precio de compra válido', icon: 'error' });
        return;
    }

    if (isNaN(cantidad) || cantidad < 1) {
        Swal.fire({ title: 'Error', text: 'Ingrese una cantidad válida (mínimo 1)', icon: 'error' });
        return;
    }

    const idVariante = document.getElementById('escaneado-id-variante').value;
    const nombre = document.getElementById('escaneado-nombre').value;
    const marca = document.getElementById('escaneado-marca').value;
    const talle = document.getElementById('escaneado-talle').value;
    const color = document.getElementById('escaneado-color').value;

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalCompraEscaneada'));
    modal.hide();

    agregarAlIngreso(idVariante, nombre, marca, talle, color, precioCompra, cantidad);
    escaneadoDatos = null;
}
