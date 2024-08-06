import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import {
  json,
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import { prisma } from '#app/utils/db.server.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Icon } from '#app/components/ui/icon.js'
import { getErrorMessage } from '#app/utils/misc.js'

export async function loader({ params }: LoaderFunctionArgs) {
  const studyMaterial = await prisma.studyMaterial.findUnique({
    where: { id: params.studyMaterialId },
    include: { essays: true },
  })

  invariantResponse(studyMaterial, 'Study material not found', { status: 404 })
  invariantResponse(studyMaterial.essays.length, 'Nu am gasit esee', {
    status: 404,
  })
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

export function ErrorBoundary() {
  const error = useRouteError()
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: () => (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1>{getErrorMessage(error)}</h1>
            </div>
            <Link to=".." className="text-body-md underline">
              <Icon name="arrow-left">Mergi inapoi</Icon>
            </Link>
          </div>
        ),
      }}
    />
  )
}
