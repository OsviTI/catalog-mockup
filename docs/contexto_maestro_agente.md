# Contexto maestro del proyecto: sistema de automatización de catálogos PDF

## Propósito de este documento

Este documento sirve como fuente única de contexto para cualquier agente de IA que participe en la formulación, análisis, diseño funcional, UX/UI, mockup o arquitectura técnica del proyecto. Su objetivo es evitar pérdida de contexto, alucinaciones, cambios arbitrarios de alcance y desviaciones respecto al problema real del cliente. [file:31][file:42][file:43]

Debe usarse como referencia viva durante todo el proyecto. Cada vez que se avance una fase, este documento debe actualizarse con decisiones tomadas, supuestos validados, cambios aprobados y elementos descartados. [file:43]

## Estado actual del proyecto

El cliente crea catálogos comerciales en formato PDF a partir de tablas de Excel y maquetación manual en Adobe InDesign. El problema principal es que los precios cambian con frecuencia, lo que obliga a rehacer o corregir repetidamente los catálogos, generando retrasos, errores y dependencia de perfiles que conocen InDesign. [file:31][file:42]

La solución buscada es un sistema web que permita automatizar la creación, actualización, previsualización, versionado y descarga de catálogos PDF, partiendo de datos estructurados y una lógica editorial reutilizable. [file:42][file:43]

## Problema central

El flujo actual depende de un proceso manual y fragmentado: datos en Excel, maquetación en InDesign, correcciones manuales y exportación final a PDF. Cuando cambian precios, productos o imágenes, se deben hacer ajustes manuales documento por documento, lo que no escala y aumenta el riesgo de inconsistencias. [file:31][file:42]

## Objetivo principal del sistema

Automatizar el proceso completo de creación, actualización, previsualización, versionado y descarga de catálogos comerciales en PDF, reduciendo tiempos operativos y eliminando la necesidad de edición manual recurrente en InDesign. [file:43]

## Objetivos específicos

- Centralizar la gestión de datos de producto en una sola plataforma. [file:43]
- Permitir carga de datos desde Excel o fuente estructurada. [file:31][file:43]
- Convertir esos datos en catálogos PDF con estructura editorial consistente. [file:42][file:43]
- Permitir previsualización antes de exportar. [file:43]
- Registrar versiones históricas por cada generación. [file:43]
- Facilitar actualizaciones rápidas cuando cambian precios o productos. [file:31][file:43]

## Fuentes reales analizadas

### Tabla de productos

Se analizó una tabla con campos como:

- Nombre producto
- Medidas
- Material
- Embalaje
- Pack
- Master
- Código
- Precio
- Imagen [file:31]

Ejemplos de productos encontrados:

- Copas Gin Tonic 590 ML
- Copas Degustación 465 ML
- Copas Degustación 435 ML
- Copas Degustación Premium 615 ML
- Sacacorcho a pilas
- Sacacorcho por aire
- Sacacorcho doble aleta [file:31]

### Catálogo PDF actual

El catálogo actual tiene una estructura editorial repetible con:

- portada promocional,
- bloques de marca,
- categorías,
- productos destacados,
- fichas de producto,
- cierre comercial. [file:42]

También se observó una lógica visual sobria, comercial y editorial, con fuerte jerarquía en nombre de producto, datos técnicos y precio. [file:42]

### Sitio de referencia

Se identificó que el sitio asociado funciona como catálogo comercial con páginas de productos y categorías, lo que refuerza la necesidad de una solución basada en datos estructurados, categorías y generación consistente de contenido. [web:33][web:35][web:38]

## Hechos confirmados

1. El cliente usa actualmente Excel y Adobe InDesign para generar catálogos. [file:31][file:42]
2. Los precios cambian con frecuencia y las actualizaciones manuales consumen mucho tiempo. [file:31][file:42]
3. El catálogo actual tiene estructura editorial repetible. [file:42]
4. El resultado final deseado del sistema es generar y descargar catálogos PDF. [file:42][file:43]
5. El sistema debe contemplar previsualización y versionado. [file:43]

## Supuestos de trabajo vigentes

Estos supuestos pueden usarse temporalmente, pero deben marcarse siempre como no confirmados hasta validarlos con el cliente.

