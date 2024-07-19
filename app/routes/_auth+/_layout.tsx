import { Link, Outlet } from '@remix-run/react'
import { Logo } from '#app/components/logo.js'
import { Button } from '#app/components/ui/button.js'
import { cn } from '#app/utils/misc.js'

export function LandingHeader() {
  return (
    <header className={cn('w-full pt-6 text-primary-foreground')}>
      <nav
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
        )}
      >
        <Logo className={'w-25 h-25'} />

        <div className="flex items-center gap-10">
          <Button asChild variant={'default'} size="lg">
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}

export default function AuthLayout() {
  return (
    <div className="container flex min-h-screen flex-col items-center">
      <LandingHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  )
}
