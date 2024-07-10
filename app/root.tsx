import {
  json,
  type LoaderFunctionArgs,
  type HeadersFunction,
  type LinksFunction,
  type MetaFunction,
} from '@remix-run/node'
import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useMatches,
  useSubmit,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { type SVGProps, useRef } from 'react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu.tsx'
import { Icon, href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import { ThemeSwitch, useTheme } from './routes/resources+/theme-switch.tsx'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import {
  cn,
  combineHeaders,
  getDomainUrl,
  getUserImgSrc,
} from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'
import { useOptionalUser, useUser } from './utils/user.ts'

export const links: LinksFunction = () => {
  return [
    // Preload svg sprite as a resource to avoid render blocking
    { rel: 'preload', href: iconsHref, as: 'image' },
    { rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
    {
      rel: 'alternate icon',
      type: 'image/png',
      href: '/favicons/favicon-32x32.png',
    },
    { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
      crossOrigin: 'use-credentials',
    } as const, // necessary to make typescript happy
    { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
    { rel: 'stylesheet', href: tailwindStyleSheetUrl },
  ].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data ? 'Mindle' : 'Error | Mindle' },
    { name: 'description', content: 'Study buddy-ul tău pentru bac!' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const timings = makeTimings('root loader')
  const userId = await time(() => getUserId(request), {
    timings,
    type: 'getUserId',
    desc: 'getUserId in root',
  })

  const user = userId
    ? await time(
        () =>
          prisma.user.findUniqueOrThrow({
            select: {
              id: true,
              name: true,
              username: true,
              image: { select: { id: true } },
              roles: {
                select: {
                  name: true,
                  permissions: {
                    select: { entity: true, action: true, access: true },
                  },
                },
              },
            },
            where: { id: userId },
          }),
        { timings, type: 'find user', desc: 'find user in root' },
      )
    : null
  if (userId && !user) {
    console.info('something weird happened')
    // something weird happened... The user is authenticated but we can't find
    // them in the database. Maybe they were deleted? Let's log them out.
    await logout({ request, redirectTo: '/' })
  }
  const { toast, headers: toastHeaders } = await getToast(request)
  const honeyProps = honeypot.getInputProps()

  return json(
    {
      user,
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: getTheme(request),
        },
      },
      ENV: getEnv(),
      toast,
      honeyProps,
    },
    {
      headers: combineHeaders(
        { 'Server-Timing': timings.toString() },
        toastHeaders,
      ),
    },
  )
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  const headers = {
    'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
  }
  return headers
}

function Document({
  children,
  nonce,
  theme = 'light',
  env = {},
  allowIndexing = true,
}: {
  children: React.ReactNode
  nonce: string
  theme?: Theme
  env?: Record<string, string>
  allowIndexing?: boolean
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : (
          <meta name="robots" content="noindex, nofollow" />
        )}
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

function App() {
  const data = useLoaderData<typeof loader>()
  const nonce = useNonce()
  const user = useOptionalUser()
  const theme = useTheme()
  const matches = useMatches()
  const isOnSearchPage = matches.find((m) => m.id === 'routes/users+/index')
  const isOnLanding = !!matches.find((m) => m.id === 'routes/_marketing+/index')
  const searchBar = isOnSearchPage ? <SearchBar status="idle" /> : null
  const allowIndexing = data.ENV.ALLOW_INDEXING !== 'false'
  useToast(data.toast)

  return (
    <Document
      nonce={nonce}
      theme={theme}
      allowIndexing={allowIndexing}
      env={data.ENV}
    >
      <div className="flex h-screen flex-col justify-between">
        <header
          className={cn('w-full py-6', {
            'bg-primary text-primary-foreground': isOnLanding,
          })}
        >
          <nav
            className={cn(
              'container flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
            )}
          >
            <Logo
              className={isOnLanding ? 'fill-primary-foreground' : undefined}
            />
            <div className="ml-auto hidden max-w-sm flex-1 sm:block">
              {searchBar}
            </div>
            <div className="flex items-center gap-10">
              {user ? (
                <UserDropdown />
              ) : (
                <Button asChild variant="secondary" size="lg">
                  <Link to="/login">Log In</Link>
                </Button>
              )}
            </div>
            <div className="block w-full sm:hidden">{searchBar}</div>
          </nav>
        </header>

        <div className="flex-1">
          <Outlet />
        </div>

        <div className="container flex justify-between pb-5">
          <div />
          <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
        </div>
      </div>
      <EpicToaster closeButton position="top-center" theme={theme} />
      <EpicProgress />
    </Document>
  )
}

function Logo({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <Link to={'/'}>
      <svg
        width="168"
        height="40"
        viewBox="0 0 168 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('w-20 fill-foreground', className)}
        {...rest}
      >
        <path d="M0 39.2543V21.8375C0 14.9134 5.12967 11.3449 11.9343 11.3449C16.1218 11.3449 19.4718 12.8362 21.5132 15.3928C23.5546 12.8362 26.7999 11.3449 30.9874 11.3449C37.6874 11.3449 42.8694 14.9134 42.8694 21.8375V39.2543H34.4421V24.2876C34.4421 20.6658 32.9241 19.2277 30.2546 19.2277C27.5327 19.2277 25.6484 20.9854 25.6484 25.0333V39.2543H17.221V25.0333C17.221 20.9854 15.389 19.2277 12.6671 19.2277C9.99762 19.2277 8.42732 20.6658 8.42732 24.2876V39.2543H0Z" />
        <path d="M48.8738 39.2543V15.8722C48.8738 13.1025 50.6011 12.0905 53.2706 12.0905C55.155 12.0905 56.8823 12.7297 57.3011 12.8895V39.2543H48.8738ZM48.4027 4.79361C48.4027 2.07723 50.3917 0 53.0613 0C55.7308 0 57.7722 2.07723 57.7722 4.79361C57.7722 7.50999 55.7308 9.53395 53.0613 9.53395C50.3917 9.53395 48.4027 7.50999 48.4027 4.79361Z" />
        <path d="M62.5485 39.2543V22.7963C62.5485 15.3395 68.568 11.3449 75.8961 11.3449C83.2242 11.3449 89.1914 15.3395 89.1914 22.7963V39.2543H80.7641V24.767C80.7641 20.9854 79.0368 19.2277 75.8961 19.2277C72.5985 19.2277 70.9758 21.0919 70.9758 24.767V39.2543H62.5485Z" />
        <path d="M122.875 0.798934V24.4474C122.875 28.9747 121.933 32.277 120.258 34.5672C117.589 38.1358 113.349 40 108.324 40C100.106 40 93.877 34.2477 93.877 25.6724C93.877 17.0439 99.6871 11.3449 106.806 11.3449C110.732 11.3449 113.244 12.996 114.5 14.2743V3.78163C114.5 1.01198 116.228 0 118.897 0C120.782 0 122.457 0.639149 122.875 0.798934ZM108.533 32.1172C112.04 32.1172 114.553 29.7204 114.553 25.7257C114.553 22.0506 112.04 19.1744 108.533 19.1744C105.026 19.1744 102.514 21.8908 102.514 25.7257C102.514 29.5606 105.026 32.1172 108.533 32.1172Z" />
        <path d="M128.258 39.2543V3.78163C128.258 1.01198 129.985 0 132.655 0C134.539 0 136.267 0.639149 136.685 0.798934V39.2543H128.258Z" />
        <path d="M152.454 29.241H150.622C150.884 30.8921 152.82 32.8096 157.531 32.8096C161.143 32.8096 164.074 31.4248 164.336 31.1585L167.267 37.1238C166.168 37.8162 162.033 40 155.699 40C147.9 40 141.619 34.7803 141.619 25.6724C141.619 17.0972 147.848 11.3449 155.961 11.3449C163.551 11.3449 168 15.8722 168 20.7723C168 26.0453 164.859 29.241 152.454 29.241ZM150.203 23.7017C159.52 23.7017 159.887 22.1571 159.887 20.719C159.887 19.2277 158.578 17.9494 155.909 17.9494C152.14 17.9494 150.36 20.8788 150.203 23.7017Z" />
      </svg>
    </Link>
  )
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>()
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  )
}

export default withSentry(AppWithProviders)

function UserDropdown() {
  const user = useUser()
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button asChild variant="secondary">
          <Link
            to={`/users/${user.username}`}
            // this is for progressive enhancement
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2"
          >
            <img
              className="h-8 w-8 rounded-full object-cover"
              alt={user.name ?? user.username}
              src={getUserImgSrc(user.image?.id)}
            />
            <span className="text-body-sm font-bold">
              {user.name ?? user.username}
            </span>
          </Link>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent sideOffset={8} align="start">
          <DropdownMenuItem asChild>
            <Link prefetch="intent" to={`/users/${user.username}`}>
              <Icon className="text-body-md" name="avatar">
                Profile
              </Icon>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link prefetch="intent" to={`/users/${user.username}/notes`}>
              <Icon className="text-body-md" name="pencil-2">
                Notes
              </Icon>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            // this prevents the menu from closing before the form submission is completed
            onSelect={(event) => {
              event.preventDefault()
              submit(formRef.current)
            }}
          >
            <Form action="/logout" method="POST" ref={formRef}>
              <Icon className="text-body-md" name="exit">
                <button type="submit">Logout</button>
              </Icon>
            </Form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}

export function ErrorBoundary() {
  // the nonce doesn't rely on the loader so we can access that
  const nonce = useNonce()

  // NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
  // likely failed to run so we have to do the best we can.
  // We could probably do better than this (it's possible the loader did run).
  // This would require a change in Remix.

  // Just make sure your root route never errors out and you'll always be able
  // to give the user a better UX.

  return (
    <Document nonce={nonce}>
      <GeneralErrorBoundary />
    </Document>
  )
}
