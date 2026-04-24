//Variables globales para ID
let idArticuloEnMemoria = null;
let idVarianteEnMemoria = null;
let idArticuloEnEdicion = null;
let idVarianteEnEdicion = null;
let idCategoriaGastoEnEdicion = null;
let idGastoEnEdicion = null;
let idMarcaEnEdicion = null;
let idCategoriaArticuloEnEdicion = null;

let carrito = [];
let ingreso = [];

// --- FUNCIONES UTILIDAD ---

/**
* Sanitiza texto para prevenir XSS
* Convierte caracteres especiales HTML en entidades seguras
*/
function sanitizeText(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
* Escapa comillas simples para uso en atributos onclick
*/
function escapeQuotes(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/'/g, "\\'");
}

/**
* Muestra una alerta de éxito personalizada sin icono
* @param {string} titulo - El título de la alerta
* @param {string} texto - El texto adicional (opcional)
*/
function mostrarAlertaExito(titulo, texto = '') {
  Swal.fire({
    title: titulo,
    text: texto || 'success',
    icon: null,
    showConfirmButton: true,
    confirmButtonText: 'Aceptar',
    customClass: {
      popup: 'swal2-no-icon'
    },
    didOpen: () => {
      const icon = Swal.getIcon();
      if (icon) icon.style.display = 'none';
    }
  });
}

/**
* Muestra una alerta de error personalizada sin icono
* @param {string} titulo - El título de la alerta
* @param {string} texto - El texto del error
*/
function mostrarAlertaError(titulo, texto) {
  Swal.fire({
    title: titulo,
    text: texto,
    icon: null,
    showConfirmButton: true,
    confirmButtonText: 'Aceptar',
    customClass: {
      popup: 'swal2-no-icon'
    },
    didOpen: () => {
      const icon = Swal.getIcon();
      if (icon) icon.style.display = 'none';
    }
  });
}

// --- LOADER GLOBAL ---
let loaderContador = 0;

function mostrarLoader(texto = 'Procesando...') {
  const loader = document.getElementById('loader-overlay');
  const loaderTexto = loader.querySelector('.spinner-text');
  if (loaderTexto) {
    loaderTexto.innerText = texto;
  }
  loader.classList.add('active');
  loaderContador++;
}

function ocultarLoader() {
  loaderContador--;
  if (loaderContador <= 0) {
    const loader = document.getElementById('loader-overlay');
    loader.classList.remove('active');
    loaderContador = 0;
  }
}

// --- INTERCEPTOR GLOBAL DE PETICIONES (API CLIENT) ---
const fetchOriginal = window.fetch;
const BASE_URL = 'https://sistema-negocio-lenceria-api.onrender.com';

window.fetch = async function(url, opciones = {}) {
  // Determinar si debe mostrar loader
  // No mostrar en: login, ventas, compras, stock (operaciones rápidas de punto de venta)
  // Tampoco mostrar en carga inicial de artículos, marcas y categorías al iniciar sesión
  const debeMostrarLoader = !url.includes('/api/auth/login') &&
  !url.includes('/api/ventas') &&
  !url.includes('/api/compras') &&
  !url.includes('/api/stock') &&
  !url.includes('/api/articulos') &&
  !url.includes('/api/marcas') &&
  !url.includes('/api/categorias') &&
  !url.includes('/api/categorias-articulos');
  if (debeMostrarLoader) {
    mostrarLoader('Cargando...');
  }
    
    // Reemplazo automático de URL (Si la URL empieza con /api, le pega el localhost)
    if (url.startsWith('/api')) {
        url = BASE_URL + url;
    }

  if (!url.includes('/api/auth/login')) {
    const token = localStorage.getItem('tokenJWT');

    if (!opciones.headers) opciones.headers = {};

    if (token) {
      opciones.headers['Authorization'] = 'Bearer ' + token;
    }
  }

  try {
    const respuesta = await fetchOriginal(url, opciones);

    // Ocultar loader después de completar
    if (debeMostrarLoader) {
      ocultarLoader();
    }

    // 4. Control de Seguridad Global
    if ((respuesta.status === 401 || respuesta.status === 403) && !url.includes('/api/auth/login')) {
      localStorage.removeItem('tokenJWT');
      Swal.fire({
        title: 'Sesión Expirada',
        text: 'Tu sesión ha caducado por seguridad. Por favor, vuelve a ingresar.',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        window.location.reload();
      });
      return Promise.reject(new Error("Sesión expirada"));
    }
    return respuesta;
  } catch (error) {
    // Ocultar loader en caso de error
    if (debeMostrarLoader) {
      ocultarLoader();
    }
    console.error("Fallo crítico en la red:", error);
    throw error;
  }
};
// =========================================================

// --- FUNCIONES ---

// --- LEER EL TOKEN JWT ---
function decodificarToken(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadDecodificado = atob(payloadBase64);
        return JSON.parse(payloadDecodificado);
    } catch (e) {
        return null;
    }
}

// -- INICIALIZACION --

