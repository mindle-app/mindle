import { Link, type LinkProps } from '@remix-run/react'
import { type ReactNode } from 'react'
import { Button, type ButtonProps } from './button'

export type LinkButtonProps = {
  to: LinkProps['to']
  linkProps?: Omit<LinkProps, 'to'>
  buttonProps?: Omit<ButtonProps, 'children'>
  children: ReactNode
}
export function LinkButton({
  to,
  linkProps = {},
  buttonProps = {},
  children,
}: LinkButtonProps) {
  return (
    <Link to={to} {...linkProps}>
      <Button variant={'link'} {...buttonProps}>
        {children}
      </Button>
    </Link>
  )
}
