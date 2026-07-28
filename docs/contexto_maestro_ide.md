# Contexto maestro del proyecto: sistema de automatización de catálogos PDF

## Propósito
Este documento es la fuente única de verdad para el agente del IDE. Evita pérdida de contexto, alucinaciones, cambios arbitrarios de alcance y reinicios innecesarios del proyecto.

## Resumen del proyecto
El cliente crea catálogos comerciales en PDF a partir de Excel y Adobe InDesign. El problema principal es que los precios cambian con frecuencia y las correcciones manuales consumen tiempo, generan errores y dependen de perfiles especializados.

## Objetivo principal
Automatizar la creación, actualización, previsualización, versionado y descarga de catálogos PDF, eliminando la edición manual recurrente en InDesign.

## Hechos confirmados
- Los catálogos se crean hoy desde Excel + datos de producto en InDesign.
- Los precios cambian con frecuencia.
- El catálogo tiene estructura editorial repetible.
- El sistema debe permitir crear, previsualizar, versionar y descargar PDFs.

## Supuestos de trabajo
- El MVP se alimentará con Excel/CSV.
- Habrá una plantilla principal configurable.
- Las imágenes ya existen o se podrán referenciar por ruta/URL.
- El usuario principal será un operador/editor no técnico.
- El PDF es la salida principal, no una vista web.
- No se asume integración con ERP/CRM en la primera versión.

## Alcance del MVP
1. Login o acceso controlado.
2. Dashboard con listado de catálogos.
3. Creación de nuevo catálogo.
4. Carga de datos Excel/CSV.
5. Validación y revisión de datos.
6. Selección/configuración de plantilla.
7. Generación automática del catálogo.
8. Previsualización del PDF.
9. Versionado automático.
10. Descarga del PDF.
11. Historial de versiones.
12. Actualización de catálogos existentes.

## Flujo aprobado
Dashboard -> crear catálogo -> cargar datos -> validar/revisar -> configurar plantilla -> generar PDF -> previsualizar -> descargar -> versionar -> historial -> actualizar catálogo.

## Reglas para el agente
- No inventar información no confirmada.
- Separar siempre hechos confirmados de supuestos.
- No cambiar el objetivo del proyecto.
- No ampliar el alcance sin marcarlo como fase futura.
- No convertir el sistema en un e-commerce.
- Si falta un dato, convertirlo en pregunta de validación.
- Antes de responder una nueva fase, resumir el contexto vigente en 5 a 10 puntos.

## Estado actual
Se ha aprobado la formulación funcional base y el flujo detallado. La siguiente fase debe ser la arquitectura de pantallas del mockup.