function cargarArticulos() {
  //Busca el token guardado

  fetch('/api/articulos', {
    method: 'GET',
  })
  .then(respuesta => respuesta.json())
  .then(datos => {
    // Listas de la pantalla
    const listaVentas = document.getElementById('catalogo-ventas');
    const listaCompras = document.getElementById('catalogo-compras');
    const listaAdmin = document.getElementById('catalogo-admin');

    listaVentas.innerHTML = '';
    listaCompras.innerHTML = '';
    listaAdmin.innerHTML = '';

    // Usar DocumentFragment para mejor rendimiento
    const fragmentVentas = document.createDocumentFragment();
    const fragmentCompras = document.createDocumentFragment();
    const fragmentAdmin = document.createDocumentFragment();

    datos.forEach(articulo => {
      // Sanitizar datos del artículo
      const articuloName = sanitizeText(articulo.name);
      const articuloBrand = sanitizeText(articulo.brand.name);
      const articuloDescription = sanitizeText(articulo.description);
      const articuloId = parseInt(articulo.id);
      const brandId = parseInt(articulo.brand.id);
      const categoryId = parseInt(articulo.category.id);
      const categoryName = sanitizeText(articulo.category.name);

      // -- PUNTO DE VENTA --
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
        <br>
        ${controlesVenta}
        </li>`;
      });
      htmlVentaItem += `</ul></details><hr>`;
      liVenta.innerHTML = htmlVentaItem;
      fragmentVentas.appendChild(liVenta);

      // -- INGRESO DE COMPRAS --
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
        <br>
        ${controlesCompra}
        </li>`;
      });
      htmlCompraItem += `</ul></details><hr>`;
      liCompra.innerHTML = htmlCompraItem;
      fragmentCompras.appendChild(liCompra);

      // -- ADMINISTRACIÓN --
      const liAdmin = document.createElement('li');
      liAdmin.className = 'list-group-item mb-3 shadow-sm rounded';
      liAdmin.setAttribute('data-marca', brandId);
      liAdmin.setAttribute('data-categoria', categoryId);

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
              <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarVarianteParaEditar(${articuloId},${varianteId}, '${escapeQuotes(varianteSize)}', '${escapeQuotes(varianteColor)}', ${variantePrice}, '${escapeQuotes(variante.barCode)}')" data-bs-toggle="modal" data-bs-target="#modalVariante">✏️</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarVariante(${articuloId}, ${varianteId}, this)">🗑️</button>
            </div>
          </li>`;
      });
      htmlAdminItem += `</ul>`;
      liAdmin.innerHTML = htmlAdminItem;
      fragmentAdmin.appendChild(liAdmin);
    });

    // Agregar fragments al DOM (una sola operación de reflow)
    listaVentas.appendChild(fragmentVentas);
    listaCompras.appendChild(fragmentCompras);
    listaAdmin.appendChild(fragmentAdmin);
  })
.catch(error => {
  console.error("Houston, tenemos un problema:", error);
  mostrarAlertaError('Error', 'No se pudieron cargar los artículos');
});
}

function filtrarCatalogo(idInput, idLista){
  let textoBusqueda = document.getElementById(idInput).value.toLowerCase().trim();

  let lista = document.getElementById(idLista);
  if(!lista) return;

  // Usar children para obtener todos los elementos hijos directos (LI)
  let elementos = lista.children;

  for (let i = 0; i < elementos.length; i++) {
    let textoElemento = elementos[i].innerText.toLowerCase();

    if (textoElemento.includes(textoBusqueda)) {
      // Le quitamos el none forzado si lo tenía
      elementos[i].style.setProperty('display', '', 'important');
    } else {
      // Le aplicamos el display: none con !important para vencer a Bootstrap
      elementos[i].style.setProperty('display', 'none', 'important');
    }
  }
}

function filtrarArticulosAvanzado(){
  let textoBusqueda = document.getElementById('buscador-admin').value.toLowerCase();
  let idMarcaSeleccionada = document.getElementById('filtro-marca-admin').value;
  let idCategoriaSeleccionada = document.getElementById('filtro-categoria-articulo-admin').value;

  let lista = document.getElementById('catalogo-admin');
  let articulos = lista.getElementsByClassName('list-group-item');

  for (let i = 0; i < articulos.length; i++) {
    let textoArticulo = articulos[i].innerText.toLowerCase();

    let marcaArticulo = articulos[i].getAttribute('data-marca');
    let categoriaArticulo = articulos[i].getAttribute('data-categoria');

    let coincideTexto = textoArticulo.includes(textoBusqueda);
    let coincideMarca = (idMarcaSeleccionada === "TODAS" || idMarcaSeleccionada == marcaArticulo);
    let coincideCategoria = (idCategoriaSeleccionada === "TODAS" || idCategoriaSeleccionada == categoriaArticulo);

    if (coincideTexto && coincideMarca && coincideCategoria) {
      articulos[i].style.display = "";
    } else {
      articulos[i].style.display = "none";
    }
  }
}

// Variables para almacenar datos del producto escaneado en compras
let escaneadoDatos = null;

// Variables para el selector de variantes (múltiples opciones con mismo código)
let selectorVariantesDatos = null;
let selectorVariantesOrigen = null;

function buscarPorCodigoBarras(codigo, origen) {
	fetch(`/api/articulos/codigo/${codigo}`, {
		method: 'GET',
	})
	.then(respuesta => {
		if(!respuesta.ok) throw new Error("Código no encontrado");
		return respuesta.json();
	})
	.then(variantesEncontradas => {
		// El backend ahora devuelve un array de variantes (puede ser 1 o más)

		// Si no se encontró ninguna variante
		if (!variantesEncontradas || variantesEncontradas.length === 0) {
			throw new Error("Código no encontrado");
		}

    // Si hay exactamente 1 variante: flujo directo (comportamiento anterior)
    if (variantesEncontradas.length === 1) {
      let variante = variantesEncontradas[0];
      procesarVarianteEscaneada(variante, origen);
		} else {
			// Si hay múltiples variantes: mostrar selector para elegir
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

// Función auxiliar para procesar una variante escaneada (flujo directo)
function procesarVarianteEscaneada(variante, origen) {
	let idVar = variante.id;
	let nombreArt = variante.article.name;
	let nombreMarca = variante.article.brand.name;
	let talle = variante.size;
	let color = variante.color;
	let precio = variante.price;
	let stock = variante.stock;

	//Pestaña de escaneo
	if (origen === 'lector-codigo-ventas') {
		// Para ventas, verificar stock antes de agregar
		if (stock <= 0) {
			Swal.fire({
				title: 'Sin stock',
				text: `El producto "${nombreArt}" (${talle} - ${color}) está agotado.`,
				icon: 'warning'
			});
			return;
		}
		agregarAlCarrito(idVar, nombreArt, nombreMarca, talle, color, precio, 1);
	} else if (origen === 'lector-codigo-compras') {
		// Mostrar modal para ingresar precio de compra y cantidad
		escaneadoDatos = {
			idVariante: idVar,
			nombre: nombreArt,
			marca: nombreMarca,
			talle: talle,
			color: color
		};

		// Llenar el modal con los datos del producto
		document.getElementById('producto-escaneado-nombre').innerText = `${nombreArt} - ${nombreMarca}`;
		document.getElementById('producto-escaneado-detalles').innerText = `Talle: ${talle} | Color: ${color}`;

		// Guardar datos en campos ocultos
		document.getElementById('escaneado-id-variante').value = idVar;
		document.getElementById('escaneado-nombre').value = nombreArt;
		document.getElementById('escaneado-marca').value = nombreMarca;
		document.getElementById('escaneado-talle').value = talle;
		document.getElementById('escaneado-color').value = color;

		// Resetear campos del modal
		document.getElementById('precio-compra-escaneado').value = '';
		document.getElementById('cantidad-escaneado').value = '1';

		// Mostrar el modal
		var modal = new bootstrap.Modal(document.getElementById('modalCompraEscaneada'));
		modal.show();

		// Enfocar el campo de precio después de que se abra el modal
		setTimeout(() => {
			document.getElementById('precio-compra-escaneado').focus();
		}, 300);
} else if (origen === 'lector-codigo-admin') {
    mostrarAlertaExito('Prenda Escaneada', `${nombreArt} - ${nombreMarca}\nTalle: ${talle} | Color: ${color}\nPrecio: $${precio} | Stock: ${stock}`);
  }
}

// Función para mostrar el selector de variantes cuando hay múltiples opciones
function mostrarSelectorVariantes(variantes, origen) {
	// Guardar datos temporalmente
	selectorVariantesDatos = variantes;
	selectorVariantesOrigen = origen;

	// Obtener info común (el primer artículo)
	let primerVariante = variantes[0];
	let nombreArt = primerVariante.article.name;
	let nombreMarca = primerVariante.article.brand.name;
	let talle = primerVariante.size;

	// Mostrar información del producto
	document.getElementById('selector-variante-nombre').innerText = `${nombreArt} - ${nombreMarca}`;

	// Generar las opciones disponibles
	let container = document.getElementById('selector-variante-opciones');
	container.innerHTML = '';

	// Detectar qué atributos varían entre las opciones
	let coloresVarian = variantes.some(v => v.color !== primerVariante.color);
	let tallesVarian = variantes.some(v => v.size !== primerVariante.size);
	let preciosVarian = variantes.some(v => v.price !== primerVariante.price);

	// Actualizar detalles según qué varía
	let detallesComunes = '';
	if (!tallesVarian) {
		detallesComunes += `Talle: ${talle}`;
	}
	document.getElementById('selector-variante-detalles').innerText = detallesComunes ? `(${detallesComunes})` : 'Seleccione la variante deseada:';

	// Crear botón para cada variante
	variantes.forEach(variante => {
		let btn = document.createElement('button');
		btn.className = 'btn btn-outline-primary text-start';
		btn.style.cssText = 'white-space: normal; word-break: break-word;';

		// Construir la etiqueta según qué atributos varían
		let etiqueta = '';
		let partes = [];

		if (coloresVarian) {
			partes.push(`<strong>Color: ${variante.color}</strong>`);
		}
		if (tallesVarian) {
			partes.push(`<strong>Talle: ${variante.size}</strong>`);
		}
		if (preciosVarian) {
			partes.push(`Precio: $${variante.price}`);
		}

		etiqueta = partes.join(' | ');

		// Verificar stock
		let stockBadge = '';
		let deshabilitado = false;
		if (origen === 'lector-codigo-ventas') {
			// En ventas, mostrar stock y deshabilitar si es 0
			if (variante.stock > 0) {
				stockBadge = `<span class="badge bg-success ms-2">Stock: ${variante.stock}</span>`;
			} else {
				stockBadge = `<span class="badge bg-danger ms-2">SIN STOCK</span>`;
				deshabilitado = true;
			}
		} else if (origen === 'lector-codigo-compras') {
			// En compras, siempre mostrar stock actual
			stockBadge = `<span class="badge bg-secondary ms-2">Stock: ${variante.stock}</span>`;
		}

		btn.innerHTML = `${etiqueta}${stockBadge}`;

		if (deshabilitado) {
			btn.disabled = true;
			btn.classList.add('disabled');
		}

		btn.onclick = function() {
			// Cerrar el modal y procesar la variante seleccionada
			bootstrap.Modal.getInstance(document.getElementById('modalSelectorVariante')).hide();
			procesarVarianteEscaneada(variante, origen);
		};

		container.appendChild(btn);
	});

	// Mostrar el modal
	var modal = new bootstrap.Modal(document.getElementById('modalSelectorVariante'));
	modal.show();
}

// Función para confirmar el ingreso desde el modal de escaneo
function confirmarIngresoEscaneado() {
  const precioCompra = parseFloat(document.getElementById('precio-compra-escaneado').value);
  const cantidad = parseInt(document.getElementById('cantidad-escaneado').value);

  // Validaciones
  if (isNaN(precioCompra) || precioCompra < 0) {
    Swal.fire({
      title: 'Error',
      text: 'Ingrese un precio de compra válido',
      icon: 'error'
    });
    return;
  }

  if (isNaN(cantidad) || cantidad < 1) {
    Swal.fire({
      title: 'Error',
      text: 'Ingrese una cantidad válida (mínimo 1)',
      icon: 'error'
    });
    return;
  }

  // Obtener los datos del producto escaneado
  const idVariante = document.getElementById('escaneado-id-variante').value;
  const nombre = document.getElementById('escaneado-nombre').value;
  const marca = document.getElementById('escaneado-marca').value;
  const talle = document.getElementById('escaneado-talle').value;
  const color = document.getElementById('escaneado-color').value;

  // Cerrar el modal
  var modal = bootstrap.Modal.getInstance(document.getElementById('modalCompraEscaneada'));
  modal.hide();

  // Agregar al ingreso con el precio de compra ingresado
  agregarAlIngreso(idVariante, nombre, marca, talle, color, precioCompra, cantidad);

  // Limpiar datos temporales
  escaneadoDatos = null;
}

// - NAVEGACION -
function cambiarPantalla(idPantallaDestino){
    let pantallas = document.querySelectorAll('.pantalla-sistema');
    pantallas.forEach(pantalla => pantalla.style.display = 'none');
    document.getElementById(idPantallaDestino).style.display = 'block';
}

function cambiarSubPantallaReportes(idSubPantalla, botonClickeado){
  document.querySelectorAll('.btn-reporte').forEach(btn => btn.classList.remove('active'));
  if(botonClickeado) botonClickeado.classList.add('active');

  let subPantallas = document.querySelectorAll('.sub-pantalla-reportes')
  subPantallas.forEach(subPantalla => subPantalla.style.display = 'none');
  document.getElementById(idSubPantalla).style.display = 'block';

  if(idSubPantalla === 'sub-pantalla-ventas') cargarHistorialVentas();
  else if(idSubPantalla === 'sub-pantalla-movimientos') cargarHistorialMovimientos();
  else if(idSubPantalla === 'sub-pantalla-compras') cargarHistorialCompras();
  else if(idSubPantalla === 'sub-pantalla-deudas') cargarDeudas();
  else if(idSubPantalla === 'sub-pantalla-historial-gastos') cargarHistorialGastos();
}

function cambiarSubPantallaAdmin(idSubPantalla){
    let subPantallas = document.querySelectorAll('.sub-pantalla-admin')
    subPantallas.forEach(subPantalla => subPantalla.style.display = 'none');
    document.getElementById(idSubPantalla).style.display = 'block';

    if(idSubPantalla === 'sub-pantalla-gastos'){
        cargarCategoriasGastos();
        cargarUltimosGastos();
    }
}

function cambiarPanelAdmin(idPanelAdmin){
    let paneles = document.querySelectorAll('.panel-admin')
    paneles.forEach(panel => panel.style.display = 'none');
    document.getElementById(idPanelAdmin).style.display = 'block';
}

function cerrarSesion() {
  localStorage.removeItem('tokenJWT');
  window.location.reload();
}

// Función para cerrar el menú hamburguesa al hacer clic en una opción
function cerrarMenuNavbar() {
  const navbarCollapse = document.getElementById('navbarNav');
  if (navbarCollapse.classList.contains('show')) {
    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle: false});
    bsCollapse.hide();
  }
}

// -- ADMIN --

// - GESTION DE PRODUCTOS -

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
      .then(msg => {
        mostrarAlertaExito('¡Borrado!');
        cargarArticulos();
      }).catch(e => mostrarAlertaError('Error', 'No se pudo eliminar.'));
    }
  });
}

// -- VARIANTES --
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
          // Optimistic UI: Eliminar del DOM inmediatamente sin recargar todo
          if (filaVariante) {
            filaVariante.remove();
          }
          mostrarAlertaExito('¡Variante eliminada!');
        })
        .catch(error => {
          mostrarAlertaError('Error', error.message);
          // Solo recargar en caso de error para sincronizar estado
          cargarArticulos();
        });
    }
  });
}

// -- STOCK --
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


// -- MARCAS --
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

      let opcion = document.createElement('option');
      opcion.value = marcaId;
      opcion.text = marcaName;

      if(selectMarca) selectMarca.appendChild(opcion);
      if(filtroMarca) filtroMarca.appendChild(opcion.cloneNode(true));

      let li = document.createElement('li');
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>${marcaName}</strong> <br>
          <small class="text-muted">${marcaDesc || ''}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalMarca" onclick="cargarMarcaParaEditar(${marcaId}, '${escapeQuotes(marcaName)}', '${escapeQuotes(marcaDesc)}')">✏️ Editar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarMarca(${marcaId})">🗑️ Borrar</button>
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

function eliminarMarca(idMarca){
  Swal.fire({
    title: '¿Borrar Marca?',
    text: "Verificá que no tenga artículos asociados",
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, borrar'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/api/marcas/${idMarca}`,{ method: 'DELETE' })
      .then(res => res.text())
      .then(msg => {
        mostrarAlertaExito('¡Borrada!');
        cargarMarcas();
      });
    }
  });
}

