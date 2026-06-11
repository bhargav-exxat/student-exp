import * as React from "react"
import {
  useNavigate,
  useLocation,
  useSearchParams as useRouterSearchParams,
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from "react-router-dom"

/**
 * React Router helpers with a stable `href` prop on links and a small
 * `useRouter()` surface for scaffold code ported from other stacks.
 *
 * Prefer importing from `react-router-dom` directly in new code.
 */

export type LinkProps = Omit<RouterLinkProps, "to"> & {
  href: string
  prefetch?: boolean
  scroll?: boolean
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function Link({ href, prefetch: _prefetch, scroll: _scroll, ...rest }, ref) {
    return <RouterLink ref={ref} to={href} {...rest} />
  },
)

export function useRouter() {
  const navigate = useNavigate()
  return React.useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => window.location.reload(),
      prefetch: (_href: string) => undefined,
    }),
    [navigate],
  )
}

export function usePathname(): string {
  return useLocation().pathname
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams()
  return params
}

export function redirect(href: string): never {
  throw new Error(
    `redirect("${href}") is unavailable in the browser bundle. ` +
      `Use <Navigate to="${href}" replace /> from react-router-dom in JSX, ` +
      `or useNavigate() inside a useEffect.`,
  )
}
