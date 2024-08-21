import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, redirect } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  invariantResponse(params.subjectId, 'No subject id presented', {
    status: 404,
  })
  const subject = await prisma.subject.findUnique({
    where: { id: parseInt(params.subjectId) },
  })

  return redirect(
    `/subjects/${subject?.type ?? 'sciences'}/${params.subjectId}`,
  )
}
