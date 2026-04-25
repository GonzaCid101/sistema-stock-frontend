
/*====== LISTENERS ====*/

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
  let esModoEdicion = false;

  //Modo edicion
  if(idArticuloEnEdicion !== null) {
    urlFetch = `/api/articulos/${idArticuloEnEdicion}`;
    metodoHTTP = 'PUT'; //Actualizar
    esModoEdicion = true;
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
    return respuesta.json(); // Cambiado a json() para obtener el objeto
  })
  .then(articuloGuardado => {
    // Cierra el Modal
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalArticulo'));
    modal.hide();

    mostrarAlertaExito('Artículo guardado');
    cancelarEdicionArticulo();

    // Optimistic UI: Actualizar DOM directamente sin recargar
    const listaAdmin = document.getElementById('catalogo-admin');
    if (listaAdmin) {
      const articuloName = sanitizeText(articuloGuardado.name);
      const articuloBrand = sanitizeText(articuloGuardado.brand?.name || '');
      const articuloDescription = sanitizeText(articuloGuardado.description || '');
      const articuloId = parseInt(articuloGuardado.id);
      const brandId = parseInt(articuloGuardado.brand?.id || 0);
      const categoryId = parseInt(articuloGuardado.category?.id || 0);
      const categoryName = sanitizeText(articuloGuardado.category?.name || '');

      if (esModoEdicion) {
        // Modo edición: Actualizar el elemento existente
        const articuloExistente = listaAdmin.querySelector(`li[data-articulo-id="${articuloId}"]`);
        if (articuloExistente) {
          // Actualizar los textos del artículo
          articuloExistente.setAttribute('data-marca', brandId);
          articuloExistente.setAttribute('data-categoria', categoryId);
          
          const strongNombre = articuloExistente.querySelector('strong');
          if (strongNombre) strongNombre.innerText = articuloName;
          
          const badges = articuloExistente.querySelectorAll('.badge');
          if (badges.length >= 1) badges[0].innerText = articuloBrand;
          if (badges.length >= 2) badges[1].innerText = categoryName;
          
          const pDesc = articuloExistente.querySelector('p.text-muted');
          if (pDesc) pDesc.innerText = articuloDescription;
          
          // Actualizar onclick handlers
          const btnAgregar = articuloExistente.querySelector('.btn-outline-primary');
          if (btnAgregar) btnAgregar.setAttribute('onclick', `prepararVariante('${escapeQuotes(articuloName)}',${articuloId})`);
          
          const btnEditar = articuloExistente.querySelector('.btn-outline-secondary');
          if (btnEditar) btnEditar.setAttribute('onclick', `cargarArticuloParaEditar(${articuloId}, '${escapeQuotes(articuloName)}', ${brandId},${categoryId}, '${escapeQuotes(articuloDescription)}')`);
        }
      } else {
        // Modo creación: Insertar nuevo artículo
        const nuevoArticuloHTML = crearElementoAdmin(articuloGuardado, articuloName, articuloBrand, articuloDescription, articuloId, brandId, categoryId, categoryName);
        listaAdmin.insertAdjacentElement('afterbegin', nuevoArticuloHTML);
      }
    }
  })
  .catch(error => {
    console.error("Error al guardar:", error);
    cargarArticulos(); // Solo en caso de error
  });
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
  let esModoEdicion = false;

  //Modo edicion
  if(idVarianteEnEdicion !== null){
    urlFetch = `/api/articulos/${idArticuloEnMemoria}/variantes/${idVarianteEnEdicion}`;
    metodoHTTP = 'PUT';
    esModoEdicion = true;
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
    return respuesta.json(); // Cambiado a json() para obtener la variante creada
  })
  .then(varianteCreada => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalVariante'));
    modal.hide();

    mostrarAlertaExito('Variante guardada');
    cancelarEdicionVariante();

    // Optimistic UI: Agregar la nueva variante directamente al DOM sin recargar
    if (varianteCreada && idArticuloEnMemoria) {
      const listaAdmin = document.getElementById('catalogo-admin');
      if (listaAdmin) {
        // Buscar el artículo padre en el DOM
        const articuloLi = listaAdmin.querySelector(`li.list-group-item[data-articulo-id="${idArticuloEnMemoria}"]`);
        if (articuloLi) {
          const ulVariantes = articuloLi.querySelector('ul.list-group');
          if (ulVariantes) {
            const vSize = sanitizeText(varianteCreada.size);
            const vColor = sanitizeText(varianteCreada.color);
            const vPrice = parseFloat(varianteCreada.price);
            const vStock = parseInt(varianteCreada.stock) || 0;
            const vId = parseInt(varianteCreada.id);
            const vBarCode = escapeQuotes(varianteCreada.barCode || '');

            const nuevaFilaHTML = `<li class="list-group-item d-flex justify-content-between align-items-center bg-light" data-variante-id="${vId}">
              <span>Talle: <strong>${vSize}</strong> | Color: <strong>${vColor}</strong> | Precio: ${vPrice} | Stock: <span id="stock-badge-${vId}" class="badge ${vStock > 0 ? 'bg-success' : 'bg-danger'}">${vStock}</span></span>
              <div>
                <button class="btn btn-sm btn-warning me-1" onclick="prepararStock(${vId},'${escapeQuotes(articuloLi.querySelector('strong').innerText)}','${escapeQuotes(vSize)}')" data-bs-toggle="modal" data-bs-target="#modalStock">📦 Stock</button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarVarianteParaEditar(${idArticuloEnMemoria},${vId}, '${escapeQuotes(vSize)}', '${escapeQuotes(vColor)}', ${vPrice}, '${vBarCode}')" data-bs-toggle="modal" data-bs-target="#modalVariante">✏️</button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarVariante(${idArticuloEnMemoria}, ${vId}, this)">🗑️</button>
              </div>
            </li>`;

            if (esModoEdicion){
              const filaVieja = ulVariantes.querySelector(`li[data-variante-id="${vId}"]`);
              if (filaVieja) {
                filaVieja.outerHTML = nuevaFilaHTML;
              }
            } else {
              ulVariantes.insertAdjacentHTML('beforeend', nuevaFilaHTML);
            }
          }
        }
      }
    }
  })
  .catch(error => {
    console.error("Error al guardar:", error);
    // En caso de error, recargar para sincronizar
    cargarArticulos();
  });

});

