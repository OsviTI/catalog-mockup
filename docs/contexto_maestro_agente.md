# Contexto maestro: automatización de catálogos PDF

## Función de este documento

Esta es la fuente oficial y viva del proyecto. Debe leerse antes de proponer alcance, UX, arquitectura o implementación. Las decisiones confirmadas prevalecen sobre documentos anteriores. Los documentos `CONTEXT.md`, `contexto_maestro_ide.md` y `prompt_mockup_catalogos (1).md` se conservan como antecedentes, no como autoridad.

Última actualización: 29 de julio de 2026.

## Problema y objetivo

Crystal Rock mantiene datos de producto en planillas y maqueta catálogos manualmente en Adobe InDesign. Los cambios frecuentes de precios, productos e imágenes obligan a repetir tareas editoriales, aumentan los errores y hacen depender el proceso de una herramienta especializada.

El objetivo es reemplazar ese proceso recurrente por un sistema web que permita:

1. centralizar y editar productos;
2. importar datos estructurados;
3. validar inconsistencias antes de diseñar;
4. aplicar plantillas editoriales reutilizables;
5. previsualizar el documento;
6. generar PDF digital A4;
7. conservar versiones históricas;
8. actualizar un catálogo sin volver a maquetarlo.

El producto no es un e-commerce. El sitio de Crystal Rock sirve como referencia del modelo de datos, categorías y productos, no como alcance funcional que deba replicarse.

## Material de referencia confirmado

- `V2_CR_MVP.pdf`: pese al nombre, contiene el catálogo editorial de ocho páginas.
- `Final_Secundario.pdf`: pese al nombre, contiene la tabla semejante a Excel.
- Sitio de productos: `https://crystalrock.com.ar/products?groupId=4`.

El material evidencia campos como nombre, código, precio, medidas, capacidad, material, embalaje, pack, master, modelo, color e imagen. También muestra categorías, productos destacados e imágenes ambientales asociadas a una sección.

## Decisiones aprobadas

- El entregable actual debe sentirse como un sistema completo, dinámico y presentable, aunque utilice datos demostrativos.
- La intención futura es eliminar por completo la dependencia recurrente de InDesign.
- La salida prioritaria es PDF digital A4.
- Deben existir varias plantillas editoriales.
- La configuración visual puede modificarse, pero mediante controles acotados que conserven coherencia y legibilidad; no se requiere un editor libre de escritorio.
- Productos, códigos, precios, datos técnicos, imágenes y categorías pueden agregarse, editarse o eliminarse.
- Cada categoría puede tener una imagen ambiental propia.
- La entrada inicial será una plantilla Excel estable; una API queda prevista como evolución.
- Los roles y permisos quedan fuera de esta etapa porque el cliente todavía no los definió.
- Los cambios deben sobrevivir a recargas y poder conservarse para futuras presentaciones.
- Las versiones anteriores no se sobrescriben. Restaurar una versión crea el nuevo estado de borrador y conserva el historial.
- El formato de importación recomendado tiene tres hojas: `Productos`, `Categorías` y `Catálogo`.
- Los catálogos PDF de entrada provienen normalmente de Adobe InDesign, por lo que se priorizará la extracción de texto y estructura nativa antes de recurrir a OCR.
- El código de producto se considera inicialmente un identificador estable y será la clave primaria para comparar fuentes.
- Excel es la fuente oficial cuando exista una diferencia entre la planilla y el catálogo digitalizado.
- Un producto que exista en el catálogo pero no aparezca en el nuevo Excel nunca se eliminará automáticamente. Se mostrará en una lista de pendientes para que el usuario decida conservarlo, retirarlo del catálogo o eliminarlo.
- La selección de un proveedor externo de OCR o procesamiento documental se pospone. El mockup debe mantener una arquitectura preparada para conectarlo más adelante.
- El módulo creativo con IA deberá contemplar tanto generación de portadas y ambientaciones como edición o mejora de fotografías reales de producto.

## Estado funcional implementado

El mockup incluye:

- dashboard con estadísticas, búsqueda, filtros y actividad;
- alta obligatoria desde un PDF base, duplicación y eliminación protegida de catálogos;
- gestión de productos y categorías;
- edición de todos los campos comerciales y técnicos relevantes;
- carga local de imágenes de producto y ambientales;
- importación de XLSX, XLS y CSV;
- normalización flexible de encabezados;
- importación Excel no destructiva mediante sesiones persistentes;
- comparación por código en estados sin cambios, actualizado, nuevo, ausente y conflicto;
- aprobación individual por producto y por campo;
- resolución editable de conflictos con acciones para conservar, reemplazar, ignorar o agregar;
- bandeja obligatoria de decisión para productos ausentes;
- diagnóstico de PDF digital, mixto o escaneado mediante PDF.js;
- extracción nativa de candidatos con página, evidencia y confianza;
- confianza calculada por completitud, reglas específicas de la plantilla oficial y campos faltantes visibles;
- revisión lado a lado con la página original renderizada;
- decodificación de imágenes JPEG 2000 frecuentes en exportaciones de InDesign;
- propuesta de región visual por candidato y miniatura junto a sus datos;
- editor de recorte con escala y desplazamiento;
- guardado persistente del recorte aprobado como imagen real del producto;
- edición rápida de precios y operaciones porcentuales;
- estudio creativo con mejora local no destructiva de fotografías;
- conceptos visuales persistentes preparados para sustituirse por un adaptador de IA;
- validación de campos obligatorios, códigos duplicados e imágenes faltantes;
- descarga de plantilla Excel y exportación de datos actuales;
- plantilla oficial reutilizable de Crystal Rock reconstruida desde `V2_CR_MVP.pdf`;
- tres propuestas alternativas: Editorial Rojo, Minimal Arena y Nocturna Premium;
- detección de la plantilla oficial al analizar documentos con la identidad del catálogo de referencia;
- paginación automática que conserva portada, destacados, grillas y cierre al cambiar la cantidad de productos;
- variantes de portada, densidades de 2, 4 o 6 productos por página, contenido visible y paleta;
- vista previa compartida con el motor de exportación;
- generación PDF digital A4;
- snapshot automático al descargar el PDF;
- historial, publicación y restauración de versiones;
- guardado automático local;
- copia portable de datos e imágenes;
- interfaz adaptable a escritorio, tablet y móvil.

