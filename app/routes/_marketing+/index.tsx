import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Card } from '#app/components/ui/card'
import { Icon } from '#app/components/ui/icon'
import { useOptionalUser } from '#app/utils/user'
import { type IconName } from '@/icon-name'

export const meta: MetaFunction = () => [{ title: 'Mindle' }]

function Hero() {
  const user = useOptionalUser()
  return (
    <div className="flex flex-col justify-center py-8 md:flex-row md:justify-between md:py-12">
      <div className="flex flex-col gap-4 text-center md:justify-center md:text-start">
        <h2 className="font-poppinsLight text-lg">
          Platforma de învățat la bac
        </h2>
        <h1 className="font-coHeadlineBold text-5xl">
          Eu sunt Mindle, study buddy-ul tau pentru bac!
        </h1>
        <Icon
          className="h-[288px] w-[382px] lg:hidden lg:h-[394px] lg:w-[521px]"
          name={'heya-mindle-big'}
        />
        <div className="mt-12 w-full flex-col gap-3 md:flex md:flex-row xl:pr-64">
          <Button variant={'secondary'} size={'wide'} asChild>
            <Link to={user ? '/dashboard' : '/login'}>
              {user ? 'Continua lectiile' : 'Intră in cont'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function LandingSection({
  icon,
  title,
  body,
}: {
  icon: IconName
  title: string
  body: React.ReactNode
}) {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-3 pt-16">
      <Icon name={icon} className="h-16 w-16" />
      <p className="text-center font-coHeadlineBold text-3xl lg:text-4xl">
        {title}
      </p>
      {body}
    </section>
  )
}

export default function Index() {
  return (
    <main className="grid h-full font-poppins">
      <section className="relative flex w-full items-center justify-center text-primary-foreground">
        <div className="absolute -z-30 h-full w-screen bg-primary" />
        <div className="flex flex-col items-center justify-center lg:flex-row">
          <Hero />
          <Icon
            className="hidden h-[288px] w-[382px] lg:flex lg:h-[394px] lg:w-[521px]"
            name={'heya-mindle-big'}
          />
        </div>
      </section>
      <LandingSection
        icon="mindle-head"
        title="Sunt aici sa te ajut:"
        body={
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-6 px-8 lg:flex-row">
            {[
              {
                text: 'Sa te asiguri ca obții rezultate maxime prin quizzes',
                icon: 'seal-question',
              },
              {
                text: 'Sa reții informația mai ușor folosind mindmaps',
                icon: 'git-branch',
              },
              {
                text: 'Să iti împarți materie in parți mici, ușor de învățat',
                icon: 'book-open-text',
              },
            ].map((item) => (
              <Card
                className="flex w-full flex-col items-center justify-center gap-6 rounded-xl px-6 py-6"
                key={`Card${item.text}`}
              >
                <Icon name={item.icon as IconName} className="h-12 w-12" />
                <p className="text-center font-coHeadline text-2xl">
                  {item.text}
                </p>
              </Card>
            ))}
          </div>
        }
      />
      <LandingSection
        icon={'mindle-ok-hand'}
        title="Cum functioneaza?"
        body={<p>*Insert section here </p>}
      />
      <div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
        <div className="flex max-w-md flex-col items-center text-center xl:order-2 xl:items-start xl:text-left">
          <a
            href="https://www.epicweb.dev/stack"
            className="animate-slide-top [animation-fill-mode:backwards] xl:animate-slide-left xl:[animation-delay:0.5s] xl:[animation-fill-mode:backwards]"
          >
            <svg
              className="size-20 text-foreground xl:-mt-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 65 65"
            >
              <path
                fill="currentColor"
                d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
              ></path>
            </svg>
          </a>
          <h1
            data-heading
            className="mt-8 animate-slide-top text-4xl font-medium text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] md:text-5xl xl:mt-4 xl:animate-slide-left xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
          >
            <a href="https://www.epicweb.dev/stack">The Epic Stack</a>
          </h1>
          <p
            data-paragraph
            className="mt-6 animate-slide-top text-xl/7 text-muted-foreground [animation-delay:0.8s] [animation-fill-mode:backwards] xl:mt-8 xl:animate-slide-left xl:text-xl/6 xl:leading-10 xl:[animation-delay:1s] xl:[animation-fill-mode:backwards]"
          >
            Check the{' '}
            <a
              className="underline hover:no-underline"
              href="https://github.com/epicweb-dev/epic-stack/blob/main/docs/getting-started.md"
            >
              Getting Started guide
            </a>{' '}
            file for how to get your project off the ground!
          </p>
        </div>
      </div>
    </main>
  )
}