// -- MARCAS --
document.getElementById('formulario-marca').addEventListener('submit', function(evento) {
  evento.preventDefault();

  const marcaName = document.getElementById('nombre-marca').value;
  const marcaDesc = document.getElementById('descripcion-marca').value;

  const nuevaMarca = {
    name: marcaName,
    description: marcaDesc
  }

  //Creacion
  let urlFetch = '/api/marcas';
  let metodoHTTP = 'POST';
  let esModoEdicion = false;

  //Modo edicion
  if(idMarcaEnEdicion !== null) {
    urlFetch = `/api/marcas/${idMarcaEnEdicion}`;
    metodoHTTP = 'PUT';
    esModoEdicion = true;
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
    return respuesta.json();
  })
  .then(marcaGuardada => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalMarca'));
    modal.hide();

    mostrarAlertaExito('Marca guardada');
    cancelarEdicionMarca();

    // Optimistic UI: Actualizar DOM sin recargar
    const listaMarcas = document.getElementById('lista-admin-marcas');
    const selectMarca = document.getElementById('marca-articulo');
    const filtroMarca = document.getElementById('filtro-marca-admin');
    
    const marcaId = parseInt(marcaGuardada.id);
    const marcaNameSafe = sanitizeText(marcaGuardada.name);
    const marcaDescSafe = sanitizeText(marcaGuardada.description || '');

    if (esModoEdicion) {
      // Actualizar elemento existente
      const marcaExistente = listaMarcas?.querySelector(`li[data-marca-id="${marcaId}"]`);
      if (marcaExistente) {
        const strong = marcaExistente.querySelector('strong');
        const small = marcaExistente.querySelector('small');
        if (strong) strong.innerText = marcaNameSafe;
        if (small) small.innerText = marcaDescSafe;
        
        // Actualizar botón de editar
        const btnEditar = marcaExistente.querySelector('.btn-outline-secondary');
        if (btnEditar) {
          btnEditar.setAttribute('onclick', `cargarMarcaParaEditar(${marcaId}, '${escapeQuotes(marcaNameSafe)}', '${escapeQuotes(marcaDescSafe)}')`);
        }
      }
      // Actualizar selects
      actualizarOptionEnSelect('marca-articulo', marcaId, marcaNameSafe);
      actualizarOptionEnSelect('filtro-marca-admin', marcaId, marcaNameSafe);
    } else {
      // Insertar nueva marca
      if (listaMarcas) {
        const nuevaMarcaHTML = `
          <li class="list-group-item d-flex justify-content-between align-items-center" data-marca-id="${marcaId}">
            <div>
              <strong>${marcaNameSafe}</strong> <br>
              <small class="text-muted">${marcaDescSafe || ''}</small>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalMarca" onclick="cargarMarcaParaEditar(${marcaId}, '${escapeQuotes(marcaNameSafe)}', '${escapeQuotes(marcaDescSafe)}')">✏️ Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarMarca(${marcaId}, this)">🗑️ Borrar</button>
            </div>
          </li>`;
        listaMarcas.insertAdjacentHTML('afterbegin', nuevaMarcaHTML);
      }
      // Agregar a selects
      agregarOptionASelect('marca-articulo', marcaId, marcaNameSafe);
      agregarOptionASelect('filtro-marca-admin', marcaId, marcaNameSafe);
    }
  })
  .catch(error => {
    console.error("Error al guardar:", error);
    cargarMarcas(); // Solo en caso de error
  });
});

