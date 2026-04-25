/**
 * REPORTES.JS - Carritos, historiales, deudas y balances
 * Operaciones de venta, compra y reportes financieros
 */

// =========================================================
// CARRITO DE VENTA
// =========================================================

function agregarAlCarrito(idVariante, nombre, marca, talle, color, precio, cantidadDeseada) {
    const cantidadAInsertar = parseInt(cantidadDeseada);
    const precioNumerico = parseFloat(precio);
    const itemExistente = carrito.find(item => item.idVariante === idVariante);

    if (itemExistente) {
        itemExistente.quantity += cantidadAInsertar;
    } else {
        carrito.push({
            idVariante,
            name: nombre,
            brand: marca,
            size: talle,
            color,
            price: precioNumerico,
            quantity: cantidadAInsertar
        });
    }
    actualizarCarritoHTML();
}

function actualizarCarritoHTML() {
    const listaHTML = document.getElementById("lista-carrito");
    let totalGeneral = 0;
    let htmlAcumulado = '';

    carrito.forEach(item => {
        const subtotal = item.quantity * item.price;
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

function cambiarCantidadCarrito(idVariante, cambio) {
    const item = carrito.find(item => item.idVariante === idVariante);
    if (!item) return;

    item.quantity += cambio;

    if (item.quantity <= 0) {
        eliminarDelCarrito(idVariante);
    } else {
        actualizarCarritoHTML();
    }
}

function vaciarCarrito() {
    if (carrito.length > 0 && confirm("¿Estas seguro de vaciar el carrito?")) {
        carrito = [];
        actualizarCarritoHTML();
    }
}

// =========================================================
// CARRITO DE COMPRA (INGRESO)
// =========================================================

function agregarAlIngreso(idVariante, nombre, marca, talle, color, precio, cantidadDeseada) {
    const cantidadAInsertar = parseInt(cantidadDeseada);
    const itemExistente = ingreso.find(item => item.idVariante === idVariante);

    if (itemExistente) {
        itemExistente.quantity += cantidadAInsertar;
    } else {
        ingreso.push({
            idVariante,
            name: nombre,
            brand: marca,
            size: talle,
            color,
            unitPrice: parseFloat(precio),
            quantity: cantidadAInsertar
        });
    }
    actualizarIngresoHTML();
}

function actualizarIngresoHTML() {
    const listaHTML = document.getElementById("lista-ingreso");
    let totalGeneral = 0;
    let htmlAcumulado = '';

    ingreso.forEach(item => {
        const subtotal = item.quantity * item.unitPrice;
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

function cambiarCantidadIngreso(idVariante, cambio) {
    const item = ingreso.find(item => item.idVariante === idVariante);
    if (!item) return;

    item.quantity += cambio;

    if (item.quantity <= 0) {
        eliminarDelIngreso(idVariante);
    } else {
        actualizarIngresoHTML();
    }
}

function vaciarIngreso() {
    if (ingreso.length > 0 && confirm("¿Estas seguro de vaciar el ingreso?")) {
        ingreso = [];
        actualizarIngresoHTML();
    }
}

// =========================================================
// HISTORIALES
// =========================================================

function cargarHistorialVentas(mesFiltro) {
    let url = '/api/ventas';

    if (mesFiltro) {
        const partes = mesFiltro.split('-');
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
            ventas.slice(0, 150).forEach(venta => {
                let listaDetalles = '';
                venta.details.forEach(detalle => {
                    listaDetalles += `${detalle.quantity}x ${detalle.variant.articleName} - Talle: ${detalle.variant.size} (${detalle.variant.color}) - $${detalle.unitPrice * detalle.quantity} <br>`;
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
        const partes = mesFiltro.split('-');
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
            } else {
                tablaCompras.style.display = 'table';
                mensajeVacio.style.display = 'none';
            }

            let filasHTML = '';
            compras.slice(0, 150).forEach(compra => {
                let badgeEstado = '';
                if (compra.status === 'PAGADA') {
                    badgeEstado = '<span class="badge bg-success">PAGADA</span>';
                } else if (compra.status === 'PENDIENTE') {
                    badgeEstado = '<span class="badge bg-warning text-dark">PENDIENTE</span>';
                } else if (compra.status === 'ANULADA') {
                    badgeEstado = '<span class="badge bg-danger">ANULADA</span>';
                }

                const pagado = compra.paidAmount || 0;
                const deuda = compra.pendingAmount || 0;

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

function cargarHistorialMovimientos(mesFiltro) {
    let url = '/api/stock';

    if (mesFiltro) {
        const partes = mesFiltro.split('-');
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
            } else {
                tablaMovimientos.style.display = 'table';
                mensajeVacio.style.display = 'none';
            }

            let filasHTML = '';
            movimientos.slice(0, 500).forEach(movimiento => {
                filasHTML += `<tr>
                    <td>${movimiento.id}</td>
                    <td>${new Date(movimiento.createdAt).toLocaleString('es-AR')}</td>
                    <td>${movimiento.variant.articleName} - Talle: ${movimiento.variant.size} (${movimiento.variant.color})</td>
                    <td>${movimiento.movementType}</td>
                    <td>${movimiento.quantity}</td>
                    <td>${movimiento.reason}</td>
                </tr>`;
            });
            tbody.innerHTML = filasHTML;
        })
        .catch(error => console.error("Error al cargar el historial:", error));
}

function cargarHistorialGastos(mesFiltro) {
    let url = '/api/expensas';
    if (mesFiltro) {
        const partes = mesFiltro.split('-');
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
                gastos.slice(0, 500).forEach(gasto => {
                    filasHTML += `<tr>
                        <td>${gasto.id}</td>
                        <td>${new Date(gasto.date).toLocaleString('es-AR')}</td>
                        <td><span class="badge bg-secondary">${gasto.category.name}</span></td>
                        <td>${gasto.description || '-'}</td>
                        <td class="text-danger fw-bold">$${gasto.amount}</td>
                    </tr>`;
                });
                tbody.innerHTML = filasHTML;
            }
        })
        .catch(error => console.error("Error al cargar el historial:", error));
}

// =========================================================
// GESTIÓN DE DEUDAS Y PAGOS
// =========================================================

function abrirModalPago(compraId, proveedor, numeroFactura, total, deuda) {
    document.getElementById('pago-compra-id').value = compraId;
    document.getElementById('pago-proveedor-nombre').innerText = proveedor;
    document.getElementById('pago-factura-numero').innerText = numeroFactura;
    document.getElementById('pago-total-compra').innerText = '$' + total.toFixed(2);
    document.getElementById('pago-deuda-pendiente').innerText = '$' + deuda.toFixed(2);
    document.getElementById('monto-pago').value = '';
    document.getElementById('metodo-pago-parcial').value = 'EFECTIVO';

    const modal = new bootstrap.Modal(document.getElementById('modalRegistrarPago'));
    modal.show();

    setTimeout(() => document.getElementById('monto-pago').focus(), 300);
}

function confirmarPagoCompra() {
    const compraId = parseInt(document.getElementById('pago-compra-id').value);
    const monto = parseFloat(document.getElementById('monto-pago').value);
    const metodoPago = document.getElementById('metodo-pago-parcial').value;

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

    const pagadoActual = celdaPagado ? parseFloat(celdaPagado.innerText.replace('$', '')) : 0;
    const deudaActual = celdaPendiente ? parseFloat(celdaPendiente.innerText.replace('$', '')) : 0;
    const nuevoPagado = pagadoActual + monto;

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrarPago'));
    modal.hide();

    fetch(`/api/compras/${compraId}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

            if (compraActualizada.pendingAmount <= 0 && celdaAccion) {
                celdaAccion.innerHTML = '<span class="badge bg-success">PAGADA</span>';

                const fila = document.getElementById(`deuda-row-${compraId}`);
                if (fila) {
                    fila.style.transition = 'opacity 0.5s ease';
                    fila.style.opacity = '0.5';
                }
            }

            Swal.fire({
                title: '¡Pago registrado!',
                text: `Se registró un pago de $${monto.toFixed(2)}. Deuda restante: $${compraActualizada.pendingAmount.toFixed(2)}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            actualizarResumenDeudas();
        })
        .catch(error => {
            Swal.fire({ title: 'Error', text: error.message, icon: 'error' });
            cargarDeudas();
        });
}

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
                cantidadDeudas--;
            }
        }
    });

    const resumenTotal = document.getElementById('resumen-total-deudas');
    const resumenCantidad = document.getElementById('resumen-cantidad-deudas');

    if (resumenTotal) resumenTotal.innerText = totalDeuda.toFixed(2);
    if (resumenCantidad) resumenCantidad.innerText = cantidadDeudas;
}

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

            const deudas = compras.filter(c => c.status === 'PENDIENTE');
            cacheDeudas = deudas;
            deudas.sort((a, b) => new Date(a.date) - new Date(b.date));

            const totalDeuda = deudas.reduce((sum, d) => sum + (d.pendingAmount || 0), 0);
            const cantidadDeudas = deudas.length;

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
                const cantidadPagos = compra.payments ? compra.payments.length : 0;

                const botonesAccion = `
                    <button class="btn btn-sm btn-info me-1" onclick="verHistorialPagos(${compra.id})" title="Ver historial de pagos">
                        👁️ Pagos ${cantidadPagos > 0 ? `<span class="badge bg-light text-dark">${cantidadPagos}</span>` : ''}
                    </button>
                    <button class="btn btn-sm btn-success" onclick="abrirModalPago(${compra.id}, '${escapeQuotes(compra.supplier)}', '${escapeQuotes(compra.invoiceNumber || '-')}', ${compra.totalAmount}, ${deuda})">💰 Pagar</button>
                `;

                filasHTML += `<tr id="deuda-row-${compra.id}">
                    <td>${compra.id}</td>
                    <td>${new Date(compra.date).toLocaleString('es-AR')}</td>
                    <td>${sanitizeText(compra.supplier)}</td>
                    <td>${sanitizeText(compra.invoiceNumber || '-')}</td>
                    <td class="fw-bold">$${compra.totalAmount}</td>
                    <td id="deuda-pagado-${compra.id}" class="text-success">$${pagado.toFixed(2)}</td>
                    <td id="deuda-pendiente-${compra.id}" class="text-danger fw-bold">$${deuda.toFixed(2)}</td>
                    <td id="deuda-accion-${compra.id}">${botonesAccion}</td>
                </tr>`;
            });
            tbody.innerHTML = filasHTML;
        })
        .catch(error => console.error("Error al cargar las deudas:", error));
}

