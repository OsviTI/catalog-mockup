# Arquitectura del mockup

## Criterios

La solución está pensada para una demostración funcional, portable y durable sin backend. Se priorizan código tipado, separación por dominio, carga inicial razonable y una ruta clara hacia una futura versión multiusuario.

## Capas

### Presentación

Las páginas orquestan cada etapa del flujo y reutilizan componentes de interfaz. `CatalogDocument` es la única representación editorial del catálogo y se usa en el editor, la vista previa, las versiones y el PDF. Esto evita que la descarga difiera de lo que el usuario revisó.

### Estado y dominio

El store de Zustand contiene acciones explícitas para catálogos, categorías, productos, configuración, sesiones de importación, recursos creativos y versiones. Cada modificación clona el espacio de trabajo, aplica la operación y programa el guardado automático.

### Persistencia

IndexedDB tiene dos almacenes:

- `workspace`: estado serializable completo;
- `assets`: imágenes originales como `Blob`.

Los componentes obtienen una URL temporal para cada imagen y la liberan al desmontarse. La copia portable transforma temporalmente los blobs en data URLs dentro del JSON y los reconstruye antes de iniciar la transacción de restauración.

### Entrada y salida

- Excel/CSV se transforma primero en una sesión temporal y un conjunto de diferencias por campo.
- PDF.js diagnostica documentos, extrae texto nativo, renderiza evidencia y produce candidatos revisables.
- Zod y reglas de negocio generan errores o avisos.
- El libro oficial se genera con tres hojas.
- El PDF se construye página por página en A4.
- Cada descarga exitosa crea un snapshot de catálogo, categorías y productos.

## Modelo resumido

```text
Workspace
├── Settings
├── Templates
├── Catalogs
│   ├── CatalogSettings
│   ├── Categories
│   └── Products
├── Versions
│   └── Snapshot(Catalog + Categories + Products)
├── ImportSessions
│   ├── PDF candidates
│   └── Excel field changes
├── CreativeAssets
└── Activity

IndexedDB Assets
└── Asset(id + Blob + metadata)
```

## Rendimiento

- PDF.js, jsPDF, html2canvas y las librerías Excel utilizan importación dinámica.
- Las imágenes permanecen como blobs y no inflan el estado de React.
- Las páginas filtran el store con selectores.
- El guardado tiene un debounce breve para agrupar escritura durante edición.
- Vite divide automáticamente los módulos de Excel y PDF en chunks independientes.
- El PDF usa un documento A4 fuera de pantalla sin el zoom de interfaz.

## Portabilidad

La aplicación usa rutas hash, de modo que `dist/` funciona en hosting estático sin configurar fallback de servidor. La persistencia sigue perteneciendo al origen del navegador; para mover una demo debe utilizarse la copia portable desde Configuración.

## Camino a producción

La interfaz y el modelo pueden conservarse. IndexedDB debe reemplazarse o complementarse con:

- API autenticada;
- base de datos transaccional;
- almacenamiento de objetos para imágenes y PDFs;
- colas de trabajo para generación pesada;
- auditoría y permisos;
- versiones con autor y aprobación;
- importación idempotente y reportes de errores;
- observabilidad y copias de seguridad.

La generación en servidor sería recomendable si se requieren documentos extensos, tipografías corporativas controladas, gran volumen o preprensa profesional.
