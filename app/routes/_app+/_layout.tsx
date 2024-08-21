import { Link, Outlet } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'

import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc'
import { useOptionalUser } from '#app/utils/user'

export function NavHeader() {
  const user = useOptionalUser()
  return (
    <header className={cn('w-full border-b px-8 py-6 text-primary-foreground')}>
      <nav
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
        )}
      >
        <Link to={'/'} prefetch="intent">
          <Logo className={'w-25 h-25 fill-foreground'} />
        </Link>

        <div className="flex items-center gap-10">
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

export default function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center">
      <NavHeader />
      <div className="w-full flex-grow">
        <Outlet />
      </div>
    </div>
  )
}
