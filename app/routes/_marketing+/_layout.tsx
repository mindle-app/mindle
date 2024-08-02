import { Link, Outlet } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'
import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc'
import { useOptionalUser } from '#app/utils/user'

export function LandingHeader() {
  const user = useOptionalUser()
  return (
    <>
      <div className="absolute -z-30 mx-auto h-20 w-screen bg-primary" />

      <header className={cn('w-full pt-6 text-primary-foreground')}>
        <nav
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
          )}
        >
          <Logo className={'w-25 h-25 fill-primary-foreground'} />

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
    </>
  )
}

export default function MarketingLayout() {
  return (
    <div className="container flex min-h-screen flex-col items-center">
      <LandingHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  )
}