// -- CATEGORIAS ARTICULOS --
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

      let opcion = document.createElement('option');
      opcion.value = categoriaId;
      opcion.text = categoriaName;
      selectCategoria.appendChild(opcion);
      filtroCategoria.appendChild(opcion.cloneNode(true));

      let li = document.createElement('li');
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>${categoriaName}</strong> <br>
          <small class="text-muted">${categoriaDesc || ''}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalCategoriaArticulo" onclick="cargarCategoriaArticuloParaEditar(${categoriaId}, '${escapeQuotes(categoriaName)}', '${escapeQuotes(categoriaDesc)}')">✏️ Editar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoriaArticulo(${categoriaId})">🗑️ Borrar</button>
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


function eliminarCategoriaArticulo(idCategoria){
  Swal.fire({
    title: '¿Borrar Categoría?',
    text: "Verificá que no tenga artículos asociados",
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, borrar'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/api/categorias-articulos/${idCategoria}`,{ method: 'DELETE' })
      .then(res => res.text())
      .then(msg => {
        mostrarAlertaExito('¡Borrada!');
        cargarCategoriasArticulos();
      });
    }
  });
}

// - GASTOS GENERALES -

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

      let opcion = document.createElement('option');
      opcion.value = categoriaId;
      opcion.text = categoriaName;
      if(selectCategoria) selectCategoria.appendChild(opcion);

      let li = document.createElement('li');
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <span>${categoriaName}</span>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarCategoriaGastoParaEditar(${categoriaId}, '${escapeQuotes(categoriaName)}')">Editar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoriaGasto(${categoriaId})">Eliminar</button>
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

