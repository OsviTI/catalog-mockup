# Prompt maestro para mockup de sistema de automatización de catálogos

## Contexto del proyecto

El proyecto consiste en diseñar un sistema web que permita automatizar la creación de catálogos comerciales que actualmente se producen de forma manual en Adobe InDesign a partir de tablas de Excel y contenido del sitio web de la empresa. El cliente trabaja con catálogos de productos de cristalería y accesorios, donde los precios cambian con frecuencia y eso obliga a rehacer piezas editoriales de manera repetitiva. En el material analizado se observa una base tabular con campos como nombre del producto, medidas, material, embalaje, pack, master, código, precio e imagen, y un catálogo PDF que convierte esa información en páginas comerciales con estructura editorial consistente. [file:31][file:42]

También se identificó que el sitio de Crystal Rock funciona como catálogo comercial con navegación por categorías, filtros, ordenamiento, stock, precios y flujo de compra, lo que sugiere que el sistema futuro debería poder alimentarse desde archivos Excel y, si es viable, desde una fuente conectada al sitio o una API equivalente para mantener datos actualizados. [web:33][web:35][web:38]

## Lluvia de ideas estratégica

### Problema central

El cliente pierde tiempo porque los catálogos dependen de procesos manuales de maquetación y actualización. Cuando cambian precios, productos, imágenes o categorías, el equipo debe rehacer o corregir múltiples piezas en InDesign, lo que aumenta tiempos, errores y dependencia operativa. [file:31][file:42]

### Oportunidades clave

- Crear una plataforma web interna para importar Excel y transformar filas en fichas listas para catálogo.
- Definir plantillas visuales reutilizables para distintas familias de productos.
- Permitir actualización masiva de precios sin rehacer el diseño desde cero.
- Generar previsualizaciones tipo catálogo antes de exportar.
- Exportar a PDF comercial y, en una etapa futura, generar paquetes compatibles con flujos editoriales.
- Unificar en un solo sistema la carga de productos, validación, diseño, vista previa y exportación.

### Enfoque recomendado

La mejor propuesta para el mockup no es vender solo una “pantalla bonita”, sino presentar una solución modular con enfoque en automatización editorial, actualización dinámica de datos y reducción de tiempo operativo. La narrativa al cliente debe mostrar que el sistema no reemplaza solo a Excel ni solo a InDesign, sino que crea un puente inteligente entre base de datos de producto, reglas de diseño y salida lista para catálogo. [file:31][file:42]

### Fuentes de datos posibles

| Fuente | Ventaja | Riesgo o limitación |
|---|---|---|
| Excel cargado manualmente | Implementación rápida, familiar para el cliente | Riesgo de errores en columnas y formatos |
| CSV estandarizado | Más simple para procesos automáticos | Menos amigable para usuarios no técnicos |
| API del sitio o integración con backend | Datos y precios más actualizados | Depende del acceso técnico real del sitio |
| Scraping controlado del catálogo web | Puede servir como alternativa inicial | Frágil si cambia la web o hay restricciones |
| Base de datos interna del sistema | Mayor control y trazabilidad | Requiere etapa adicional de implementación |

### Módulos clave del sistema

- Panel de carga de archivos.
- Validador de estructura de datos.
- Gestor de productos y categorías.
- Editor de plantillas de catálogo.
- Motor de composición automática.
- Vista previa paginada tipo catálogo.
- Gestor de precios y cambios.
- Exportación a PDF.
- Historial de versiones.
- Panel administrativo.

### Propuesta de MVP

Para presentar un mockup convincente, el MVP debería enfocarse en un flujo corto pero poderoso:

1. Subir archivo Excel.
2. Detectar columnas y mapear campos.
3. Validar productos, imágenes y precios.
4. Elegir plantilla de catálogo.
5. Generar catálogo automático por categoría.
6. Revisar vista previa.
7. Exportar a PDF.

Ese recorrido ya comunica valor inmediato y resuelve el dolor principal del cliente: actualizar catálogos rápidamente cuando cambian precios y productos. [file:31][file:42]

### Tecnologías sugeridas para el sistema

Para el planteamiento del mockup y una futura implementación, la arquitectura más razonable sería una web app moderna. El frontend puede diseñarse con Figma para el mockup y luego implementarse con React o Next.js para interfaces dinámicas; el backend puede contemplar Node.js o NestJS para lógica de negocio, importación de archivos y generación de documentos; la base de datos puede resolverse con PostgreSQL para productos, versiones y plantillas; y la generación de PDFs puede evaluarse con motores HTML-to-PDF, servicios de composición documental o integraciones futuras con flujos de Adobe si el proyecto escala. [web:17]

### Criterios UX/UI que debe transmitir el mockup

