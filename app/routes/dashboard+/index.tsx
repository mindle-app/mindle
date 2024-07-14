import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useMatches } from '@remix-run/react'

import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

import { UserState } from '#app/utils/user.js'

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    hello: 'world',
  })
}

export default function Dashboard() {
  const data = useLoaderData()
  const x = useMatches()
  console.log(x)

  return <></>
}