function eliminarCategoriaGasto(idCategoria) {
  Swal.fire({
    title: '¿Estás seguro?',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/api/categorias/${idCategoria}`, { method: 'DELETE' })
      .then(respuesta => {
        if(!respuesta.ok) throw new Error("Error al borrar");
        return respuesta.text();
      })
      .then(mensaje => {
        mostrarAlertaExito('¡Borrada!');
        cargarCategoriasGastos();
      })
      .catch(error => mostrarAlertaError('Error', 'No se pudo eliminar la categoría.'));
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
    document.getElementById('fecha-gasto').value = new Date().toISOString().split('T')[0]; // Fecha de hoy
}

function cargarUltimosGastos() {
    fetch('/api/expensas')
        .then(respuesta => respuesta.json())
        .then(gastos => {
            const tbody = document.getElementById('tbody-ultimos-gastos');
            if(!tbody) return;
            
            let filasHTML = '';
            
            gastos.slice(0, 20).forEach(gasto => {
                filasHTML += `<tr>
                <td>${new Date(gasto.date).toLocaleDateString('es-AR')}</td>
                <td><span class="badge bg-secondary">${gasto.category.name}</span></td>
                <td>${gasto.description || '-'}</td>
                <td class="text-danger fw-bold">$${gasto.amount}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarGastoParaEditar(${gasto.id},${gasto.category.id},${gasto.amount},'${gasto.description || ''}', '${gasto.date}')" data-bs-toggle="modal" data-bs-target="#modalGasto">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto(${gasto.id})">Eliminar</button>
                </td>
                </tr>`;
            });
            
            tbody.innerHTML = filasHTML;
        })
        .catch(error => console.error("Error al cargar gastos:", error));
}

function eliminarGasto(idGasto){
  Swal.fire({
    title: '¿Borrar Gasto?',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, borrar'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/api/expensas/${idGasto}`,{ method: 'DELETE' })
      .then(respuesta => {
        if(!respuesta.ok) throw new Error("Error al eliminar");
        return respuesta.text();
      })
      .then(mensaje => {
        mostrarAlertaExito('¡Borrada!');
        cargarUltimosGastos();
      })
      .catch(error => mostrarAlertaError('Error', 'No se pudo eliminar el gasto.'));
    }
  });
}

