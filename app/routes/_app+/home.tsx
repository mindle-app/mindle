import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Card, CardContent } from '#app/components/ui/card.js'
import { prisma } from '#app/utils/db.server.js'
import { getSubjectImgSrc } from '#app/utils/misc.js'
import { useUser } from '#app/utils/user.js'

export async function loader() {
  const subjects = await prisma.subject.findMany({ include: { image: true } })
  return json({ subjects })
}

function SubjectCard({
  name,
  imgSrc,
  href,
}: {
  imgSrc: string | undefined
  name: string
  href: string
  totalSessions: number
  completedSessions: number
  activeChapterName: string
}) {
  return (
    <Link to={href} prefetch="intent">
      <Card className="default-transition min-w-[320px] border-2 p-12 hover:border-primary">
        <CardContent className="flex w-full flex-col items-center gap-9">
          <img className="h-32 w-32" src={imgSrc} />
          <div className="flex flex-col gap-2.5 text-center">
            <p className="font-coHeadlineBold text-2xl font-bold">BAC {name}</p>
            <p className="font-coHeadline text-xl">
              15/52 Sesiuni de studiu complete
            </p>
          </div>
          <div className="h-25 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary px-10 py-4 text-center text-primary">
            <p className="text-xl font-bold">Moara cu noroc</p>
            <p>Sesiunea de studiu 2/4</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function Home() {
  const user = useUser()
  const { subjects } = useLoaderData<typeof loader>()
  const name = user.name?.split(' ')[0]
  return (
    <div className="container flex h-full w-full flex-col items-center justify-center gap-4">
      <h1 className="text-center font-coHeadlineBold text-6xl">
        Salut, {name ?? user.name}! <br />
        Ce vrei să înveți?
      </h1>
      <div className="mt-12 flex gap-8">
        {subjects.map((s) => (
          <SubjectCard
            href={`/subjects/${s.type ?? 'sciences'}/${s.slug}`}
            key={s.id}
            name={s.name}
            imgSrc={getSubjectImgSrc(s.image?.id ?? '')}
            totalSessions={52}
            completedSessions={15}
            activeChapterName="Sistemul nervos"
          />
        ))}
      </div>
    </div>
  )
}
