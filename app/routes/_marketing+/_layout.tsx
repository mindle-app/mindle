import { Link, Outlet } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'
import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc'
import { useOptionalUser } from '#app/utils/user'
import dayjs from 'dayjs'

export function LandingHeader() {
  const user = useOptionalUser()
  return (
    <header className={cn('z-10 w-full pt-6 text-primary-foreground')}>
      <nav
        className={cn(
          'container flex flex-wrap items-center justify-between sm:flex-nowrap md:gap-8',
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

function Footer({ className }: { className?: string }) {
  const year = dayjs().get('year')
  return (
    <footer className={cn('flex flex-col items-center gap-4', className)}>
      <Link to={'/tos'} className="underline">
        Termeni și condiții
      </Link>
      <Link to={'/privacy'} className="underline">
        Politica de confidențialitate
      </Link>
      Copyright © {year} Mindle
    </footer>
  )
}

export default function MarketingLayout() {
  return (
    <div className="max-w-screen relative flex min-h-screen w-full flex-col items-center">
      <main>
        <Outlet />
      </main>
      <Footer className="mt-8" />
    </div>
  )
}