function cargarGastoParaEditar(id, categoriaId, monto, descripcion, fecha) {
    idGastoEnEdicion = id;
    let fechaHTML = fecha.split('T')[0];

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

//-- CARRITO DE VENTA --

function agregarAlCarrito(idVariante, nombre, marca, talle, color, precio, cantidadDeseada){

  let cantidadAInsertar = parseInt(cantidadDeseada);
  let precioNumerico = parseFloat(precio);
  //Controla si agrega un articulo ya existente
  let itemExistente = carrito.find(item => item.idVariante === idVariante)

  if(itemExistente){
    itemExistente.quantity += cantidadAInsertar;
  } else {
    const itemAgregado = {
      idVariante: idVariante,
      name: nombre,
      brand: marca,
      size: talle,
      color: color,
      price: precioNumerico,
      quantity: cantidadAInsertar
    }
    carrito.push(itemAgregado);

  }
  actualizarCarritoHTML();
}

function actualizarCarritoHTML(){
  const listaHTML = document.getElementById("lista-carrito");
  
  let totalGeneral = 0;
  let htmlAcumulado = '';

  carrito.forEach(item => {
    let subtotal = item.quantity * item.price;
    totalGeneral += subtotal;

    htmlAcumulado += `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <h6 class="my-0">${item.name} <small class="text-muted">(${item.size} - ${item.color})</small></h6>
        <small class="fw-bold text-success">$${subtotal}</small>
      </div>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="cambiarCantidadCarrito(${item.idVariante}, -1)">-</button>
        <span class="mx-2 fw-bold">${item.quantity}</span>
        <button class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="cambiarCantidadCarrito(${item.idVariante}, 1)">+</button>
        <button class="btn btn-sm btn-danger ms-3 px-2 py-0" onclick="eliminarDelCarrito(${item.idVariante})">X</button>
      </div>
    </li>`;
  });
  
  listaHTML.innerHTML = htmlAcumulado;
  document.getElementById("total-carrito").innerText = totalGeneral;
}

function eliminarDelCarrito(idVariante) {
    carrito = carrito.filter(item => item.idVariante !== idVariante);
    actualizarCarritoHTML();
}

function cambiarCantidadCarrito(idVariante, cambio){
    let item = carrito.find(item => item.idVariante === idVariante);
    if (item) {
        item.quantity += cambio;

        if(item.quantity <= 0) {
            eliminarDelCarrito(idVariante);
        } else {
            actualizarCarritoHTML();
        }
    }
}

function vaciarCarrito() {
  if(carrito.length > 0 && confirm("¿Estas seguro de vaciar el carrito?")) {
    carrito = [];
    actualizarCarritoHTML();
  }
}

// -- PESTAÑA DE COMPRA --

function agregarAlIngreso(idVariante, nombre, marca, talle, color, precio, cantidadDeseada){

    let cantidadAInsertar = parseInt(cantidadDeseada);
    //Controla si agrega un articulo ya existente
    let itemExistente = ingreso.find(item => item.idVariante === idVariante)

    if(itemExistente){
        itemExistente.quantity += cantidadAInsertar;
    } else {
        const itemAgregado = {
            idVariante: idVariante,
            name: nombre,
            brand: marca,
            size: talle,
            color: color,
            unitPrice: parseFloat(precio),
            quantity: cantidadAInsertar
        }
        ingreso.push(itemAgregado);

    }
    actualizarIngresoHTML();
}

function actualizarIngresoHTML(){
  const listaHTML = document.getElementById("lista-ingreso");

  let totalGeneral = 0;
  let htmlAcumulado = '';

  ingreso.forEach(item => {
    let subtotal = item.quantity * item.unitPrice;
    totalGeneral += subtotal;

    htmlAcumulado += `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <h6 class="my-0">${item.name} <small class="text-muted">(${item.size} - ${item.color})</small></h6>
        <small class="fw-bold text-danger">$${subtotal}</small>
      </div>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="cambiarCantidadIngreso(${item.idVariante}, -1)">-</button>
        <span class="mx-2 fw-bold">${item.quantity}</span>
        <button class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="cambiarCantidadIngreso(${item.idVariante}, 1)">+</button>
        <button class="btn btn-sm btn-danger ms-3 px-2 py-0" onclick="eliminarDelIngreso(${item.idVariante})">X</button>
      </div>
    </li>`;
  });
  
  listaHTML.innerHTML = htmlAcumulado;
  document.getElementById("total-ingreso").innerText = totalGeneral;
}

function eliminarDelIngreso(idVariante) {
    ingreso = ingreso.filter(item => item.idVariante !== idVariante);
    actualizarIngresoHTML();
}

function cambiarCantidadIngreso(idVariante, cambio){
    let item = ingreso.find(item => item.idVariante === idVariante);
    if (item) {
        item.quantity += cambio;

        if(item.quantity <= 0) {
            eliminarDelIngreso(idVariante);
        } else {
            actualizarIngresoHTML();
        }
    }
}

function vaciarIngreso() {
    if(ingreso.length > 0 && confirm("¿Estas seguro de vaciar el ingreso?")) {
        ingreso = [];
        actualizarIngresoHTML();
    }
}

// -- HISTORIALES Y BALANCES --

function cargarHistorialVentas(mesFiltro) {
    let url = '/api/ventas';
    
    if (mesFiltro) {
        let partes = mesFiltro.split('-');
        url += `?anio=${partes[0]}&mes=${partes[1]}`;
    }

    fetch(url)
        .then(respuesta => respuesta.json())
        .then(ventas => {
            const tbody = document.getElementById('tbody-historial-ventas');
            const tablaVentas = document.getElementById('tabla-ventas');
            const mensajeVacio = document.getElementById('mensaje-sin-ventas');

            tbody.innerHTML = '';
            
            if (ventas.length === 0) {
                tablaVentas.style.display = 'none';
                mensajeVacio.style.display = 'block';
            } else {
                tablaVentas.style.display = 'table';
                mensajeVacio.style.display = 'none';
            }

            let filasHTML = '';
            ventas.slice(0, 150).forEach(venta => { // Limitar a los últimos 500 registros
                let listaDetalles = '';
                venta.details.forEach(detalle => {
                    listaDetalles += `${detalle.quantity}x  ${detalle.variant.articleName} - Talle: ${detalle.variant.size} (${detalle.variant.color}) - $${detalle.unitPrice*detalle.quantity} <br>`
                });
                filasHTML += `<tr>
                <td>${venta.id}</td>
                <td>${new Date(venta.date).toLocaleString('es-AR')}</td>
                <td><span class="badge bg-primary">${venta.seller || '-'}</span></td>
                <td>${venta.paymentMethod}</td>
                <td>${listaDetalles}</td>
                <td class="fw-bold text-success">$${venta.totalAmount}</td>
                </tr>`;
            });
            tbody.innerHTML = filasHTML;
        })
        .catch(error => console.error("Error al cargar el historial:", error));
}

function cargarHistorialCompras(mesFiltro) {
  let url = '/api/compras';
  if (mesFiltro) {
    let partes = mesFiltro.split('-');
    url += `?anio=${partes[0]}&mes=${partes[1]}`;
  }

  fetch(url)
  .then(respuesta => respuesta.json())
  .then(compras => {
    const tbody = document.getElementById('tbody-historial-compras');
    const tablaCompras = document.getElementById('tabla-compras');
    const mensajeVacio = document.getElementById('mensaje-sin-compras');

    tbody.innerHTML = '';

    if (compras.length === 0) {
      tablaCompras.style.display = 'none';
      mensajeVacio.style.display = 'block';
    } else{
      tablaCompras.style.display = 'table';
      mensajeVacio.style.display = 'none';
    }

    let filasHTML = '';
    compras.slice(0, 150).forEach(compra => {
      // Calcular badge de estado
      let badgeEstado = '';
      if (compra.status === 'PAGADA') {
        badgeEstado = '<span class="badge bg-success">PAGADA</span>';
      } else if (compra.status === 'PENDIENTE') {
        badgeEstado = '<span class="badge bg-warning text-dark">PENDIENTE</span>';
      } else if (compra.status === 'ANULADA') {
        badgeEstado = '<span class="badge bg-danger">ANULADA</span>';
      }

      // Calcular montos pagado y deuda
      const pagado = compra.paidAmount || 0;
      const deuda = compra.pendingAmount || 0;

      // En el historial de compras NO se muestra el botón de pagar (solo lectura)
      filasHTML += `<tr>
        <td>${compra.id}</td>
        <td>${new Date(compra.date).toLocaleString('es-AR')}</td>
        <td>${sanitizeText(compra.supplier)}</td>
        <td>${sanitizeText(compra.invoiceNumber || '-')}</td>
        <td class="fw-bold">$${compra.totalAmount}</td>
        <td class="text-success">$${pagado.toFixed(2)}</td>
        <td class="text-danger">$${deuda.toFixed(2)}</td>
        <td>${badgeEstado}</td>
      </tr>`;
    });
    tbody.innerHTML = filasHTML;
  })
  .catch(error => console.error("Error al cargar el historial:", error));
}

// Función para abrir el modal de pago
function abrirModalPago(compraId, proveedor, numeroFactura, total, deuda) {
  document.getElementById('pago-compra-id').value = compraId;
  document.getElementById('pago-proveedor-nombre').innerText = proveedor;
  document.getElementById('pago-factura-numero').innerText = numeroFactura;
  document.getElementById('pago-total-compra').innerText = '$' + total.toFixed(2);
  document.getElementById('pago-deuda-pendiente').innerText = '$' + deuda.toFixed(2);
  document.getElementById('monto-pago').value = '';
  document.getElementById('metodo-pago-parcial').value = 'EFECTIVO';

  var modal = new bootstrap.Modal(document.getElementById('modalRegistrarPago'));
  modal.show();

  // Enfocar el campo de monto después de abrir
  setTimeout(() => {
    document.getElementById('monto-pago').focus();
  }, 300);
}

// Función para confirmar el pago
function confirmarPagoCompra() {
  const compraId = parseInt(document.getElementById('pago-compra-id').value);
  const monto = parseFloat(document.getElementById('monto-pago').value);
  const metodoPago = document.getElementById('metodo-pago-parcial').value;

  // Validaciones
  if (isNaN(monto) || monto <= 0) {
    Swal.fire({
      title: 'Error',
      text: 'Ingrese un monto válido mayor a cero',
      icon: 'error'
    });
    return;
  }

  const pagoPayload = {
    amount: monto,
    paymentMethod: metodoPago
  };

  const celdaPagado = document.getElementById(`deuda-pagado-${compraId}`);
  const celdaPendiente = document.getElementById(`deuda-pendiente-${compraId}`);
  const celdaAccion = document.getElementById(`deuda-accion-${compraId}`);
  
  // Calcular valores optimistas
  const pagadoActual = celdaPagado ? parseFloat(celdaPagado.innerText.replace('$', '')) : 0;
  const deudaActual = celdaPendiente ? parseFloat(celdaPendiente.innerText.replace('$', '')) : 0;
  const nuevoPagado = pagadoActual + monto;
  const nuevaDeuda = deudaActual - monto;

  // Cerrar modal inmediatamente para mejor UX
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrarPago'));
  modal.hide();

  fetch(`/api/compras/${compraId}/pagos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pagoPayload)
  })
    .then(respuesta => {
      if (!respuesta.ok) {
        return respuesta.text().then(text => {
          throw new Error(text || 'Error al registrar el pago');
        });
      }
      return respuesta.json();
    })
    .then(compraActualizada => {
      if (celdaPagado) {
        celdaPagado.innerText = `$${nuevoPagado.toFixed(2)}`;
      }
      if (celdaPendiente) {
        celdaPendiente.innerText = `$${compraActualizada.pendingAmount.toFixed(2)}`;
      }
      
      // Si la deuda llegó a 0, actualizar UI para mostrar como pagada
      if (compraActualizada.pendingAmount <= 0 && celdaAccion) {
        celdaAccion.innerHTML = '<span class="badge bg-success">PAGADA</span>';
        
        const fila = document.getElementById(`deuda-row-${compraId}`);
        if (fila) {
          fila.style.transition = 'opacity 0.5s ease';
          fila.style.opacity = '0.5';
        }
      }

      // Mostrar éxito
      Swal.fire({
        title: '¡Pago registrado!',
        text: `Se registró un pago de $${monto.toFixed(2)}. Deuda restante: $${compraActualizada.pendingAmount.toFixed(2)}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Solo recargar el resumen de deudas, no la tabla completa
      actualizarResumenDeudas();
    })
    .catch(error => {
      Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error'
      });
      // En caso de error, recargar para sincronizar estado
      cargarDeudas();
    });
}

// Función auxiliar para actualizar solo el resumen de deudas sin recargar toda la tabla
function actualizarResumenDeudas() {
  const filasDeuda = document.querySelectorAll('#tbody-deudas tr');
  let totalDeuda = 0;
  let cantidadDeudas = filasDeuda.length;

  filasDeuda.forEach(fila => {
    const celdaPendiente = fila.querySelector('td:nth-child(7)');
    if (celdaPendiente) {
      const deuda = parseFloat(celdaPendiente.innerText.replace('$', '')) || 0;
      if (deuda > 0) {
        totalDeuda += deuda;
      } else {
        cantidadDeudas--; // No contar deudas ya pagadas
      }
    }
  });

  const resumenTotal = document.getElementById('resumen-total-deudas');
  const resumenCantidad = document.getElementById('resumen-cantidad-deudas');
  
  if (resumenTotal) {
    resumenTotal.innerText = totalDeuda.toFixed(2);
  }
  if (resumenCantidad) {
    resumenCantidad.innerText = cantidadDeudas;
  }
}

