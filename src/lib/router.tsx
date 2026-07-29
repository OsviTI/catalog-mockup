/* oxlint-disable react/only-export-components -- Router, links and hooks share one small context by design. */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'

const currentPath = () => {
  const hash = window.location.hash.replace(/^#/, '')
  return hash.startsWith('/') ? hash : '/'
}

interface RouterValue {
  path: string
  navigate: (to: string, options?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterValue | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const update = () => setPath(currentPath())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  const value = useMemo<RouterValue>(
    () => ({
      path,
      navigate: (to, options) => {
        const target = to.startsWith('/') ? to : `/${to}`
        if (options?.replace) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${target}`)
          setPath(target)
          return
        }
        window.location.hash = target
      },
    }),
    [path],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export const useRouter = () => {
  const value = useContext(RouterContext)
  if (!value) throw new Error('useRouter debe utilizarse dentro de RouterProvider.')
  return value
}

export const useNavigate = () => useRouter().navigate

export const useParams = () => {
  const { path } = useRouter()
  const match = path.match(/^\/catalogos\/([^/]+)/)
  return { catalogId: match ? decodeURIComponent(match[1]) : undefined }
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> {
  to: string
  className?: string | ((state: { isActive: boolean }) => string)
  end?: boolean
}

export function Link({ to, className, end = false, children, ...props }: LinkProps) {
  const { path } = useRouter()
  const active = end ? path === to : path === to || path.startsWith(`${to}/`)
  const resolvedClass = typeof className === 'function' ? className({ isActive: active }) : className

  return (
    <a href={`#${to}`} className={resolvedClass} {...props}>
      {children}
    </a>
  )
}

export const NavLink = Link
