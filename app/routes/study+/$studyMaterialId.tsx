import { invariantResponse } from '@epic-web/invariant'
import { ElementScrollRestoration } from '@epic-web/restore-scroll'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { json, Link, useLoaderData, useRouteError } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Icon } from '#app/components/ui/icon.js'
import { prisma } from '#app/utils/db.server.js'
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
    <div className="flex h-full max-w-full flex-grow flex-col">
      <main className="flex flex-grow flex-col sm:h-full sm:min-h-[800px]">
        <div className="relative flex h-full flex-col">
          <h1 className="h-14 border-b pl-10 pr-5 text-sm font-medium leading-tight">
            <div className="flex h-14 flex-wrap items-center justify-between gap-x-2 py-2">
              <div className="flex items-center justify-start gap-x-2 uppercase">
                <Link
                  to={`/study/${studyMaterial.id}`}
                  className="hover:underline"
                >
                  {studyMaterial.title}
                </Link>
              </div>
            </div>
          </h1>
          <article
            id={studyMaterial.id}
            key={studyMaterial.id}
            className="shadow-on-scrollbox scrollbar-thin scrollbar-thumb-scrollbar h-full w-full max-w-none flex-1 scroll-pt-6 space-y-4 overflow-y-auto p-2 sm:p-10 sm:pt-8"
          >
            <h1 className="font-coHeadlineBold text-2xl">
              {studyMaterial.title}
            </h1>
            <p>{studyMaterial.des}</p>
            <h2 className="font-coHeadline text-xl">Esee:</h2>

            <div className="flex flex-col">
              {studyMaterial.essays.map((e) => (
                <Link className="mt-0 flex gap-x-2" to={`${e.id}`} key={e.id}>
                  <span className="hover:bg-muted/50">{e.title}</span>
                  <Icon name={'arrow-right'} />
                </Link>
              ))}
            </div>
          </article>
          <ElementScrollRestoration
            elementQuery={`#${studyMaterial.id}`}
            key={`scroll-${studyMaterial.id}`}
          />

          <div className="flex h-16 justify-between border-b-4 border-t lg:border-b-0">
            <div>
              <div className="h-full"></div>
            </div>
          </div>
        </div>
      </main>
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