// Función para cargar deudas pendientes con proveedores
function cargarDeudas() {
  fetch('/api/compras')
  .then(respuesta => respuesta.json())
  .then(compras => {
    const tbody = document.getElementById('tbody-deudas');
    const tablaDeudas = document.getElementById('tabla-deudas');
    const mensajeVacio = document.getElementById('mensaje-sin-deudas');
    const resumenTotal = document.getElementById('resumen-total-deudas');
    const resumenCantidad = document.getElementById('resumen-cantidad-deudas');

    tbody.innerHTML = '';

    // Filtrar solo las compras pendientes
    const deudas = compras.filter(c => c.status === 'PENDIENTE');

    // Ordenar por fecha ascendente (más antiguas primero)
    deudas.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calcular totales
    const totalDeuda = deudas.reduce((sum, d) => sum + (d.pendingAmount || 0), 0);
    const cantidadDeudas = deudas.length;

    // Actualizar panel de resumen
    resumenTotal.innerText = totalDeuda.toFixed(2);
    resumenCantidad.innerText = cantidadDeudas;

    if (deudas.length === 0) {
      tablaDeudas.style.display = 'none';
      mensajeVacio.style.display = 'block';
    } else {
      tablaDeudas.style.display = 'table';
      mensajeVacio.style.display = 'none';
    }

    let filasHTML = '';
    deudas.slice(0, 150).forEach(compra => {
      const pagado = compra.paidAmount || 0;
      const deuda = compra.pendingAmount || 0;

      // Botón de pagar siempre visible en la pantalla de deudas
      let botonPago = `<button class="btn btn-sm btn-success" onclick="abrirModalPago(${compra.id}, '${escapeQuotes(compra.supplier)}', '${escapeQuotes(compra.invoiceNumber || '-')}', ${compra.totalAmount}, ${deuda})">💰 Pagar</button>`;

    filasHTML += `<tr id="deuda-row-${compra.id}">
          <td>${compra.id}</td>
          <td>${new Date(compra.date).toLocaleString('es-AR')}</td>
          <td>${sanitizeText(compra.supplier)}</td>
          <td>${sanitizeText(compra.invoiceNumber || '-')}</td>
          <td class="fw-bold">$${compra.totalAmount}</td>
          <td id="deuda-pagado-${compra.id}" class="text-success">$${pagado.toFixed(2)}</td>
          <td id="deuda-pendiente-${compra.id}" class="text-danger fw-bold">$${deuda.toFixed(2)}</td>
          <td id="deuda-accion-${compra.id}">${botonPago}</td>
        </tr>`;
    });
    tbody.innerHTML = filasHTML;
  })
  .catch(error => console.error("Error al cargar las deudas:", error));
}

function cargarHistorialMovimientos(mesFiltro) {
    let url = '/api/stock';
    
    if (mesFiltro) {
        let partes = mesFiltro.split('-');
        url += `?anio=${partes[0]}&mes=${partes[1]}`;
    }

    fetch(url)
        .then(respuesta => respuesta.json())
        .then(movimientos => {
            const tbody = document.getElementById('tbody-historial-movimientos');
            const tablaMovimientos = document.getElementById('tabla-movimientos');
            const mensajeVacio = document.getElementById('mensaje-sin-movimientos');

            tbody.innerHTML = '';
            
            if (movimientos.length === 0) {
                tablaMovimientos.style.display = 'none';
                mensajeVacio.style.display = 'block';
            } else{
                tablaMovimientos.style.display = 'table';
                mensajeVacio.style.display = 'none';
            }
            let filasHTML = '';
            movimientos.slice(0, 500).forEach(movimiento => { // Limitar a los últimos 500 registros
                filasHTML += `<tr>
                <td>${movimiento.id}</td><td>${new Date(movimiento.createdAt).toLocaleString('es-AR')}</td><td> ${movimiento.variant.articleName} - Talle: ${movimiento.variant.size} (${movimiento.variant.color})</td><td>${movimiento.movementType}</td><td>${movimiento.quantity}</td><td>${movimiento.reason}</td>
                </tr>`;
            });
            tbody.innerHTML = filasHTML;
        })
        .catch(error => console.error("Error al cargar el historial:", error));
}

function cargarHistorialGastos(mesFiltro) {
    let url = '/api/expensas';
    if (mesFiltro) {
        let partes = mesFiltro.split('-');
        url += `?anio=${partes[0]}&mes=${partes[1]}`;
    }

    fetch(url)
        .then(respuesta => respuesta.json())
        .then(gastos => {
            const tbody = document.getElementById('tbody-historial-gastos');
            const tablaGastos = document.getElementById('tabla-historial-gastos');
            const mensajeVacio = document.getElementById('mensaje-sin-gastos');

            if (gastos.length === 0) {
                tablaGastos.style.display = 'none';
                mensajeVacio.style.display = 'block';
                tbody.innerHTML = '';
            } else {
                tablaGastos.style.display = 'table';
                mensajeVacio.style.display = 'none';
                
                let filasHTML = '';
                //Limite de 500
                gastos.slice(0, 500).forEach(gasto => {
                    filasHTML += `<tr>
                    <td>${gasto.id}</td><td>${new Date(gasto.date).toLocaleString('es-AR')}</td><td><span class="badge bg-secondary">${gasto.category.name}</span></td><td>${gasto.description || '-'}</td><td class="text-danger fw-bold">$${gasto.amount}</td>
                    </tr>`;
                });
                
                tbody.innerHTML = filasHTML;
            }
        })
        .catch(error => console.error("Error al cargar el historial:", error));
}

function cargarBalanceGeneral(mesAnio){
    let periodo = mesAnio.split('-');
    fetch(`/api/reportes/balance?anio=${periodo[0]}&mes=${periodo[1]}`)
        .then(respuesta => respuesta.json())
        .then(datos => {
            // -- Columna Izquierda (Ingresos) --
            document.getElementById('resumen-ventas-cantidad').innerText = datos.totalVentasRealizadas;
            document.getElementById('resumen-prendas-vendidas').innerText = datos.prendasVendidas;
            document.getElementById('resumen-ingresos-ventas').innerText = datos.ingresosVentas.toFixed(2); //Dos decimales

            // -- Columna Central (Gastos Administrativos)
            
            document.getElementById('resumen-gastos-cant-admin').innerText = datos.cantGastosAdmin;
            document.getElementById('resumen-gastos-admin').innerText = datos.gastosAdministrativos.toFixed(2);

            // -- Columna Derecha (Egresos) --
            document.getElementById('resumen-compras-cantidad').innerText = datos.totalComprasRealizadas;
            document.getElementById('resumen-prendas-ingresadas').innerText = datos.prendasIngresadas;
            document.getElementById('resumen-egresos-compras').innerText = datos.egresosCompras.toFixed(2);

            // -- Resultados --
            document.getElementById('resumen-ingresos-total').innerText = datos.ingresosTotales.toFixed(2);
            document.getElementById('resumen-egresos-total').innerText = datos.egresosTotales.toFixed(2);

            // -- Resultado Final --
            const spanGanancia = document.getElementById('resumen-ganancia-total');
            spanGanancia.innerText = datos.utilidadNeta.toFixed(2);

            // Pérdida: Rojo. Ganancia: verde.
            if (datos.utilidadNeta < 0) {
                spanGanancia.style.color = '#f44336';
            } else {
                spanGanancia.style.color = '#4CAF50';
            }
        })
        .catch(error => console.error("Error al cargar el balance:", error));
}

// --- EVENTOS ---

