# CONTEXTO DEL PROYECTO — Sistema de Automatización de Catálogos PDF

**Última actualización:** 28 julio 2026
**Propósito:** Documento de contexto para mantener coherencia durante el desarrollo del mockup y futuras fases.

---

## 1. PROBLEMA DE NEGOCIO

El cliente crea catálogos comerciales en Adobe InDesign a partir de tablas Excel. Los precios cambian con frecuencia y cada modificación exige abrir InDesign, localizar productos y corregir manualmente. Es lento, propenso a errores y depende de personal especializado.

## 2. OBJETIVO DEL SISTEMA

Automatizar la creación, previsualización, versionado y descarga de catálogos PDF, eliminando la edición manual en InDesign.

## 3. SOLUCIÓN PROPUESTA

Separar datos del diseño: [Datos estructurados] + [Plantilla visual] → [PDF automático].

- Datos se cargan desde Excel/CSV, se validan y normalizan.
- Plantilla define estructura visual (portada, marcas, categorías, fichas, cierre).
- Motor de generación fusiona ambos y produce PDF.

## 4. ESTRUCTURA DEL CATÁLOGO (confirmada)

1. Portada
2. Bloques de marca
3. Categorías
4. Productos destacados
5. Fichas de producto
6. Cierre comercial

## 5. FLUJO DE USO

1. Dashboard → listado de catálogos
2. Crear catálogo (modal): nombre + fechas [supuesto]
3. Cargar Excel → validación → tabla editable
4. Configurar plantilla [supuesto]: portada, orden, cierre
5. Generar PDF → barra de progreso
6. Previsualizar en visor embebido
7. Descargar o regenerar
8. Historial de versiones [supuesto] accesible desde Dashboard o Preview

## 6. ARQUITECTURA DE PANTALLAS (3 pantallas + 4 modales)

### Pantallas MVP
- **Dashboard**: listado de catálogos, crear nuevo, acceso a versiones
- **Configuración**: 3 secciones internas (Datos, Plantilla, Generar)
- **Previsualización**: visor PDF con acciones

### Modales
- Crear catálogo
- Historial de versiones [supuesto]
- Confirmar eliminación
- Confirmar regeneración

## 7. ARQUITECTURA TÉCNICA

```
Frontend (React) ↔ Backend API (Node.js) ↔ Motor Generación (Puppeteer)
                                           ↔ PostgreSQL
                                           ↔ File Storage
```

### Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Estado: Zustand
- Navegación: React Router
- Backend futuro: Node.js + Express
- Base datos: PostgreSQL
- Motor PDF: Puppeteer (headless Chromium)
- Templates: Nunjucks
- Parser Excel: SheetJS

## 8. TECNOLOGÍAS DEL MOCKUP ACTUAL

- React 19 + Vite 8
- TypeScript
- Tailwind CSS v4 (con @tailwindcss/vite)
- React Router v7
- Zustand
- Datos mock locales (JSON/TS)

## 9. ALCANCE DEL MVP

### Incluye
- Creación de catálogo, carga Excel/CSV con validación, normalización
- Plantilla fija (predefinida, no configurable por UI)
- Generación PDF, descarga directa, versionado básico
- Dashboard con listado y acciones

### No incluye (fases futuras)
- Visor PDF embebido (Fase 2)
- Configuración visual de plantilla (Fase 2)
- Login y roles (si se confirma)
- Múltiples plantillas (Fase 3)
- Editor drag & drop (Fase 3+)
- Integración ERP/API (Fase 3+)

## 10. CONVENCIONES DEL DOCUMENTO

- **[Confirmado]** — Validado con el cliente, base firme del proyecto
- **[Supuesto]** — Se asume probable, pendiente de confirmación
- **[Por validar]** — Pregunta abierta para el cliente

## 11. SUPUESTOS POR VALIDAR

| # | Supuesto | Implicación si no se confirma |
|---|----------|-------------------------------|
| S1 | Imágenes existen como URLs accesibles | Subida de imágenes al sistema |
| S2 | Excel puede ajustarse a estructura definida | Paso de mapeo de columnas |
| S3 | PDF formato digital (pantalla) | Ajustes para imprenta (CMYK) |
| S4 | Sistema usado por 1-2 personas sin login | Login + roles de usuario |
| S5 | Sin reglas de precio complejas | Modelar lógica de negocio adicional |
| S6 | Una plantilla fija es suficiente | Múltiples plantillas seleccionables |

## 12. DECISIONES PENDIENTES CON EL CLIENTE

- D1: ¿Imágenes por URL o subidas al sistema?
- D2: ¿Cuántos usuarios? ¿Roles distintos?
- D3: ¿PDF digital o imprenta?
- D4: ¿Flujo de aprobación antes de distribución?
- D5: ¿Frecuencia de cambios de precio?
- D6: ¿On-premise o cloud?

## 13. ESTRUCTURA DEL PROYECTO (catalog-mockup/)

```
src/
├── app/                Router + Providers
├── components/
│   ├── layout/         Header, AppLayout
│   ├── ui/             Button, Badge, Card, Modal, Tabs, Toast, DataTable, DropZone, ProgressBar, EmptyState
│   ├── catalog/        CatalogCard
│   └── modals/         CreateCatalog, VersionHistory, ConfirmDelete, ConfirmRegenerate
├── pages/              DashboardPage, CatalogConfigPage, PreviewPage
├── data/               mockCatalogs, mockProducts, mockVersions
├── store/              catalogStore (Zustand)
├── types/              catalog.ts (TypeScript types)
├── features/
│   ├── dashboard/      DashboardGrid
│   ├── configuration/  DataSection, TemplateSection, GenerateSection
│   ├── preview/        PdfViewer, PreviewToolbar
│   └── versioning/     VersionList
├── styles/             globals.css (Tailwind base)
├── App.tsx
└── main.tsx
```

## 14. DISEÑO VISUAL

Paleta:
- Primario: #1E6FE8 (azul)
- Hover: #1557C4
- Fondo: #F6F7F9
- Tarjetas: #FFFFFF
- Bordes: #DEE1E6
- Texto principal: #1A1D23
- Texto secundario: #6B7280
- Éxito: #10B981 (verde)
- Advertencia: #F59E0B (ámbar)
- Error: #EF4444 (rojo)

Tipografía: system-ui, Segoe UI
Botones: border-radius 8px
Tarjetas: border-radius 12px

## 15. ESTADO ACTUAL DEL PROYECTO

- [x] Análisis de problema de negocio
- [x] Definición de objetivos y alcance
- [x] Arquitectura de pantallas
- [x] Wireframes funcionales
- [x] Arquitectura técnica
- [x] Tecnologías definidas
- [x] Mockup HTML simple (prototipo rápido)
- [x] Proyecto Vite + React + TS scaffolded
- [ ] Implementación de componentes UI (Button, Badge, Card, etc.)
- [ ] Implementación de layout (Header, AppLayout)
- [ ] Implementación de modales
- [ ] Implementación de páginas (Dashboard, Config, Preview)
- [ ] Store y datos mock
- [ ] Integración completa del flujo navegable
- [ ] Prueba de navegación completa

## 16. NOTAS PARA EL DESARROLLADOR (IA)

- Mantener separación clara entre [Confirmado] y [Supuesto]
- No presentar supuestos como hechos en el mockup
- El foco del MVP es automatización funcional, no experiencia visual completa
- Las fases futuras no deben implementarse en el mockup actual
- Tipo de cambio actual del proyecto: construcción del mockup React + Vite + TypeScript + Tailwind
- Próximo paso: implementar componentes UI, layout y store