// Helper para actualizar option en select
function actualizarOptionEnSelect(selectId, id, texto) {
  const select = document.getElementById(selectId);
  if (select) {
    const option = select.querySelector(`option[value="${id}"]`);
    if (option) option.text = texto;
  }
}

// Helper para agregar option a select
function agregarOptionASelect(selectId, id, texto) {
  const select = document.getElementById(selectId);
  if (select) {
    const option = document.createElement('option');
    option.value = id;
    option.text = texto;
    select.appendChild(option);
  }
}

// -- CATEGORIAS --
document.getElementById('formulario-categoria-articulo').addEventListener('submit', function(evento) {
  evento.preventDefault();

  const catName = document.getElementById('nombre-categoria-articulo').value;
  const catDesc = document.getElementById('descripcion-categoria-articulo').value;

  const nuevaCategoria = {
    name: catName,
    description: catDesc
  }

  //Creacion
  let urlFetch = '/api/categorias-articulos';
  let metodoHTTP = 'POST';
  let esModoEdicion = false;

  //Modo edicion
  if(idCategoriaArticuloEnEdicion !== null) {
    urlFetch = `/api/categorias-articulos/${idCategoriaArticuloEnEdicion}`;
    metodoHTTP = 'PUT';
    esModoEdicion = true;
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
    return respuesta.json();
  })
  .then(categoriaGuardada => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalCategoriaArticulo'));
    modal.hide();

    mostrarAlertaExito('Categoria guardada');
    cancelarEdicionCategoriaArticulo();

    // Optimistic UI: Actualizar DOM sin recargar
    const listaCategorias = document.getElementById('lista-admin-categorias-articulos');
    const selectCategoria = document.getElementById('categoria-articulo');
    const filtroCategoria = document.getElementById('filtro-categoria-articulo-admin');
    
    const categoriaId = parseInt(categoriaGuardada.id);
    const categoriaNameSafe = sanitizeText(categoriaGuardada.name);
    const categoriaDescSafe = sanitizeText(categoriaGuardada.description || '');

    if (esModoEdicion) {
      // Actualizar elemento existente
      const categoriaExistente = listaCategorias?.querySelector(`li[data-categoria-art-id="${categoriaId}"]`);
      if (categoriaExistente) {
        const strong = categoriaExistente.querySelector('strong');
        const small = categoriaExistente.querySelector('small');
        if (strong) strong.innerText = categoriaNameSafe;
        if (small) small.innerText = categoriaDescSafe;
        
        // Actualizar botón de editar
        const btnEditar = categoriaExistente.querySelector('.btn-outline-secondary');
        if (btnEditar) {
          btnEditar.setAttribute('onclick', `cargarCategoriaArticuloParaEditar(${categoriaId}, '${escapeQuotes(categoriaNameSafe)}', '${escapeQuotes(categoriaDescSafe)}')`);
        }
      }
      // Actualizar selects
      actualizarOptionEnSelect('categoria-articulo', categoriaId, categoriaNameSafe);
      actualizarOptionEnSelect('filtro-categoria-articulo-admin', categoriaId, categoriaNameSafe);
    } else {
      // Insertar nueva categoría
      if (listaCategorias) {
        const nuevaCategoriaHTML = `
          <li class="list-group-item d-flex justify-content-between align-items-center" data-categoria-art-id="${categoriaId}">
            <div>
              <strong>${categoriaNameSafe}</strong> <br>
              <small class="text-muted">${categoriaDescSafe || ''}</small>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalCategoriaArticulo" onclick="cargarCategoriaArticuloParaEditar(${categoriaId}, '${escapeQuotes(categoriaNameSafe)}', '${escapeQuotes(categoriaDescSafe)}')">✏️ Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoriaArticulo(${categoriaId}, this)">🗑️ Borrar</button>
            </div>
          </li>`;
        listaCategorias.insertAdjacentHTML('afterbegin', nuevaCategoriaHTML);
      }
      // Agregar a selects
      agregarOptionASelect('categoria-articulo', categoriaId, categoriaNameSafe);
      agregarOptionASelect('filtro-categoria-articulo-admin', categoriaId, categoriaNameSafe);
    }
  })
  .catch(error => {
    console.error("Error al guardar:", error);
    cargarCategoriasArticulos(); // Solo en caso de error
  });
});


