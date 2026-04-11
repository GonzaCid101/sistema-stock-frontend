# Sistema de Gestión de Lencería - Frontend

Frontend web para sistema de gestión de inventario, ventas y compras de una tienda de lencería.

## 🚀 Características

- **Punto de Venta**: Escaneo de códigos de barras, carrito de compras, múltiples métodos de pago
- **Gestión de Inventario**: Artículos, variantes (talle/color), stock en tiempo real
- **Administración**: Marcas, categorías, movimientos de stock
- **Reportes**: Historial de ventas, compras, movimientos y balances financieros
- **Autenticación JWT**: Login seguro con roles (Admin/Vendedor)

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para cargar Bootstrap y SweetAlert2 desde CDN)
- Servidor backend corriendo en `https://sistema-negocio-lenceria-api.onrender.com`

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd sistema-stock-frontend
```

2. Abrir el archivo `index.html` en un servidor web local:
```bash
# Opción 1: Python 3
python -m http.server 5501

# Opción 2: Node.js (live-server)
npx live-server --port=5501

# Opción 3: VS Code con extensión Live Server
# Click derecho en index.html → "Open with Live Server"
```

3. Acceder a `http://localhost:5501`

## 📁 Estructura del Proyecto

```
sistema-stock-frontend/
├── index.html          # Estructura HTML principal con todos los modales y vistas
├── app.js              # Lógica de la aplicación (aprox. 2000 líneas)
├── .vscode/
│   └── settings.json   # Configuración de Live Server
└── README.md           # Este archivo
```

## 🔌 API Endpoints

El frontend se conecta a la API REST con los siguientes endpoints:

| Recurso | Endpoints |
|---------|-----------|
| Autenticación | `POST /api/auth/login` |
| Artículos | `GET/POST/PUT/DELETE /api/articulos` |
| Variantes | `GET/POST/PUT/DELETE /api/articulos/{id}/variantes` |
| Marcas | `GET/POST/PUT/DELETE /api/marcas` |
| Categorías Artículos | `GET/POST/PUT/DELETE /api/categorias-articulos` |
| Categorías Gastos | `GET/POST/PUT/DELETE /api/categorias` |
| Ventas | `GET/POST /api/ventas` |
| Compras | `GET/POST /api/compras` |
| Stock | `GET/POST /api/stock` |
| Gastos | `GET/POST/PUT/DELETE /api/expensas` |
| Reportes | `GET /api/reportes/balance` |

## 🎨 Características de UI

- **Responsive**: Diseño adaptativo para móvil, tablet y desktop
- **Modales**: Interacciones fluidas con Bootstrap 5
- **Loader Global**: Indicador de carga para peticiones HTTP
- **Alertas Personalizadas**: Sin iconos, con mensaje "success" por defecto
- **Escáner de Códigos**: Soporte para lectores de código de barras USB

## 🔒 Seguridad

- Autenticación JWT con token almacenado en localStorage
- Interceptor de peticiones que agrega header `Authorization: Bearer {token}`
- Control de acceso basado en roles (Admin vs Vendedor)
- Sanitización de inputs para prevenir XSS

## 🐛 Manejo de Errores

El sistema incluye manejo de errores para:
- Respuestas HTTP no exitosas (401, 403, 404, 500)
- Pérdida de sesión (redirección automática al login)
- Errores de red
- Datos inválidos en formularios

## 📝 Notas Técnicas

### Formatos de Respuesta
- **GET**: El backend retorna JSON
- **POST/PUT/DELETE**: El backend retorna texto plano (mensaje de confirmación)

### Variables Globales
El sistema usa variables globales para mantener estado:
- `carrito[]`: Items en el carrito de ventas
- `ingreso[]`: Items en el ingreso de compras
- `idArticuloEnMemoria`: ID del artículo seleccionado para agregar variantes
- `id*EnEdicion`: IDs de entidades en modo edición

### Dependencias CDN
- Bootstrap 5.3.0 (CSS y JS)
- SweetAlert2 11.x

## 👥 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso completo a todas las pantallas |
| **VENDEDOR** | Solo Punto de Venta y Compras |

## 📊 Funcionalidades Principales

### 1. Punto de Venta
- Escaneo rápido por código de barras
- Búsqueda manual de productos
- Carrito con modificación de cantidades
- Selección de vendedor y método de pago

### 2. Compras
- Registro de ingreso de mercadería
- Precio de costo por unidad
- Historial de compras por período

### 3. Administración
- **Artículos**: CRUD completo con variantes
- **Marcas**: Gestión de marcas de productos
- **Categorías**: Clasificación de artículos
- **Stock**: Movimientos de entrada/salida

### 4. Reportes
- Ventas por período
- Compras por período
- Movimientos de stock
- Gastos generales
- **Balance Financiero**: Ingresos vs Egresos vs Gastos

## 🤝 Contribución

1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es privado y propiedad de Cid inc.

---

**Versión**: 1.0.0  
**Última actualización**: Abril 2026
