# Contexto maestro: automatización de catálogos PDF

## Función de este documento

Esta es la fuente oficial y viva del proyecto. Debe leerse antes de proponer alcance, UX, arquitectura o implementación. Las decisiones confirmadas prevalecen sobre documentos anteriores. Los documentos `CONTEXT.md`, `contexto_maestro_ide.md` y `prompt_mockup_catalogos (1).md` se conservan como antecedentes, no como autoridad.

Última actualización: 28 de julio de 2026.

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

## Estado funcional implementado

El mockup incluye:

- dashboard con estadísticas, búsqueda, filtros y actividad;
- alta, duplicación y eliminación protegida de catálogos;
- gestión de productos y categorías;
- edición de todos los campos comerciales y técnicos relevantes;
- carga local de imágenes de producto y ambientales;
- importación de XLSX, XLS y CSV;
- normalización flexible de encabezados;
- validación de campos obligatorios, códigos duplicados e imágenes faltantes;
- descarga de plantilla Excel y exportación de datos actuales;
- tres plantillas: Editorial Rojo, Minimal Arena y Nocturna Premium;
- variantes de portada, densidades de 2, 4 o 6 productos por página, contenido visible y paleta;
- vista previa compartida con el motor de exportación;
- generación PDF digital A4;
- snapshot automático al descargar el PDF;
- historial, publicación y restauración de versiones;
- guardado automático local;
- copia portable de datos e imágenes;
- interfaz adaptable a escritorio, tablet y móvil.

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

## Reglas de continuidad

- No convertir el proyecto en e-commerce.
- Separar hechos confirmados de supuestos.
- No introducir campos obligatorios que la fuente real no justifique.
- Mantener la generación de catálogos como núcleo.
- Reutilizar el mismo componente editorial para vista previa, versión histórica y PDF.
- Proteger acciones destructivas y conservar las versiones.
- Actualizar este documento cuando una decisión pendiente sea confirmada.

## Próxima fase recomendada

Validar el mockup con el cliente usando una planilla real completa y una carpeta real de imágenes. Con esa sesión deben cerrarse el contrato de datos, las reglas de precio, la asociación masiva de imágenes y el flujo de aprobación. Después podrá diseñarse la arquitectura de producción con backend y API.