// -- STOCK --

document.getElementById('formulario-stock').addEventListener('submit',function(evento){
  evento.preventDefault();

  const cantidad = parseInt(document.getElementById('cantidad-stock').value);
  const tipoMov = document.getElementById('tipo-movimiento').value;
  
  //Crear el objeto
  const nuevoMovimiento = {
    variantId: idVarianteEnMemoria,
    quantity: cantidad,
    movementType: tipoMov,
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
    return respuesta.json();
  })
  .then(movimientoGuardado => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalStock'));
    modal.hide();

    Swal.fire('Stock guardado', '', 'success');
    document.getElementById('formulario-stock').reset();

    // Optimistic UI: Actualizar badge de stock en el DOM sin recargar
    if (idVarianteEnMemoria) {
      const stockBadge = document.getElementById(`stock-badge-${idVarianteEnMemoria}`);
      if (stockBadge && movimientoGuardado && movimientoGuardado.variant) {
        const nuevoStock = parseInt(movimientoGuardado.variant.stock);
        stockBadge.innerText = nuevoStock;
        stockBadge.className = `badge ${nuevoStock > 0 ? 'bg-success' : 'bg-danger'}`;
        
        // Actualizar también los inputs de cantidad máxima en punto de venta
        const inputCant = document.getElementById(`cant-${idVarianteEnMemoria}`);
        if (inputCant) {
          inputCant.max = nuevoStock;
          if (parseInt(inputCant.value) > nuevoStock) {
            inputCant.value = nuevoStock;
          }
        }
      }
    }
  })
  .catch(error => {
    console.error("Error al guardar:", error);
    cargarArticulos(); // Solo en caso de error
  });
});

// -- GASTOS GENERALES --

document.getElementById('formulario-gastos').addEventListener('submit', function(evento){
  evento.preventDefault();

  const fechaInput = document.getElementById('fecha-gasto').value;
  let fechaJava = fechaInput + "T00:00:00";
  let idCat = document.getElementById('categoria-gasto').value;
  const monto = document.getElementById('monto-gasto').value;
  const descripcion = document.getElementById('descripcion-gasto').value;

  const nuevoGasto = {
    category: {id: idCat},
    amount: monto,
    description: descripcion,
    date: fechaJava
  };

  let urlFetch = `/api/expensas`;
  let metodoHTTP = 'POST';
  let esModoEdicion = false;

  if(idGastoEnEdicion !== null){
    urlFetch = `/api/expensas/${idGastoEnEdicion}`;
    metodoHTTP = 'PUT';
    esModoEdicion = true;
  }

  fetch(urlFetch, {
    method: metodoHTTP,
    headers: { 'Content-Type' : 'application/json' },
    body: JSON.stringify(nuevoGasto)
  })
  .then(respuesta => {
    if(!respuesta.ok) throw new Error("Error al guardar.");
    return respuesta.json();
  })
  .then(gastoGuardado => {
    var modal = bootstrap.Modal.getInstance(document.getElementById('modalGasto'));
    modal.hide();

    Swal.fire('Guardada', '', 'success');
    cancelarEdicionGasto();

    // Optimistic UI: Actualizar tabla sin recargar
    const tbody = document.getElementById('tbody-ultimos-gastos');
    if (tbody) {
      const gastoId = parseInt(gastoGuardado.id);
      const fecha = new Date(gastoGuardado.date).toLocaleDateString('es-AR');
      const categoriaName = gastoGuardado.category?.name || '-';
      const desc = gastoGuardado.description || '-';
      const amount = parseFloat(gastoGuardado.amount).toFixed(2);

      if (esModoEdicion) {
        // Actualizar fila existente
        const filaExistente = tbody.querySelector(`tr#gasto-row-${gastoId}`);
        if (filaExistente) {
          filaExistente.innerHTML = `
            <td>${fecha}</td>
            <td><span class="badge bg-secondary">${categoriaName}</span></td>
            <td>${desc}</td>
            <td class="text-danger fw-bold">$${amount}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarGastoParaEditar(${gastoId},${gastoGuardado.category?.id || 0},${amount},'${desc}', '${gastoGuardado.date}')" data-bs-toggle="modal" data-bs-target="#modalGasto">Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto(${gastoId}, this)">Eliminar</button>
            </td>
          `;
        }
      } else {
        // Insertar nueva fila al principio
        const nuevaFilaHTML = `<tr id="gasto-row-${gastoId}">
          <td>${fecha}</td>
          <td><span class="badge bg-secondary">${categoriaName}</span></td>
          <td>${desc}</td>
          <td class="text-danger fw-bold">$${amount}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarGastoParaEditar(${gastoId},${gastoGuardado.category?.id || 0},${amount},'${desc}', '${gastoGuardado.date}')" data-bs-toggle="modal" data-bs-target="#modalGasto">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarGasto(${gastoId}, this)">Eliminar</button>
          </td>
        </tr>`;
        tbody.insertAdjacentHTML('afterbegin', nuevaFilaHTML);
      }
    }
  })
  .catch(error => {
    console.error("Error:",error);
    cargarUltimosGastos(); // Solo en caso de error
  });
});

