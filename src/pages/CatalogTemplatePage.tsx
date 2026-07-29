import {
  Check,
  ChevronDown,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Settings2,
  SlidersHorizontal,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from '../lib/router'
import CatalogDocument from '../components/catalog/CatalogDocument'
import ProductImage from '../components/catalog/ProductImage'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { InputField, SelectField, TextareaField } from '../components/ui/FormField'
import { persistAsset } from '../lib/database'
import { useCatalogStore } from '../store/catalogStore'
import type { CatalogSettings, Category, CoverVariant } from '../types/catalog'

const coverLabels: Record<CoverVariant, string> = {
  campaign: 'Campaña',
  'image-split': 'Imagen dividida',
  signature: 'Institucional',
}

function CategoryCreativeCard({ category }: { category: Category }) {
  const updateCategory = useCatalogStore((state) => state.updateCategory)
  const [uploading, setUploading] = useState(false)

  const upload = async (file?: File) => {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return
    setUploading(true)
    const asset = await persistAsset(file)
    updateCategory(category.id, {
      heroImage: { assetId: asset.id, name: asset.name, focalPoint: 'center' },
    })
    setUploading(false)
  }

  return (
    <article className="rounded-2xl border border-border bg-white p-3">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <ProductImage
            image={category.heroImage}
            alt={category.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={category.name}
            onChange={(event) => updateCategory(category.id, { name: event.target.value })}
            className="w-full rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-bold outline-none focus:bg-slate-50"
            aria-label="Nombre de categoría"
          />
          <textarea
            value={category.description}
            onChange={(event) => updateCategory(category.id, { description: event.target.value })}
            className="mt-1 min-h-10 w-full resize-none rounded-lg border-0 bg-transparent px-1 text-xs leading-5 text-text-secondary outline-none focus:bg-slate-50"
            aria-label={`Descripción de ${category.name}`}
          />
        </div>
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-secondary hover:bg-slate-50">
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Guardando…' : 'Cambiar imagen ambiental'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </label>
    </article>
  )
}

export default function CatalogTemplatePage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const selectTemplate = useCatalogStore((state) => state.selectTemplate)
  const updateCatalog = useCatalogStore((state) => state.updateCatalog)
  const updateCatalogSettings = useCatalogStore((state) => state.updateCatalogSettings)
  const [panel, setPanel] = useState<'templates' | 'content' | 'style' | 'categories'>('templates')

  const catalog = workspace.catalogs.find((item) => item.id === catalogId)
  const template = workspace.templates.find((item) => item.id === catalog?.templateId)
  const categories = workspace.categories
    .filter((item) => item.catalogId === catalogId)
    .sort((a, b) => a.order - b.order)
  const products = workspace.products.filter((item) => item.catalogId === catalogId)

  if (!catalog || !template) return null

  const setting = <Key extends keyof CatalogSettings>(key: Key, value: CatalogSettings[Key]) =>
    updateCatalogSettings(catalog.id, { [key]: value } as Partial<CatalogSettings>)

  return (
    <div className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
      <section className="surface-card self-start overflow-hidden xl:sticky xl:top-21">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-text">Editor de diseño</h2>
              <p className="text-xs text-text-tertiary">Cambios visibles en tiempo real</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
            {[
              { id: 'templates', label: 'Plantilla', icon: LayoutTemplate },
              { id: 'content', label: 'Contenido', icon: Settings2 },
              { id: 'style', label: 'Estilo', icon: Palette },
              { id: 'categories', label: 'Secciones', icon: ImagePlus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanel(id as typeof panel)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition ${
                  panel === id ? 'bg-white text-primary shadow-sm' : 'text-text-tertiary hover:text-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-5">
          {panel === 'templates' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text">Biblioteca de plantillas</h3>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Cambia el lenguaje visual sin alterar los datos.
                </p>
              </div>
              {workspace.templates.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectTemplate(catalog.id, item.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    item.id === template.id
                      ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/8'
                      : 'border-border hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="relative h-28 overflow-hidden rounded-xl p-3"
                    style={{ backgroundColor: item.preview.surface, color: item.preview.ink }}
                  >
                    <div
                      className="absolute -right-7 -top-6 h-24 w-24 rounded-full opacity-20"
                      style={{ backgroundColor: item.accent }}
                    />
                    <div className="relative flex h-full flex-col justify-between">
                      <span
                        className="h-2 w-14 rounded-full"
                        style={{ backgroundColor: item.accent }}
                      />
                      <div>
                        <div className="h-2 w-24 rounded-full bg-current opacity-80" />
                        <div className="mt-2 h-1.5 w-32 rounded-full bg-current opacity-25" />
                      </div>
                    </div>
                    {item.id === template.id ? (
                      <span className="absolute right-2 top-2 rounded-full bg-white p-1 text-primary shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold text-text">
                        {item.name}
                        {item.origin === 'client' ? (
                          <Badge tone="success">Oficial del cliente</Badge>
                        ) : null}
                      </span>
                      {item.id === template.id ? <Badge tone="primary">Activa</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">{item.description}</p>
                  </div>
                </button>
              ))}

              <div className="pt-2">
                <h3 className="text-sm font-bold text-text">Variante de portada</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {template.coverVariants.map((variant) => (
                    <button
                      type="button"
                      key={variant}
                      onClick={() => updateCatalog(catalog.id, { coverVariant: variant })}
                      className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${
                        catalog.coverVariant === variant
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-text-secondary hover:bg-slate-50'
                      }`}
                    >
                      {coverLabels[variant]}
                    </button>
                  ))}
                </div>
              </div>
              {template.origin === 'client' ? (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                  <p className="text-xs font-bold text-success-strong">
                    Plantilla reconstruida desde el catálogo de referencia
                  </p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Al agregar o eliminar productos, el sistema conserva estas reglas y crea las páginas necesarias automáticamente.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {panel === 'content' ? (
            <div className="space-y-5">
              <InputField
                label="Título de portada"
                value={catalog.settings.title}
                onChange={(event) => setting('title', event.target.value)}
              />
              <TextareaField
                label="Subtítulo"
                value={catalog.settings.subtitle}
                onChange={(event) => setting('subtitle', event.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Campaña"
                  value={catalog.settings.campaignLabel}
                  onChange={(event) => setting('campaignLabel', event.target.value)}
                />
                <InputField
                  label="Promoción"
                  value={catalog.settings.discountLabel}
                  onChange={(event) => setting('discountLabel', event.target.value)}
                />
              </div>
              <InputField
                label="Sitio web"
                value={catalog.settings.website}
                onChange={(event) => setting('website', event.target.value)}
              />
              <InputField
                label="WhatsApp"
                value={catalog.settings.whatsapp}
                onChange={(event) => setting('whatsapp', event.target.value)}
              />
              <InputField
                label="Instagram"
                value={catalog.settings.instagram}
                onChange={(event) => setting('instagram', event.target.value)}
              />
              <SelectField
                label="Productos por página"
                value={catalog.settings.productsPerPage}
                onChange={(event) => setting('productsPerPage', Number(event.target.value) as 2 | 4 | 6)}
              >
                <option value="2">2 productos · amplio</option>
                <option value="4">4 productos · recomendado</option>
                <option value="6">6 productos · compacto</option>
              </SelectField>
              <div className="space-y-2 rounded-2xl border border-border bg-slate-50 p-4">
                {[
                  { key: 'showPrices', label: 'Mostrar precios' },
                  { key: 'showCodes', label: 'Mostrar códigos' },
                  { key: 'showTechnicalData', label: 'Mostrar datos técnicos' },
                ].map(({ key, label }) => {
                  const checked = catalog.settings[key as keyof CatalogSettings] as boolean
                  return (
                    <label key={key} className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                      {label}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setting(key as keyof CatalogSettings, event.target.checked as never)
                        }
                        className="toggle"
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          ) : null}

          {panel === 'style' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'primary', label: 'Color principal' },
                  { key: 'secondary', label: 'Color oscuro' },
                  { key: 'background', label: 'Fondo del PDF' },
                  { key: 'text', label: 'Texto' },
                ].map(({ key, label }) => (
                  <label key={key} className="rounded-2xl border border-border p-3">
                    <span className="text-xs font-bold text-text-secondary">{label}</span>
                    <span className="mt-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={catalog.settings.theme[key as keyof typeof catalog.settings.theme]}
                        onChange={(event) =>
                          updateCatalogSettings(catalog.id, {
                            theme: { ...catalog.settings.theme, [key]: event.target.value },
                          })
                        }
                        className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-[10px] uppercase text-text-tertiary">
                        {catalog.settings.theme[key as keyof typeof catalog.settings.theme]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <SelectField
                label="Estilo tipográfico"
                value={catalog.settings.theme.headingFont}
                onChange={(event) =>
                  updateCatalogSettings(catalog.id, {
                    theme: {
                      ...catalog.settings.theme,
                      headingFont: event.target.value as typeof catalog.settings.theme.headingFont,
                    },
                  })
                }
              >
                <option value="modern">Moderno</option>
                <option value="editorial">Editorial</option>
                <option value="compact">Compacto</option>
              </SelectField>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex gap-3">
                  <Palette className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs leading-5 text-text-secondary">
                    Los controles están limitados a combinaciones seguras para mantener jerarquía, legibilidad y consistencia editorial.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {panel === 'categories' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text">Contenido por categoría</h3>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Cada sección puede tener una imagen ambiental independiente.
                </p>
              </div>
              {categories.map((category) => (
                <CategoryCreativeCard key={category.id} category={category} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="surface-card min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-text">Vista en vivo</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">Portada · A4 digital</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-text-secondary">
            42%
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="catalog-editor-canvas">
          <div className="catalog-editor-sheet">
            <CatalogDocument
              catalog={catalog}
              categories={categories}
              products={products}
              template={template}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-5 py-4 sm:px-6">
          <p className="text-xs text-text-tertiary">
            Los datos se guardan automáticamente. La versión se crea al exportar el PDF.
          </p>
          <Button
            variant="secondary"
            icon={<Settings2 className="h-4 w-4" />}
            onClick={() => setPanel('content')}
          >
            Ajustar contenido
          </Button>
        </div>
      </section>
    </div>
  )
}
