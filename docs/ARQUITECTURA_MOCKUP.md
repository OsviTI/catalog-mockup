# Arquitectura del mockup

## Criterios

La solución está pensada para una demostración funcional, portable y durable sin backend. Se priorizan código tipado, separación por dominio, carga inicial razonable y una ruta clara hacia una futura versión multiusuario.

## Capas

### Presentación

Las páginas orquestan cada etapa del flujo y reutilizan componentes de interfaz. Los catálogos sin documento de origen usan `CatalogDocument`. Cuando existe un PDF base, `SourcePdfCatalogDocument` renderiza todas sus páginas originales y recompone únicamente las zonas de productos que cambiaron. La vista previa y la descarga comparten la misma representación.

### Estado y dominio

El store de Zustand contiene acciones explícitas para catálogos, categorías, productos, configuración, sesiones de importación, recursos creativos y versiones. Cada modificación clona el espacio de trabajo, aplica la operación y programa el guardado automático.

### Persistencia

IndexedDB tiene dos almacenes:

- `workspace`: estado serializable completo;
- `assets`: imágenes originales como `Blob`.

Los componentes obtienen una URL temporal para cada imagen y la liberan al desmontarse. La copia portable transforma temporalmente los blobs en data URLs dentro del JSON y los reconstruye antes de iniciar la transacción de restauración.

El guardado mantiene un debounce durante la edición y expone además una operación
`flushSave`. La navegación del flujo la ejecuta antes de cambiar de pantalla, de modo
que el botón **Continuar** y las pestañas confirman la escritura actual en IndexedDB.

### Entrada y salida

- Excel/CSV se transforma primero en una sesión temporal y un conjunto de diferencias por campo.
- PDF.js diagnostica documentos, extrae texto nativo, renderiza evidencia y produce candidatos revisables.
- Importaciones se limita al diagnóstico, la revisión y la conciliación de datos. La página activa puede alternar entre evidencia original y resultado compuesto con candidatos temporales; la composición completa del documento permanece exclusivamente en Vista previa.
- Cada catálogo nuevo conserva obligatoriamente su PDF base como activo protegido de la primera sesión.
- Las páginas se rasterizan en alta resolución con los decodificadores WebAssembly de PDF.js. Las regiones normalizadas permiten previsualizar, desplazar y escalar un recorte sin modificar la fuente.
- Vista previa renderiza cada página del PDF base como fondo inalterado. Para la plantilla oficial reconocida compara el producto vigente con la extracción original y superpone sólo las fichas modificadas; los productos agregados se incorporan en páginas nuevas antes del cierre.
- Un recorte aprobado se codifica como WebP y se guarda en `assets`. Desde el mismo candidato puede sustituirse la fotografía o crear una versión local mejorada; el resultado permanece en la sesión hasta aplicar sus decisiones.
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
├── PDF base(id + Blob + metadata)
└── Imagen/recorte(id + Blob + metadata)
```

## Rendimiento

- PDF.js, jsPDF, html2canvas y las librerías Excel utilizan importación dinámica.
- Las imágenes permanecen como blobs y no inflan el estado de React.
- La rasterización de páginas usada por varios candidatos se comparte mediante una caché en memoria por activo y página.
- Las páginas filtran el store con selectores.
- Los ajustes creativos y el reemplazo de imagen se abren desde el producto oficial o desde su candidato de importación; no requieren cargar una pantalla creativa completa.
- El guardado tiene un debounce breve para agrupar escritura durante edición.
- Vite divide automáticamente los módulos de Excel y PDF en chunks independientes.
- El PDF usa fuera de pantalla la misma composición basada en el documento original, sin el zoom de interfaz.

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
