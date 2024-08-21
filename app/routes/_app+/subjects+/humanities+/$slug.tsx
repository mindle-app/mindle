import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { invariantResponse } from '@epic-web/invariant'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export async function loader({ request, params }: LoaderFunctionArgs) {
  requireUserId(request)
  const subject = await prisma.subject.findFirst({
    where: { slug: params.slug },
  })
  invariantResponse(subject, 'Subject not found', { status: 404 })
  return json({ subject })
}

export default function HumanitiesSubject() {
  const { subject } = useLoaderData<typeof loader>()
  return (
    <div>
      Humanities
      <h1>{subject.name}</h1>
    </div>
  )
}
