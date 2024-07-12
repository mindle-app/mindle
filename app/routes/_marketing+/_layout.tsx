import { Form, Link, Outlet, useSubmit } from '@remix-run/react'
import { useRef } from 'react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu'
import { Icon } from '#app/components/ui/icon'
import { cn, getUserImgSrc } from '#app/utils/misc'
import { useOptionalUser, useUser } from '#app/utils/user'

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
    <div className="flex min-h-screen flex-col items-center">
      <LandingHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  )
}
