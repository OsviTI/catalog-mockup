# Plan funcional: PDF, reconciliación Excel e imágenes con IA

## Objetivo

Ampliar Catalog Studio para que pueda recuperar un catálogo existente desde un PDF de InDesign, convertir sus productos en registros editables, comparar posteriormente una planilla Excel oficial y regenerar el PDF con los cambios aprobados.

## Estado de implementación

Implementado en el mockup local:

- sesiones persistentes para Excel y PDF;
- migración de datos sin pérdida desde el esquema anterior;
- comparación por código y diferencias seleccionables por campo;
- resolución explícita de productos ausentes;
- edición rápida de precios;
- diagnóstico, extracción nativa y renderizado de PDF;
- candidatos editables con evidencia, página y confianza;
- mejora local no destructiva de fotografías e historial creativo;
- conceptos visuales locales con una interfaz preparada para el futuro adaptador de IA.
- detección y aplicación de la plantilla oficial reutilizable de Crystal Rock;
- recomposición automática de páginas al agregar, retirar o reordenar productos.

Pendiente de proveedor externo: OCR para archivos escaneados y generación o edición avanzada mediante IA.

## Principios confirmados

- Los PDF normalmente provienen de Adobe InDesign.
- El código de producto es inicialmente estable.
- Excel es la fuente oficial para actualizar información.
- La ausencia de un producto en Excel requiere decisión humana.
- Ningún importador elimina productos automáticamente.
- La selección de servicios externos queda pendiente.
- El estudio creativo deberá generar nuevas imágenes y editar fotografías reales.

## Flujo general

```text
PDF de InDesign
  → diagnóstico
  → extracción nativa
  → candidatos de producto
  → revisión humana
  → catálogo editable
  → importación Excel
  → comparación por código
  → aprobación de cambios
  → edición de precios e imágenes
  → vista previa
  → nueva versión PDF
```

## 1. Centro de importaciones

Cada carga se registra como una sesión y nunca modifica inmediatamente el catálogo.

Estados:

- `uploaded`: archivo recibido;
- `analyzing`: en procesamiento;
- `needs_review`: existen productos o campos que requieren revisión;
- `ready`: la sesión puede aplicarse;
- `applied`: cambios incorporados al catálogo;
- `failed`: no se pudo completar el análisis.

Tipos de sesión:

- creación desde PDF;
- actualización desde Excel;
- futura sincronización mediante API.

## 2. Importación PDF

### Diagnóstico

El navegador analizará:

- número de páginas;
- tamaño del archivo;
- existencia y densidad de texto seleccionable;
- páginas sin texto;
- dimensiones y rotación;
- miniaturas para revisión.

Como los archivos provienen normalmente de InDesign, el primer camino será extracción nativa con PDF.js. El OCR será un adaptador posterior para páginas que no tengan texto utilizable.

### Resultado intermedio

La extracción no creará productos definitivos. Generará candidatos con:

- nombre;
- código;
- precio;
- moneda;
- categoría;
- datos técnicos;
- página de origen;
- texto original;
- imagen o recorte provisional;
- nivel de confianza;
- observaciones.

### Revisión

La interfaz mostrará la página original y el candidato seleccionado. El usuario podrá:

- corregir campos;
- unir fragmentos pertenecientes al mismo producto;
- separar productos detectados juntos;
- descartar bloques promocionales;
- reasignar categorías;
- reemplazar recortes por imágenes originales;
- aprobar productos individualmente o por lote.

Solo los candidatos aprobados se convertirán en productos del catálogo.

## 3. Comparación Excel

La planilla se procesa en un área temporal. El código exacto es la clave primaria de coincidencia.

Clasificaciones:

- `unchanged`: no existe diferencia;
- `updated`: cambió precio u otro campo;
- `new`: el código no existe en el catálogo;
- `missing`: existe en el catálogo pero no en Excel;
- `conflict`: el código está repetido o la coincidencia es dudosa.

Cuando el código no coincida se podrá sugerir una relación mediante nombre, modelo, capacidad y categoría, pero siempre requerirá confirmación.

### Reglas de aplicación

