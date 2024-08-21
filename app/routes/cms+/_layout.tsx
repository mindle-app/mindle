import { type HeadersFunction, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, NavLink, Outlet } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Logo } from '#app/components/logo'

import { Button } from '#app/components/ui/button.js'
import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc.tsx'
import { requireUserWithRole } from '#app/utils/permissions.server.js'
import { useOptionalUser } from '#app/utils/user.js'

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserWithRole(request, 'admin')
  return null
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  const headers = {
    'Cache-Control': loaderHeaders.get('Cache-Control') ?? '',
    Vary: 'Cookie',
  }
  return headers
}

export function NavHeader() {
  const user = useOptionalUser()
  return (
    <header className={cn('w-full border-b px-8 py-6 text-primary-foreground')}>
      <nav
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
        )}
      >
        <Link to={'/'}>
          <Logo className={'h-25 w-25 fill-foreground'} />
        </Link>

        <div className="flex items-center">
          {user ? (
            <UserDropdown
              buttonProps={{ variant: 'outline', className: 'h-16 w-16' }}
            />
          ) : (
            <Button asChild variant={'secondary'} size="lg">
              <Link to="/login">Log In</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn('w-full min-w-[150px] rounded p-2 hover:bg-muted', {
    'bg-accent text-primary': isActive,
  })

const items = [
  { name: 'Subjects', to: '/cms/subjects' },
  { name: 'Chapters', to: '/cms/chapters' },
  { name: 'Subchapters', to: '/cms/subchapters' },
  { name: 'Study Materials', to: '/cms/study-materials' },
  { name: 'Essays', to: '/cms/essays' },
  { name: 'Users', to: '/cms/users' },
  { name: 'Authors', to: '/cms/authors' },
]

export default function CmsLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center">
      <NavHeader />
      <div className="flex w-full flex-grow pt-5">
        <aside className="border-r p-2">
          <nav className="flex flex-col items-start gap-4">
            {items.map((i) => (
              <NavLink key={i.name} className={linkClasses} to={i.to}>
                {i.name}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex w-full flex-grow pl-4 pt-2">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: ({ error }) => (
          <p>You are not allowed to do that: {error?.data.message}</p>
        ),
      }}
    />
  )
}