function verHistorialPagos(compraId) {
    const compra = cacheDeudas.find(c => c.id === compraId);

    if (!compra) {
        Swal.fire({ title: 'Error', text: 'No se encontró la información de la deuda', icon: 'error' });
        return;
    }

    document.getElementById('historial-proveedor').innerText = compra.supplier || '-';
    document.getElementById('historial-factura').innerText = compra.invoiceNumber || '-';
    document.getElementById('historial-total').innerText = `$${(compra.totalAmount || 0).toFixed(2)}`;

    const tbody = document.getElementById('tbody-historial-pagos');
    const mensajeSinPagos = document.getElementById('mensaje-sin-pagos');

    if (!compra.payments || compra.payments.length === 0) {
        tbody.innerHTML = '';
        mensajeSinPagos.style.display = 'block';
        document.getElementById('historial-total-pagado').innerText = '$0.00';
    } else {
        mensajeSinPagos.style.display = 'none';
        let filasHTML = '';
        let totalPagado = 0;

        compra.payments.forEach((pago, index) => {
            totalPagado += (pago.amount || 0);
            const fechaPago = pago.paymentDate ? new Date(pago.paymentDate).toLocaleString('es-AR') : '-';
            const metodoPago = pago.paymentMethod || '-';
            const montoPago = (pago.amount || 0).toFixed(2);

            filasHTML += `<tr>
                <td>${index + 1}</td>
                <td>${fechaPago}</td>
                <td><span class="badge bg-secondary">${metodoPago}</span></td>
                <td class="text-end fw-bold">$${montoPago}</td>
            </tr>`;
        });

        tbody.innerHTML = filasHTML;
        document.getElementById('historial-total-pagado').innerText = `$${totalPagado.toFixed(2)}`;
    }

    const modal = new bootstrap.Modal(document.getElementById('modalHistorialPagos'));
    modal.show();
}