- Excel prevalece en los campos seleccionados para actualizar.
- El usuario puede aceptar todos los precios sin aceptar cambios de descripción, categoría o imagen.
- Los productos nuevos requieren categoría y validación antes de agregarse.
- Los productos ausentes se mantienen sin cambios hasta que el usuario decida.
- Aplicar una sesión crea un registro de cambios y actualiza el borrador, sin modificar versiones PDF anteriores.

## 4. Bandeja de productos ausentes

La sección `No encontrados en Excel` mostrará:

- código;
- nombre;
- categoría;
- precio actual;
- última aparición;
- imagen;
- posible coincidencia sugerida.

Acciones:

- conservar en el catálogo;
- retirar solamente de esta edición;
- vincular con otro registro del Excel;
- eliminar del borrador;
- archivar para revisarlo después.

La acción por defecto será no realizar ningún cambio.

## 5. Modo rápido de precios

Vista de alta densidad orientada a actualización:

- edición directa por fila;
- búsqueda por código o nombre;
- filtros por categoría y estado;
- precio anterior y nuevo;
- cambio porcentual masivo;
- selección múltiple;
- deshacer;
- resumen monetario;
- guardado como cambio pendiente antes de versionar.

## 6. Estudio creativo

Tipos de trabajo:

- portada;
- imagen ambiental de categoría;
- fondo o textura;
- edición de fotografía real;
- mejora de iluminación o composición;
- eliminación o reemplazo de fondo;
- extensión de encuadre;
- incorporación del producto real en una ambientación.

Flujo:

1. elegir destino y relación de aspecto;
2. ingresar descripción;
3. adjuntar fotografías de referencia;
4. seleccionar estilo y restricciones de marca;
5. generar variantes;
6. comparar con el original;
7. aprobar una variante;
8. guardar original, resultado y descripción;
9. vincularla al catálogo.

La imagen generada nunca reemplazará automáticamente el original. Las versiones anteriores conservarán la imagen utilizada en su momento.

## 7. Modelo de datos propuesto

- `SourceDocument`: archivo PDF o Excel y sus metadatos.
- `ImportSession`: proceso, estado, origen y resultados.
- `ExtractedProductCandidate`: producto provisional detectado.
- `FieldEvidence`: valor original, página, región y confianza.
- `ProductMatch`: vínculo propuesto entre catálogo y fuente.
- `ChangeSet`: conjunto de cambios revisables.
- `ChangeItem`: diferencia de un campo.
- `GeneratedAsset`: original, resultado, descripción y uso.

## 8. Arquitectura progresiva

### Etapa de mockup local

- PDF.js para diagnóstico, miniaturas y extracción nativa.
- Comparación Excel completamente funcional en el navegador.
- Datos de demostración para simular resultados de OCR o IA donde sea necesario.
- Persistencia en IndexedDB.

### Etapa con servicios externos

- backend seguro para claves y archivos;
- almacenamiento de documentos e imágenes;
- procesamiento asíncrono;
- adaptador de OCR/document understanding;
- adaptador de generación y edición de imágenes;
- métricas de precisión, costo y tiempo.

La interfaz no dependerá de un proveedor específico.

## 9. Orden de implementación

1. Tipos y persistencia de sesiones de importación.
2. Comparador Excel y clasificación de diferencias.
3. Bandeja de productos ausentes.
4. Aplicación selectiva de cambios y registro de actividad.
5. Modo rápido de precios.
6. Carga y diagnóstico de PDF.
7. Extracción nativa desde PDF de InDesign.
8. Estudio de revisión PDF.
9. Adaptadores de OCR pendientes de proveedor.
10. Estudio creativo y adaptador de IA.
11. Regeneración, vista previa y nueva versión PDF.

## Criterios de aceptación iniciales

- Importar Excel nunca reemplaza datos sin una pantalla de confirmación.
- Cada diferencia indica valor anterior y valor propuesto.
- Los productos ausentes quedan visibles y sin modificación automática.
- El usuario puede aplicar solamente cambios de precio.
- Un PDF de InDesign produce candidatos revisables con página de origen.
- Toda aplicación de cambios conserva las versiones históricas.
- Toda imagen generada o editada requiere aprobación antes de utilizarse.
