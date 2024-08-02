import { Form, Link, useSubmit } from '@remix-run/react'
import { useRef } from 'react'
import { getUserImgSrc } from '#app/utils/misc.js'
import { useUser } from '#app/utils/user.js'
import { Button, type ButtonProps } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Icon } from './ui/icon'

export function UserDropdown({
  buttonProps = {},
}: {
  buttonProps?: ButtonProps
}) {
  const user = useUser()
  const isAdmin = user.roles.find((role) => role.name === 'admin')
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button asChild variant="secondary" {...buttonProps}>
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
          {isAdmin ? (
            <DropdownMenuItem asChild>
              <Link prefetch="intent" to={`/cms`}>
                <Icon className="text-body-md" name="file-lock">
                  CMS
                </Icon>
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link prefetch="intent" to={`/dashboard`}>
              <Icon className="text-body-md" name="layout-dashboard">
                Dashboard
              </Icon>
            </Link>
          </DropdownMenuItem>
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