1. El sistema inicialmente se alimentará con Excel/CSV, no con integración API completa. [file:43]
2. El MVP tendrá una plantilla principal configurable, no un editor libre drag-and-drop. [file:43]
3. Las imágenes ya existen y podrán relacionarse con productos mediante nombre, código, ruta o URL. [file:31][file:43]
4. El usuario principal del MVP será un operador/editor no técnico. [file:43]
5. La primera versión priorizará PDF digital sobre salida de imprenta avanzada. [file:43]
6. La estructura del catálogo cambiará poco entre ediciones. [file:42][file:43]

## Alcance funcional aprobado hasta ahora

El MVP debe incluir como mínimo:

- Login o acceso controlado. [file:43]
- Dashboard con listado de catálogos. [file:43]
- Creación de nuevo catálogo. [file:43]
- Carga de archivo Excel/CSV. [file:43]
- Validación y revisión de datos. [file:43]
- Selección/configuración de plantilla. [file:43]
- Generación automática del catálogo. [file:43]
- Previsualización del PDF. [file:43]
- Versionado automático. [file:43]
- Descarga del PDF. [file:43]
- Historial de versiones. [file:43]
- Actualización de catálogos existentes. [file:43]

## Fuera del MVP por ahora

- Integración con ERP/CRM por API. [file:43]
- Editor visual drag-and-drop complejo. [file:43]
- Catálogos multilingües. [file:43]
- Publicación web del catálogo como producto principal. [file:43]
- Analítica avanzada. [file:43]
- Múltiples plantillas complejas por catálogo. [file:43]

## Flujo funcional base aprobado

El flujo funcional definido hasta ahora es:

1. Ingreso al sistema. [file:43]
2. Dashboard con listado de catálogos. [file:43]
3. Creación de un nuevo catálogo. [file:43]
4. Carga de archivo Excel o fuente estructurada. [file:43]
5. Validación y normalización de datos. [file:43]
6. Selección o configuración de plantilla. [file:43]
7. Generación automática del catálogo. [file:43]
8. Previsualización del PDF. [file:43]
9. Versionado automático. [file:43]
10. Descarga del PDF. [file:43]
11. Revisión de historial de versiones. [file:43]
12. Actualización de catálogo existente al cambiar precios. [file:43]

## Reglas para cualquier agente que continúe este proyecto

Estas reglas son obligatorias:

- No inventar información no confirmada.
- Separar siempre hechos confirmados de supuestos.
- No cambiar el objetivo del proyecto: el sistema está orientado a automatizar catálogos PDF, no a convertirse en e-commerce. [file:43]
- No desviar el foco hacia modelo SaaS o monetización si no se pide explícitamente. [file:43]
- Mantener el foco en MVP antes de proponer fases más complejas. [file:43]
- Toda recomendación funcional o técnica debe justificarse.
- Toda propuesta visual debe respetar la lógica editorial del catálogo actual. [file:42]
- Si un dato no está claro, convertirlo en pregunta para validar con el cliente.

## Instrucciones para continuidad de trabajo

Cada vez que se retome el proyecto, el agente debe:

1. Leer este documento completo.
2. Resumir en 5 a 10 puntos qué entendió del estado actual.
3. Confirmar qué hechos usa como base y qué supuestos mantiene abiertos.
4. Explicar en qué fase del proyecto está trabajando: formulación, arquitectura funcional, flujos, pantallas, UI o stack técnico.
5. Continuar solo sobre la base ya aprobada, sin redefinir desde cero lo que ya fue acordado.

## Plantilla de actualización del contexto

Usar esta sección para ir enriqueciendo el documento con cada avance.

### Decisiones aprobadas

- El objetivo final incluye generación, previsualización, versionado y descarga de PDF. [file:43]
- El MVP se enfocará en carga de datos, plantilla, generación y control de versiones. [file:43]

### Supuestos pendientes de validar

- Si habrá login real o acceso por intranet. [file:43]
- Si el cliente necesita salida de imprenta avanzada. [file:43]
- Si habrá aprobación interna antes de publicar o descargar. [file:43]
- Si existirán múltiples plantillas o solo una plantilla base. [file:43]
- Si las imágenes se subirán al sistema o se referenciarán desde rutas/URLs. [file:43]

### Cambios rechazados

- Convertir el sistema en un e-commerce completo.
- Agregar módulos no esenciales al MVP sin validación previa.
- Introducir campos como obligatorios sin confirmación del cliente cuando no existan en la data real. [file:31]

### Próxima fase sugerida

Diseño de arquitectura de pantallas y estructura del mockup, a partir del flujo funcional ya definido. [file:43]
