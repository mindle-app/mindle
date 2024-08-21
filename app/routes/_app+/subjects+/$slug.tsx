import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, redirect } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  invariantResponse(params.slug, 'No subject id presented', {
    status: 404,
  })
  // TODO: Change to findUnique when unique constraint will be applied on slug
  const subject = await prisma.subject.findFirst({
    where: { slug: params.slug },
  })

  return redirect(
    `/subjects/${subject?.type ?? 'sciences'}/${params.subjectId}`,
  )
}
