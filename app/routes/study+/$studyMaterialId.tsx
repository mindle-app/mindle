import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { json, Outlet, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  const studyMaterial = await prisma.studyMaterial.findUnique({
    where: { id: params.studyMaterialId },
  })

  invariantResponse(studyMaterial, 'Study material not found', { status: 404 })
  return json({ studyMaterial })
}

export default function StudyMaterial() {
  const { studyMaterial } = useLoaderData<typeof loader>()
  return (
    <div className="flex">
      {JSON.stringify(studyMaterial)}
      <Outlet />
    </div>
  )
}