## Evolución funcional pendiente

- OCR de páginas escaneadas mediante un proveedor externo.
- Detección visual más precisa para nuevas plantillas y páginas con composiciones no conocidas.
- Reglas de extracción específicas por cada nueva plantilla de InDesign.
- Reconstrucción de otras plantillas visuales que el cliente entregue en el futuro.
- Generación y edición de imágenes mediante IA externa.
- Procesamiento asíncrono en backend para archivos grandes y uso multiusuario.

El detalle funcional y el orden de implementación se documentan en `PLAN_IMPORTACION_PDF_Y_RECONCILIACION.md`.

## Modelo editorial implementado

El documento se compone automáticamente:

1. portada;
2. por cada categoría con productos:
   - página de producto destacado;
   - páginas de grilla según la densidad elegida;
3. cierre comercial.

El producto marcado como destacado se utiliza en la apertura de su categoría. Si ninguno está marcado, se usa el primero según el orden editorial.

## Persistencia y versionado

Esta etapa no utiliza backend. El espacio completo se guarda en IndexedDB:

- el estado contiene catálogos, categorías, productos, plantillas, versiones y actividad;
- las imágenes se almacenan como objetos binarios `Blob`;
- el guardado se ejecuta automáticamente después de cada modificación;
- se solicita almacenamiento persistente al navegador cuando está disponible;
- una copia portable JSON permite trasladar todo el espacio, incluidas las imágenes.

La descarga PDF crea una versión inmutable. Una versión publicada es una marca de aprobación dentro del mockup. Restaurar una versión nunca elimina las posteriores.

Esta estrategia es adecuada para una demostración durable, pero una solución multiusuario real requerirá backend, almacenamiento de objetos, autenticación, permisos, auditoría y copias de seguridad administradas.

## Arquitectura y librerías aprobadas

- React + TypeScript para interfaz y modelo tipado.
- Vite para desarrollo y build.
- Tailwind CSS para el sistema visual.
- Zustand para estado y acciones de dominio.
- IndexedDB mediante `idb` para persistencia y archivos.
- Zod para validación.
- `read-excel-file` y `write-excel-file` para entrada y salida de planillas.
- jsPDF y html2canvas para generar el PDF en el navegador.
- PDF.js para diagnosticar, extraer texto y renderizar páginas de documentos de origen.
- Router hash local y tipado para portabilidad en hosting estático sin sumar una dependencia innecesaria.
- Lucide React para iconos accesibles y consistentes.

Excel y PDF se cargan de forma diferida para mantener liviana la carga inicial.

## Fuera de alcance actual

- autenticación, usuarios, roles y permisos;
- backend o base de datos compartida;
- integración real con ERP, CRM, e-commerce o API;
- colaboración simultánea;
- publicación web como e-commerce;
- editor libre drag-and-drop;
- preprensa profesional CMYK, sangrados o marcas de corte;
- multilenguaje y analítica avanzada.

## Pendientes de validación con el cliente

- Reglas exactas de cada campo y cuáles son obligatorios.
- Significado definitivo de productos o filas que parecen alternativas.
- Reglas de precios, impuestos, moneda, descuentos y vigencias.
- Convención final para asociar imágenes masivamente por código o nombre.
- Flujo real de revisión/aprobación y futuros roles.
- Si la salida final necesita requisitos de imprenta además del PDF digital.
- Contrato y periodicidad de una futura integración API.
- Si los catálogos e imágenes podrán enviarse posteriormente a servicios externos de procesamiento.
- Qué operaciones de edición con IA deben priorizarse para fotografías reales: eliminación de fondo, ambientación, retoque, extensión o reemplazo de elementos.

## Reglas de continuidad

- No convertir el proyecto en e-commerce.
- Separar hechos confirmados de supuestos.
- No introducir campos obligatorios que la fuente real no justifique.
- Mantener la generación de catálogos como núcleo.
- Reutilizar el mismo componente editorial para vista previa, versión histórica y PDF.
- Proteger acciones destructivas y conservar las versiones.
- Actualizar este documento cuando una decisión pendiente sea confirmada.

## Próxima fase recomendada

Validar las reglas de extracción con más catálogos reales de InDesign y medir la precisión por plantilla. Luego seleccionar los adaptadores de OCR e IA según privacidad, costo y volumen, manteniendo la revisión humana ya implementada.
