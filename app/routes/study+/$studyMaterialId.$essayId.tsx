import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  const essay = await prisma.essay.findUnique({
    where: { id: params.essayId },
    include: { paragraphs: { orderBy: { order: 'asc' } } },
  })

  invariantResponse(essay, 'Essay not found', { status: 404 })
  return json({ essay })
}

export default function StudyMaterial() {
  const { essay } = useLoaderData<typeof loader>()
  return JSON.stringify(essay)
}
