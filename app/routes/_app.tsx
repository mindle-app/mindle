import { Link, Outlet } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'

import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc'
import { useOptionalUser } from '#app/utils/user'

export function NavHeader() {
  const user = useOptionalUser()
  return (
    <>
      <div className="absolute -z-30 mx-auto h-20 w-screen" />

      <header className={cn('w-full pt-6 text-primary-foreground')}>
        <nav
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
          )}
        >
          <Link to={'/'}>
            <Logo className={'w-25 h-25 fill-foreground'} />
          </Link>

          <div className="flex items-center gap-10">
            {user ? (
              <UserDropdown buttonProps={{ variant: 'outline' }} />
            ) : (
              <Button asChild variant={'secondary'} size="lg">
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>
    </>
  )
}

export default function MarketingLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center">
      <NavHeader />
      <div className="w-full flex-grow pt-10">
        <Outlet />
      </div>
    </div>
  )
}