- Sensación de herramienta profesional y operativa.
- Flujo simple para usuarios no técnicos.
- Claridad en estados de validación y errores de carga.
- Previsualización fiel del catálogo final.
- Capacidad de edición rápida sin romper la plantilla.
- Trazabilidad de qué cambió y cuándo.
- Diseño limpio, editorial y orientado a productos.

## Prompt maestro

Copia y usa este prompt como base para pedir a una IA que formule el sistema, la arquitectura funcional, el mockup y la propuesta al cliente.

---

Actúa como un equipo senior multidisciplinario compuesto por: Product Designer UX/UI, Diseñador Editorial experto en catálogos comerciales, Arquitecto de Software, Analista Funcional, Especialista en Automatización Documental y Consultor de Transformación Digital.

Tu misión es ayudar a diseñar de forma integral un sistema web para automatizar la creación de catálogos comerciales de una empresa de productos de cristalería y accesorios. Actualmente, el cliente crea sus catálogos en Adobe InDesign a partir de tablas de Excel y datos del sitio web. El problema principal es que los precios cambian con mucha frecuencia y eso obliga a rehacer o corregir constantemente los catálogos, generando pérdida de tiempo, errores operativos y dependencia del trabajo manual. [file:31][file:42]

Debes desarrollar una propuesta completa, clara, profesional y orientada a presentación con cliente. La respuesta debe servir para construir un mockup de alto nivel y también para definir las bases funcionales y tecnológicas del sistema. No dejes vacíos. No respondas de forma superficial. Piensa como si el objetivo fuera obtener aprobación del cliente para avanzar al diseño y desarrollo.

### Información base del negocio y del problema

Ten en cuenta el siguiente contexto:

- El cliente maneja catálogos por categorías de producto.
- Los productos incluyen información como: nombre, medidas, material, embalaje, pack, master, código, precio e imagen. [file:31]
- Existe un catálogo PDF actual con estructura comercial/editorial que incluye portada, páginas institucionales, productos destacados, páginas por categoría y cierre con instrucciones de compra. [file:42]
- La marca trabaja con una lógica visual sobria, comercial y editorial, con jerarquía clara de producto, datos técnicos y precio. [file:42]
- El sitio web actual funciona como catálogo de productos con categorías, filtros, ordenamiento, precios y flujo comercial. [web:33][web:35][web:38]
- El proceso actual depende de Excel + Adobe InDesign + actualización manual.
- La necesidad principal es automatizar el flujo de actualización de precios y productos para reducir tiempos y hacer más eficiente la generación de catálogos.

### Lo que debes entregar

Desarrolla una propuesta extensa y bien organizada con los siguientes bloques:

1. **Resumen ejecutivo del problema y la oportunidad**
   - Explica el problema actual del cliente.
   - Explica por qué el proceso actual no escala.
   - Explica la oportunidad de negocio y operativa al crear este sistema.

2. **Objetivo general del sistema**
   - Define con precisión qué debe lograr la plataforma.
   - Enfatiza automatización, velocidad, control y consistencia visual.

3. **Propuesta de valor**
   - Expón cómo el sistema ahorra tiempo.
   - Expón cómo disminuye errores.
   - Expón cómo facilita actualizaciones de precio y contenido.
   - Expón cómo estandariza la producción de catálogos.

4. **Tipos de usuarios del sistema**
   - Administrador.
   - Diseñador/editor de catálogo.
   - Operador comercial o encargado de productos.
   - Gerencia o cliente interno.
   - Para cada uno, detalla objetivos, tareas, permisos y necesidades.

5. **Fuentes de datos posibles**
   - Analiza el uso de Excel, CSV, API, scraping controlado o sincronización con base de datos.
   - Compara ventajas, desventajas, riesgos y recomendación.
   - Propón cuál debería ser el enfoque para un MVP y cuál para una versión futura escalable.

6. **Arquitectura funcional del sistema**
   Define todos los módulos del sistema, como mínimo:
   - Dashboard principal.
   - Importación de Excel/CSV.
   - Mapeo de columnas.
   - Validación de datos.
   - Gestión de productos.
   - Gestión de categorías.
   - Gestión de precios.
   - Gestión de imágenes.
   - Editor o selector de plantillas.
   - Motor de composición automática del catálogo.
   - Vista previa del catálogo.
   - Exportación a PDF.
   - Historial de versiones.
   - Gestión de usuarios.
   - Configuración general.

   Para cada módulo debes explicar:
   - propósito,
   - funciones,
   - entradas,
   - salidas,
   - reglas de negocio,
   - relación con otros módulos.

7. **Flujos principales del usuario**
   Describe paso a paso flujos como:
   - cargar archivo y actualizar catálogo,
   - corregir errores de importación,
   - generar un nuevo catálogo por categoría,
   - actualizar solo precios,
   - reemplazar imágenes,
   - duplicar una plantilla,
   - exportar catálogo final.

8. **Requerimientos funcionales**
   Redacta una lista amplia y clara de requerimientos funcionales priorizados.

