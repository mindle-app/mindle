import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, redirect } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.js'

export async function loader({ params }: LoaderFunctionArgs) {
  invariantResponse(params.slug, 'No subject id presented', {
    status: 404,
  })
  const subject = await prisma.subject.findUnique({
    where: { slug: params.slug },
  })

  invariantResponse(subject, 'Subject not found')

  return redirect(`/subjects/${subject.type ?? 'sciences'}/${params.slug}`)
}
