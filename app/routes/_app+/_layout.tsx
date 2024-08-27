import { Link, Outlet, useParams, useSearchParams } from '@remix-run/react'
import { Logo } from '#app/components/logo'
import { Button } from '#app/components/ui/button'

import {
  SegmentedControlItem,
  SegmentedControlRoot,
} from '#app/components/ui/segmented-control.tsx'
import { UserDropdown } from '#app/components/user-dropdown.js'
import { cn } from '#app/utils/misc'
import { useOptionalUser } from '#app/utils/user'

// This control is shown only on a humanities subject essay page. E.g
// /subjects/humanities/$slug/$studyMaterialId/$essayId
function HumanitiesEssayTabs() {
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  if (!params.essayId) return null

  return (
    <SegmentedControlRoot
      defaultValue={searchParams.get('preview') ?? 'explicatie'}
      onValueChange={(value) => {
        searchParams.set('preview', value)
        setSearchParams(searchParams)
      }}
    >
      <SegmentedControlItem value={'explicatie'}>
        Explicatie
      </SegmentedControlItem>
      <SegmentedControlItem value={'recall'}>Recall</SegmentedControlItem>
      <SegmentedControlItem value={'mindmap'}>Mindmap</SegmentedControlItem>
      <SegmentedControlItem value={'chat'}>Chat</SegmentedControlItem>
    </SegmentedControlRoot>
  )
}

export function NavHeader() {
  const user = useOptionalUser()
  return (
    <header className={cn('w-full border-b px-4 py-1 text-primary-foreground')}>
      <nav
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8',
        )}
      >
        <Link to={'/'} prefetch="intent">
          <Logo className={'h-12 w-[100px] fill-foreground'} />
        </Link>
        <HumanitiesEssayTabs />
        <div className="flex items-center gap-10">
          {user ? (
            <UserDropdown
              buttonProps={{ variant: 'outline', className: 'h-8 w-8' }}
            />
          ) : (
            <Button asChild variant={'secondary'} size="sm">
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