9. **Requerimientos no funcionales**
   Incluye:
   - usabilidad,
   - rendimiento,
   - escalabilidad,
   - seguridad,
   - mantenibilidad,
   - trazabilidad,
   - calidad de exportación,
   - compatibilidad de archivos.

10. **Lógica de automatización editorial**
    Explica cómo una fila de Excel se convierte en una ficha de catálogo.
    Define reglas de composición como:
   - jerarquía de textos,
   - ubicación de imagen,
   - precio destacado,
   - bloques técnicos,
   - categorías,
   - productos destacados,
   - paginación,
   - consistencia entre plantillas.

11. **Propuesta de diseño UX/UI del mockup**
    Describe el estilo visual recomendado para la plataforma.
    Debe transmitir profesionalismo, claridad operativa y enfoque editorial.
    Define:
   - tono visual,
   - tipo de layout,
   - componentes clave,
   - navegación,
   - vistas principales,
   - buenas prácticas de interfaz.

12. **Pantallas que debe incluir el mockup**
    Propón un listado de pantallas mínimas y opcionales. Ejemplo:
   - Login.
   - Dashboard.
   - Importación de archivo.
   - Mapeo de columnas.
   - Validación de errores.
   - Biblioteca de productos.
   - Editor/selector de plantilla.
   - Vista previa del catálogo.
   - Historial de exportaciones.
   - Configuración.

   Para cada pantalla, indica objetivo, contenido, componentes y acciones principales.

13. **Tecnologías recomendadas**
    Propón stack ideal para:
   - frontend,
   - backend,
   - base de datos,
   - almacenamiento de imágenes,
   - exportación PDF,
   - integración futura con APIs o automatización documental.

   Explica por qué recomendarías cada tecnología para este caso.

14. **Propuesta de MVP, fases y roadmap**
    Divide el proyecto en fases:
   - MVP,
   - fase intermedia,
   - fase avanzada.

   Explica qué entra en cada una y por qué.

15. **Riesgos y consideraciones**
    Analiza riesgos como:
   - inconsistencias en archivos Excel,
   - imágenes faltantes,
   - ausencia de API,
   - cambios frecuentes en estructura del catálogo,
   - resistencia al cambio por parte del cliente,
   - dependencia del diseño actual de InDesign.

   Añade mitigaciones.

16. **Argumento para presentación al cliente**
    Redacta un discurso claro y persuasivo para explicar al cliente:
   - qué problema resuelve el sistema,
   - cómo mejora su operación,
   - qué etapas tendrá,
   - por qué conviene avanzar con el mockup y luego con el MVP.

### Forma de respuesta esperada

- Redacta en español claro, profesional y persuasivo.
- Usa estructura por secciones y subsecciones.
- No des respuestas genéricas.
- Piensa en eficiencia, automatización, experiencia de usuario, diseño editorial y viabilidad técnica al mismo tiempo.
- Cuando propongas funciones o tecnologías, justifícalas.
- Si detectas vacíos, conviértelos en supuestos explícitos o preguntas clave para validar con el cliente.
- La respuesta debe ser útil tanto para diseñar el mockup como para defender la idea frente al cliente.

### Enfoque prioritario

La prioridad del sistema no es solo “mostrar productos”, sino automatizar la generación de catálogos comerciales basados en datos, reducir el retrabajo por cambios de precio, y crear una herramienta operativa que conecte contenido estructurado + diseño + exportación final.

---

## Recomendación de uso del prompt

La mejor forma de trabajar ahora es usar este prompt en dos rondas:

1. **Ronda estratégica**: pedir análisis funcional, módulos, flujos, riesgos y propuesta de valor.
2. **Ronda de diseño**: pedir arquitectura de pantallas, wireframes, estructura del mockup, componentes UI y estilo visual.

Eso permitirá refinar primero la lógica del sistema y después construir un mockup más sólido y defendible ante el cliente.

## Preguntas que conviene validar con el cliente

Antes de cerrar la propuesta, conviene confirmar estos puntos:

- ¿El sitio actual tiene API o acceso a base de datos?
- ¿Los Excel siempre mantienen la misma estructura?
- ¿Las imágenes vienen nombradas por código o por producto?
- ¿Cuántas plantillas de catálogo manejan realmente?
- ¿Necesitan solo PDF o también archivos editables?
- ¿Quién operará el sistema en el día a día?
- ¿Cuántas veces por semana cambian precios?
- ¿Hay aprobación interna antes de exportar un catálogo?
- ¿El sistema debe reemplazar por completo a InDesign o convivir con él en una primera etapa?

## Cierre

Este prompt ya está preparado para ayudarte a formular una propuesta robusta, orientada a negocio, diseño y tecnología, usando como base el catálogo actual, la estructura tabular de productos y la necesidad real de automatización editorial del cliente. [file:31][file:42][web:38]