// --- LOGIN ---
document.getElementById('formulario-login').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const usuarioIngresado = document.getElementById('username').value;
    const contrasenaIngresada = document.getElementById('password').value;

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: usuarioIngresado,
            password: contrasenaIngresada
        })
    })
    .then(respuesta => {
      if (!respuesta.ok) {
        return respuesta.text().then(text => {
          throw new Error(text || "Credenciales incorrectas");
        });
      }
      return respuesta.json();
    })
    .then(datos => {
        localStorage.setItem('tokenJWT', datos.token);
        
        // Alerta moderna de bienvenida
        Swal.fire({
            title: '¡Bienvenido!',
            text: datos.mensaje,
            timer: 1500,
            showConfirmButton: false
        });

        let pantallaLogin = document.getElementById('pantalla-login');
        pantallaLogin.classList.remove('d-flex');
        pantallaLogin.classList.add('d-none');

        document.getElementById('app-principal').style.display = 'block';
        
        // Lee qué dice adentro de la pulsera
        const infoUsuario = decodificarToken(datos.token);
        
        // Si el usuario NO es admin, botones admin y report escondidos
        if (infoUsuario && infoUsuario.rol !== 'ADMIN') {
            document.getElementById('btn-nav-admin').style.display = 'none';
            document.getElementById('btn-nav-reportes').style.display = 'none';
        } else {
            // Si es admin, los botones estan visibles
            document.getElementById('btn-nav-admin').style.display = 'inline-block';
            document.getElementById('btn-nav-reportes').style.display = 'inline-block';
        }

        cargarArticulos();
        cargarMarcas();
        cargarCategoriasArticulos();
    })
    .catch(error => {
        // Alerta moderna de error
        Swal.fire({
            title: 'Acceso Denegado',
            text: 'Usuario o contraseña incorrectos.'
        });
    });
});

// -- ARTICULOS --

// Recibe el momento cuando se intenta subir el formulario
document.getElementById('formulario-articulo').addEventListener('submit', function(evento) {
    
    // Frena la recarga de la página
    evento.preventDefault();

    // Arma el objeto JavaScript con lo que el usuario escribió
    const nuevoArticulo = {
        name: document.getElementById('nombre').value,
        brandId: parseInt(document.getElementById('marca-articulo').value),
        categoryId: parseInt(document.getElementById('categoria-articulo').value),
        description: document.getElementById('descripcion').value
    };

    // Modo creacion
    let urlFetch = '/api/articulos';
    let metodoHTTP = 'POST';

    //Modo edicion
    if(idArticuloEnEdicion !== null) {
        urlFetch = `/api/articulos/${idArticuloEnEdicion}`;
        metodoHTTP = 'PUT'; //Actualizar
    }

    //Envio
  fetch(urlFetch, {
    method: metodoHTTP,
    headers: {
      'Content-Type': 'application/json' // tipo JSON
    },
    // convierte el objeto JavaScript en texto que Java entiende
    body: JSON.stringify(nuevoArticulo)
  })
  .then(respuesta => {
    if(!respuesta.ok) throw new Error("Error en el servidor");
    return respuesta.text();
  })
  .then(mensaje => {
    // Cierra el Modal
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalArticulo'));
    modal.hide();

    mostrarAlertaExito('Artículo guardado');
    cancelarEdicionArticulo();
    cargarArticulos();
  })
  .catch(error => console.error("Error al guardar:", error));
});


// -- VARIANTES --
document.getElementById('formulario-variante').addEventListener('submit', function(evento){

  evento.preventDefault();

  // Validación: asegurar que hay un artículo seleccionado
  if (!idArticuloEnMemoria) {
    mostrarAlertaError('Error', 'No hay un artículo seleccionado. Por favor, seleccione un artículo primero.');
    return;
  }

  let codigoIngresado = document.getElementById('codigo-barras').value.trim();

  const nuevaVariante = {
    size: document.getElementById('talle').value,
    color: document.getElementById('color').value,
    price: document.getElementById('precio').value,
    barCode: codigoIngresado === "" ? null : codigoIngresado
  };

  //Modo creacion
  let urlFetch = `/api/articulos/${idArticuloEnMemoria}/variantes`;
  let metodoHTTP = 'POST';

  //Modo edicion
  if(idVarianteEnEdicion !== null){
    urlFetch = `/api/articulos/${idArticuloEnMemoria}/variantes/${idVarianteEnEdicion}`;
    metodoHTTP = 'PUT';
  }
    

  fetch(urlFetch, {
    method: metodoHTTP,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevaVariante)
  })
  .then(respuesta => {
    if(!respuesta.ok) throw new Error("Error en el servidor");
    return respuesta.text();
  })
  .then(mensaje => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalVariante'));
    modal.hide();

    mostrarAlertaExito('Variante guardada');

    cancelarEdicionVariante();
    cargarArticulos();

  })
  .catch(error => console.error("Error al guardar:", error));

});

// -- MARCAS --
document.getElementById('formulario-marca').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const nuevaMarca = {
        name: document.getElementById('nombre-marca').value,
        description: document.getElementById('descripcion-marca').value
    }

    //Creacion
    let urlFetch = '/api/marcas';
    let metodoHTTP = 'POST';

    //Modo edicion
    if(idMarcaEnEdicion !== null) {
        urlFetch = `/api/marcas/${idMarcaEnEdicion}`;
        metodoHTTP = 'PUT';
    }

  fetch(urlFetch, {
    method: metodoHTTP,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevaMarca)
  })
  .then(respuesta => {
    if(!respuesta.ok) throw new Error("Error en el servidor");
    return respuesta.text();
  })
  .then(mensaje => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalMarca'));
    modal.hide();

    mostrarAlertaExito('Marca guardada');

    cancelarEdicionMarca();
    cargarMarcas();
  })
  .catch(error => console.error("Error al guardar:", error));
});

// -- CATEGORIAS --
document.getElementById('formulario-categoria-articulo').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const nuevaCategoria = {
        name: document.getElementById('nombre-categoria-articulo').value,
        description: document.getElementById('descripcion-categoria-articulo').value
    }

    //Creacion
    let urlFetch = '/api/categorias-articulos';
    let metodoHTTP = 'POST';

    //Modo edicion
    if(idCategoriaArticuloEnEdicion !== null) {
        urlFetch = `/api/categorias-articulos/${idCategoriaArticuloEnEdicion}`;
        metodoHTTP = 'PUT';
    }

  fetch(urlFetch, {
    method: metodoHTTP,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevaCategoria)
  })
  .then(respuesta => {
    if(!respuesta.ok) throw new Error("Error en el servidor");
    return respuesta.text();
  })
  .then(mensaje => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalCategoriaArticulo'));
    modal.hide();

    mostrarAlertaExito('Categoria guardada');

    cancelarEdicionCategoriaArticulo();
    cargarCategoriasArticulos();
  })
  .catch(error => console.error("Error al guardar:", error));
});


// -- STOCK --

document.getElementById('formulario-stock').addEventListener('submit',function(evento){
    evento.preventDefault();

    //Crear el objeto
    const nuevoMovimiento = {
        variantId: idVarianteEnMemoria,
        quantity: document.getElementById('cantidad-stock').value,
        movementType: document.getElementById('tipo-movimiento').value,
        reason: document.getElementById('motivo').value
    };

    //Enviar
    fetch('/api/stock',{
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify(nuevoMovimiento)
    })
    .then(respuesta => {
        if (!respuesta.ok) throw new Error("Error en el servidor.")
        return respuesta.text();
    })
    .then(mensajeDelServidor => {
        var modal = bootstrap.Modal.getInstance(document.getElementById('modalStock'));
        modal.hide();
        
        Swal.fire('Stock guardado', '', 'success');

        document.getElementById('formulario-stock').reset();

        cargarArticulos();
    })
    .catch(error => console.error("Error al guardar:", error));
});

// -- GASTOS GENERALES --