document.getElementById('formulario-nueva-categoria').addEventListener('submit', function(evento){
  evento.preventDefault();

  let nombre = document.getElementById('nombre-nueva-categoria').value;
  const nuevaCategoria = { name: nombre };

  let urlFetch = '/api/categorias';
  let metodoHTTP = 'POST';
  let esModoEdicion = false;

  if (idCategoriaGastoEnEdicion !== null) {
    urlFetch = `/api/categorias/${idCategoriaGastoEnEdicion}`;
    metodoHTTP = 'PUT';
    esModoEdicion = true;
  }

  fetch(urlFetch, {
    method: metodoHTTP,
    headers: { 'Content-Type' : 'application/json' },
    body: JSON.stringify(nuevaCategoria)
  })
  .then(respuesta => {
    if(!respuesta.ok) throw new Error("Error al guardar la categoria.");
    return respuesta.json();
  })
  .then(categoriaGuardada => {
    Swal.fire('Guardada', '', 'success');
    cancelarEdicionCategoriaGasto();

    // Optimistic UI: Actualizar DOM sin recargar
    const listaCategorias = document.getElementById('lista-categorias-gastos');
    const selectCategoria = document.getElementById('categoria-gasto');
    
    const categoriaId = parseInt(categoriaGuardada.id);
    const categoriaNameSafe = sanitizeText(categoriaGuardada.name);

    if (esModoEdicion) {
      // Actualizar elemento existente
      const categoriaExistente = listaCategorias?.querySelector(`li[data-categoria-gasto-id="${categoriaId}"]`);
      if (categoriaExistente) {
        const span = categoriaExistente.querySelector('span');
        if (span) span.innerText = categoriaNameSafe;
        
        // Actualizar botón de editar
        const btnEditar = categoriaExistente.querySelector('.btn-outline-secondary');
        if (btnEditar) {
          btnEditar.setAttribute('onclick', `cargarCategoriaGastoParaEditar(${categoriaId}, '${escapeQuotes(categoriaNameSafe)}')`);
        }
      }
      // Actualizar select
      actualizarOptionEnSelect('categoria-gasto', categoriaId, categoriaNameSafe);
    } else {
      // Insertar nueva categoría
      if (listaCategorias) {
        const nuevaCategoriaHTML = `
          <li class="list-group-item d-flex justify-content-between align-items-center" data-categoria-gasto-id="${categoriaId}">
            <span>${categoriaNameSafe}</span>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-1" onclick="cargarCategoriaGastoParaEditar(${categoriaId}, '${escapeQuotes(categoriaNameSafe)}')">Editar</button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoriaGasto(${categoriaId}, this)">Eliminar</button>
            </div>
          </li>`;
        listaCategorias.insertAdjacentHTML('afterbegin', nuevaCategoriaHTML);
      }
      // Agregar a select
      agregarOptionASelect('categoria-gasto', categoriaId, categoriaNameSafe);
    }
  })
  .catch(error => {
    console.error("Error:",error);
    cargarCategoriasGastos(); // Solo en caso de error
  });
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
            mostrarAlertaExito('Operación Exitosa', 'El registro se guardó correctamente.');

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
      mostrarAlertaExito('Operación Exitosa', 'El registro se guardó correctamente.');

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
