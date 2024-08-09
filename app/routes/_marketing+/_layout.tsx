import { Link, Outlet } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'
import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc'
import { useOptionalUser } from '#app/utils/user'

export function LandingHeader() {
  const user = useOptionalUser()
  return (
    <header className={cn('w-full bg-primary pt-6 text-primary-foreground')}>
      <nav
        className={cn(
          'container flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
        )}
      >
        <Logo className={'w-30 h-7 fill-primary-foreground'} />

        <div className="flex items-center gap-10">
          {user ? (
            <UserDropdown />
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

export default function MarketingLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center">
      <LandingHeader />
      <main className="container flex-grow">
        <Outlet />
      </main>
    </div>
  )
}
