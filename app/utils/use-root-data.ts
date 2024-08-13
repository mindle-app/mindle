// this is needed by things the root needs, so to avoid circular deps we have to
// put it in its own file which is silly I know...

import { useRouteLoaderData } from '@remix-run/react'
import { type loader as rootLoader } from '../root.tsx'

export const useRootData = () => useRouteLoaderData<typeof rootLoader>('root')
