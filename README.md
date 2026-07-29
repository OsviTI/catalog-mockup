# Catalog Studio

Mockup funcional para automatizar la creación de catálogos comerciales PDF a partir de productos estructurados. El flujo reemplaza la actualización manual recurrente en Adobe InDesign por una experiencia web de importación, validación, edición, diseño, versionado y exportación.

## Funciones incluidas

- Dashboard de catálogos con búsqueda, filtros, estados, duplicación y eliminación protegida.
- Creación obligatoria desde un PDF base, conservado como fuente para reconstruir y actualizar el catálogo.
- Centro de importaciones con sesiones persistentes y evidencia de origen.
- Comparación de Excel/CSV por código estable, con diferencias por campo y aplicación selectiva.
- Resolución interactiva de conflictos: editar la fila, conservar el actual, usar una alternativa o agregarla con un código nuevo.
- Bandeja de productos ausentes del Excel sin eliminación automática.
- Diagnóstico de PDF de InDesign, extracción de texto nativo y candidatos revisables.
- Reglas específicas para la plantilla oficial, confianza por completitud y señalización de campos no detectados.
- Recortes visuales provisionales por producto, con zoom, desplazamiento y guardado persistente como imagen.
- Edición de precios dentro de la ficha y de las revisiones de importación, sin una etapa separada.
- Acciones por producto para reemplazar su fotografía o abrir una mejora creativa no destructiva.
- Vista previa y descarga construidas sobre todas las páginas del PDF original, conservando su diseño y reemplazando sólo las zonas modificadas.
- Descarga de una plantilla Excel oficial con hojas `Productos`, `Categorías` y `Catálogo`.
- Carga de imágenes de producto e imágenes ambientales por categoría.
- Plantilla oficial reutilizable de Crystal Rock, tres propuestas alternativas y variantes de portada configurables.
- Editor de contenido, densidad, colores y datos visibles con previsualización en vivo.
- Generación y descarga de PDF digital A4.
- Historial inmutable de versiones, publicación y restauración como nuevo borrador.
- Guardado automático en IndexedDB.
- Guardado forzado antes de navegar con acciones **Continuar** en cada etapa del catálogo.
- Copia portable con datos, versiones e imágenes para restaurar la demo en otro navegador.

## Tecnologías

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Zustand para estado de la aplicación
- IndexedDB mediante `idb` para datos persistentes y archivos binarios
- Zod para validación
- `read-excel-file` y `write-excel-file` para Excel
- jsPDF + html2canvas para PDF A4
- PDF.js para diagnóstico, extracción, renderizado de alta resolución y recortes del PDF de origen
- Lucide para iconografía
- Router hash local y tipado para navegación portable

Las dependencias pesadas de Excel y PDF se cargan dinámicamente únicamente cuando el usuario las necesita.

## Uso local

Requiere Node.js 20.19 o superior.

```bash
npm install
npm run dev
```

Vite mostrará la URL local, habitualmente `http://localhost:5173`.

## Validación y producción

```bash
npm run lint
npm run build
npm run preview
```

El resultado de producción queda en `dist/`. La navegación utiliza rutas con hash, por lo que el build se puede servir desde hosting estático sin reglas especiales de reescritura.

## Datos y persistencia

El mockup no necesita backend. Los cambios se guardan automáticamente en el navegador mediante IndexedDB. Las imágenes no se almacenan como texto dentro del estado: se conservan como `Blob` y se resuelven mediante URL temporal cuando se muestran.

Para conservar o trasladar una presentación:

1. Abrir **Configuración**.
2. Elegir **Exportar copia**.
3. En el navegador de destino, usar **Importar copia**.

La copia JSON contiene catálogos, productos, sesiones de importación, historial creativo, configuración, versiones e imágenes. No debe considerarse un formato de integración definitivo para producción.

## Estructura principal

```text
src/
├── components/     componentes de interfaz y documento editorial
├── data/           datos demostrativos y plantillas iniciales
├── hooks/          resolución de imágenes persistidas
├── lib/            Excel, PDF, IndexedDB, formato y validación
├── pages/          pantallas del flujo
├── store/          estado, acciones y guardado automático
└── types/          modelo de dominio
```

La fuente oficial de decisiones es [docs/contexto_maestro_agente.md](docs/contexto_maestro_agente.md). La arquitectura implementada está detallada en [docs/ARQUITECTURA_MOCKUP.md](docs/ARQUITECTURA_MOCKUP.md).

## Límites actuales

- Los datos son locales y demostrativos; no existen usuarios, permisos ni backend.
- Las APIs de productos están previstas como evolución, pero no forman parte de esta etapa.
- Los PDF sin texto nativo se diagnostican correctamente, pero la extracción OCR requiere elegir un proveedor externo.
- La detección inicial de zonas de imagen utiliza reglas por plantilla y requiere aprobación humana antes de asociar el recorte al producto.
- La plantilla oficial conserva el PDF original como fondo. Las zonas modificadas se recomponen con estilos equivalentes, sin depender de tipografías licenciadas o efectos privados del archivo fuente de InDesign.
- La generación visual mediante IA real queda desacoplada hasta definir proveedor, privacidad y costos; cada producto ya expone el flujo local de mejora, historial y aprobación.
- El PDF está optimizado para distribución digital A4, no para preprensa con sangrado, perfiles CMYK o marcas de corte.
- Las imágenes referenciadas por nombre desde Excel deben cargarse manualmente para vincular el archivo real.