document.getElementById('formulario-gastos').addEventListener('submit', function(evento){
    evento.preventDefault();

    let fechaJava = document.getElementById('fecha-gasto').value + "T00:00:00";
    let idCat = document.getElementById('categoria-gasto').value;

    const nuevoGasto = {
        category: {id: idCat}, 
        amount: document.getElementById('monto-gasto').value,
        description: document.getElementById('descripcion-gasto').value,
        date: fechaJava
    };

    let urlFetch = `/api/expensas`;
    let metodoHTTP = 'POST';

    if(idGastoEnEdicion !== null){
        urlFetch = `/api/expensas/${idGastoEnEdicion}`;
        metodoHTTP = 'PUT';
    }

    fetch(urlFetch, {
        method: metodoHTTP,
        headers: { 'Content-Type' : 'application/json' },
        body: JSON.stringify(nuevoGasto)
    })
    .then(respuesta => {
        if(!respuesta.ok) throw new Error("Error al guardar.");
        return respuesta.text();
    })
    .then(mensaje => {
        var modal = bootstrap.Modal.getInstance(document.getElementById('modalGasto'));
        modal.hide();
        
    Swal.fire('Guardada', '', 'success');
    cargarUltimosGastos();
        cancelarEdicionGasto();
    })
    .catch(error => console.error("Error:",error));
});

document.getElementById('formulario-nueva-categoria').addEventListener('submit', function(evento){
    evento.preventDefault();

    let nombre = document.getElementById('nombre-nueva-categoria').value;
    const nuevaCategoria = { name: nombre };

    let urlFetch = '/api/categorias';
    let metodoHTTP = 'POST';

    if (idCategoriaGastoEnEdicion !== null) {
        urlFetch = `/api/categorias/${idCategoriaGastoEnEdicion}`;
        metodoHTTP = 'PUT';
    }

    fetch(urlFetch, {
        method: metodoHTTP,
        headers: { 'Content-Type' : 'application/json' },
        body: JSON.stringify(nuevaCategoria)
    })
    .then(respuesta => {
        if(!respuesta.ok) throw new Error("Error al guardar la categoria.");
        return respuesta.text();
    })
    .then(mensaje => {
    Swal.fire('Guardada', '', 'success');
    cancelarEdicionCategoriaGasto();
        cargarCategoriasGastos();
    })
    .catch(error => console.error("Error:",error));
});

// -- VENTA --
document.getElementById('btn-cobrar').addEventListener('click',function() {
        //Control
        if (carrito.length === 0) {
            alert("Carrito vacio.")
            return;
        }

        //--Envio del carrito a Back-end--
        let itemsJava = {};

        carrito.forEach(item => {
            itemsJava[item.idVariante] = item.quantity;
        });
        
        const ventaPayload = {
            metodoPago: document.getElementById('metodo-pago-venta').value,
            items: itemsJava,
            seller: document.getElementById('vendedor').value
        };

        fetch('/api/ventas', {
            method: 'POST',
            headers:{
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(ventaPayload)
        })
        .then(respuesta => {
            if(!respuesta.ok) throw new Error("Error del servidor.")
            return respuesta.text();
        })
        .then(mensajeDelServidor => {
            alert(mensajeDelServidor);

            carrito = [];

            actualizarCarritoHTML();

            cargarArticulos();
        })
        .catch(error => console.error("Error al cobrar: ",error));
});

// -- COMPRA --
document.getElementById('btn-pagar').addEventListener('click',function() {
        //Control
        if (ingreso.length === 0) {
            alert("Ingreso vacio.")
            return;
        }

        //--Envio del ingreso a Back-end--
        let itemsJava = [];

        ingreso.forEach(item => {
            const itemBackend = {
                variantId: item.idVariante,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }
            itemsJava.push(itemBackend);
        });
        
    const proveedor = document.getElementById('proveedor-compra').value.trim();
    const numeroFactura = document.getElementById('numero-factura-compra').value.trim();

    // Validar campos requeridos
    if (!proveedor) {
      alert("Por favor ingrese el proveedor.");
      document.getElementById('proveedor-compra').focus();
      return;
    }

    if (!numeroFactura) {
      alert("Por favor ingrese el número de factura.");
      document.getElementById('numero-factura-compra').focus();
      return;
    }

    const ingresoPayload = {
      metodoPago: document.getElementById('metodo-pago-compra').value,
      supplier: proveedor,
      invoiceNumber: numeroFactura,
      items: itemsJava
    };

        fetch('/api/compras', {
            method: 'POST',
            headers:{
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(ingresoPayload)
        })
        .then(respuesta => {
            if(!respuesta.ok) throw new Error("Error del servidor.")
            return respuesta.text();
        })
  .then(mensajeDelServidor => {
      alert(mensajeDelServidor);

      ingreso = [];

      // Limpiar campos del formulario
      document.getElementById('proveedor-compra').value = '';
      document.getElementById('numero-factura-compra').value = '';

      actualizarIngresoHTML();

      cargarArticulos();
    })
        .catch(error => console.error("Error al pagar: ",error));
});

// -- EVENTOS PARA MODAL DE REGISTRAR PAGO --
document.getElementById('monto-pago').addEventListener('keypress', function(evento) {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    confirmarPagoCompra();
  }
});

// -- EVENTOS PARA MODAL DE COMPRA ESCANEADA --
document.getElementById('cantidad-escaneado').addEventListener('keypress', function(evento) {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    confirmarIngresoEscaneado();
  }
});

document.getElementById('precio-compra-escaneado').addEventListener('keypress', function(evento) {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    document.getElementById('cantidad-escaneado').focus();
  }
});

// -- LECTOR DE BARRAS --
document.querySelectorAll('.input-lector').forEach(inputLector => {

    inputLector.addEventListener('keyup', function(evento) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            let codigoEscaneado = this.value.trim();

            if(codigoEscaneado !== "") {
                // Deshabilitar input durante la búsqueda para evitar dobles escaneos
                this.disabled = true;
                buscarPorCodigoBarras(codigoEscaneado, this.id);
                this.value = '';
                // Rehabilitar input después de un breve delay
                setTimeout(() => {
                    this.disabled = false;
                    this.focus();
                }, 500);
            }
        }
    });

    // Evento adicional para escáneres que no envían Enter (detección por timeout)
    let timeoutId;
    inputLector.addEventListener('input', function() {
        clearTimeout(timeoutId);
        let codigoEscaneado = this.value.trim();

        // Si el código tiene más de 5 caracteres, esperar 100ms por más caracteres
        if(codigoEscaneado.length >= 5) {
            timeoutId = setTimeout(() => {
                if(this.value.trim() === codigoEscaneado && !this.disabled) {
                    this.disabled = true;
                    buscarPorCodigoBarras(codigoEscaneado, this.id);
                    this.value = '';
                    setTimeout(() => {
                        this.disabled = false;
                        this.focus();
                    }, 500);
                }
            }, 100);
        }
    });
});

// -- HISTORIALES Y REPORTES --

// - HISTORIAL VENTAS -
document.getElementById('form-filtro-ventas').addEventListener('submit',function(evento){
  evento.preventDefault();

  let mesElegido = document.getElementById('mesAnio-ventas').value;
  cargarHistorialVentas(mesElegido);

});

// - HISTORIAL COMPRAS -
document.getElementById('form-filtro-compras').addEventListener('submit',function(evento){
  evento.preventDefault();

  let mesElegido = document.getElementById('mesAnio-compras').value;
  cargarHistorialCompras(mesElegido);

});

// - HISTORIAL GASTOS -
document.getElementById('form-filtro-gastos').addEventListener('submit',function(evento){
  evento.preventDefault();

  let mesElegido = document.getElementById('mesAnio-gastos').value;
  cargarHistorialGastos(mesElegido);

});

// - HISTORIAL MOVIMIENTOS -
document.getElementById('form-filtro-movimientos').addEventListener('submit',function(evento){
  evento.preventDefault();

  let mesElegido = document.getElementById('mesAnio-movimientos').value;
  cargarHistorialMovimientos(mesElegido);

});

// - BALANCE GENERAL -
document.getElementById('form-filtro-balances').addEventListener('submit', function(evento){
    evento.preventDefault();
    let mesElegido = document.getElementById('mesAnio-balances').value;
    cargarBalanceGeneral(mesElegido);
});