// =========================================================
// BALANCES Y REPORTES
// =========================================================

function cargarBalanceGeneral(mesAnio) {
    const periodo = mesAnio.split('-');
    fetch(`/api/reportes/balance?anio=${periodo[0]}&mes=${periodo[1]}`)
        .then(respuesta => respuesta.json())
        .then(datos => {
            // Ingresos
            document.getElementById('resumen-ventas-cantidad').innerText = datos.totalVentasRealizadas;
            document.getElementById('resumen-prendas-vendidas').innerText = datos.prendasVendidas;
            document.getElementById('resumen-ingresos-ventas').innerText = datos.ingresosVentas.toFixed(2);

            // Gastos administrativos
            document.getElementById('resumen-gastos-cant-admin').innerText = datos.cantGastosAdmin;
            document.getElementById('resumen-gastos-admin').innerText = datos.gastosAdministrativos.toFixed(2);

            // Egresos
            document.getElementById('resumen-compras-cantidad').innerText = datos.totalComprasRealizadas;
            document.getElementById('resumen-prendas-ingresadas').innerText = datos.prendasIngresadas;
            document.getElementById('resumen-egresos-compras').innerText = datos.egresosCompras.toFixed(2);

            // Totales
            document.getElementById('resumen-ingresos-total').innerText = datos.ingresosTotales.toFixed(2);
            document.getElementById('resumen-egresos-total').innerText = datos.egresosTotales.toFixed(2);

            // Ganancia/Pérdida con color
            const spanGanancia = document.getElementById('resumen-ganancia-total');
            spanGanancia.innerText = datos.utilidadNeta.toFixed(2);
            spanGanancia.style.color = datos.utilidadNeta < 0 ? '#f44336' : '#4CAF50';
        })
        .catch(error => console.error("Error al cargar el balance:", error));
}
