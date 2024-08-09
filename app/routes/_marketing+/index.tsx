import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, redirect } from '@remix-run/react'
import Autoplay from 'embla-carousel-autoplay'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#app/components/ui/avatar.js'
import { Button } from '#app/components/ui/button'
import { Card } from '#app/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '#app/components/ui/carousel.js'
import { Icon } from '#app/components/ui/icon'
import { Slider } from '#app/components/ui/slider.js'
import { getUserId } from '#app/utils/auth.server.js'
import { cn } from '#app/utils/misc.js'
import { LandingHeader } from './_layout'
import { type IconName } from '@/icon-name'

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request)
  if (userId) {
    throw redirect('/home')
  }
  return null
}

export const meta: MetaFunction = () => [{ title: 'Mindle' }]

function Hero() {
  return (
    <div className="relative flex w-full flex-col justify-center overflow-hidden bg-repeat py-8 md:flex-row md:justify-between md:py-12">
      <div className="container flex flex-col gap-4 text-center">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex w-full flex-1 flex-col gap-4 text-center md:justify-center lg:text-start">
            <h2 className="font-poppinsLight text-lg">
              Heya! Eu sunt Mindle! 👋
            </h2>
            <h1 className="font-coHeadlineBold text-5xl">
              Invață ușor și structurat pentru bac
            </h1>
            <div className="w-full lg:mt-8 xl:pr-64">
              <Button variant={'secondary'} size={'wide'} asChild>
                <Link to={'/login'}>Alătură-te lui Mindle</Link>
              </Button>
            </div>
          </div>
          <img
            src={'/img/mindle-hero-screenshot.png'}
            className="border-1 w-full flex-1 rounded object-center lg:w-[564px]"
          />
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
    <section className="container flex w-full flex-col items-center justify-center gap-3 pt-16">
      <Icon name={icon} className="h-16 w-16" />
      <p className="text-center font-coHeadlineBold text-3xl lg:text-4xl">
        {title}
      </p>
      {body}
    </section>
  )
}

const subjects: { name: string; icon: IconName }[] = [
  { name: 'Biologie', icon: 'stethoscope' },
  { name: 'Romana', icon: 'book-open-text' },
  { name: 'Chimie', icon: 'beaker' },
  { name: 'Geografie', icon: 'earth' },
  { name: 'Istorie', icon: 'hourglass' },
  { name: 'Logica', icon: 'scroll' },
]

const testimonials = [
  {
    picture: '/img/testimonials/ely.png',
    quote:
      'Daa, I-am mai folosit si mi se pare ca pot sa retin mult mai usor informatiile.E structurat f fain. Eu la sistemul nervos nu puteam sa retin aprope nimic si mi se parea greu, dar cu schitele de pe aplicatie mi se pare mult mai logic si mai usor de retinut.',
    name: 'Ely',
  },
  {
    picture: '/img/testimonials/roberta.png',
    quote: (
      <p>
        {' '}
        ESTE PERFECTA.
        <br /> S-a nimerit numai bine ca sa mi recapitulez toata materia inainte
        de bac 😅❤️{' '}
      </p>
    ),
    name: 'Roberta',
  },
  {
    picture: '/img/testimonials/corina.png',
    quote:
      'Astazi am dat bacul si a fost foarte binee. M-a ajutat foarte mult aplicatia, ieri mi-am fixat ultimele lucruri, chiar mi-a fost de folos. Felicitri pentru tot ceea ce ati creat!🫶',
    name: 'Corina',
  },
  ,
]

function TestimonialCarousel() {
  return (
    <Carousel
      className="max-w-[248px] md:max-w-md"
      plugins={[Autoplay({ delay: 5000 })]}
    >
      <CarouselContent>
        {testimonials.map((t) => {
          return (
            <CarouselItem key={t?.name}>
              <div className="my-7 max-w-md rounded-xl border px-4 py-4 text-center md:px-24">
                <p>{t?.quote}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={t?.picture} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  {t?.name}
                </div>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

export default function Index() {
  return (
    <main className="grid h-full font-poppins">
      <section className="relative flex w-full flex-col items-center justify-center text-primary-foreground">
        <LandingHeader />

        <div className="absolute -z-30 h-full w-screen bg-primary" />
        <div
          className="-z-25 absolute h-full w-screen bg-repeat opacity-15"
          style={{ backgroundImage: 'url(/img/pattern-brand-elements.svg)' }}
        />
        <div className="flex flex-col items-center justify-center py-12 lg:flex-row">
          <Hero />
        </div>
      </section>
      <section className="container mt-5 w-full p-9">
        <div className="flex flex-wrap justify-evenly gap-6 rounded-xl border bg-card py-8">
          {subjects.map((s) => {
            return (
              <div key={s.name} className="flex items-center gap-1">
                <Icon name={s.icon} className="h-7 w-7 text-primary" />
                <p className="text-3xl italic">{s.name}</p>
              </div>
            )
          })}
        </div>
      </section>
      <section className="container mt-5 w-full">
        <div className="flex w-full flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <p className="text-4xl italic">
            Ce spun elevii care au invățat cu Mindle
          </p>
          <TestimonialCarousel />
        </div>
      </section>
      <LandingSection
        icon="mindle-head"
        title="Sunt aici sa te ajut:"
        body={
          <Card className="mt-8 flex w-full flex-col items-center justify-center gap-6 p-8">
            {[
              {
                text: 'Sa te asiguri ca obții rezultate maxime prin quizzes',
                icon: 'seal-question',
                picture: '/img/features/quiz.png',
              },
              {
                text: 'Sa reții informația mai ușor folosind mindmaps',
                icon: 'git-branch',
                picture: '/img/features/mindmaps.png',
              },
              {
                text: 'Să iti împarți materie in parți mici, ușor de învățat',
                icon: 'book-open-text',
                picture: '/img/features/imparte-materia.png',
              },
            ].map((item, index) => (
              <div
                key={`feature-${item.text}`}
                className="flex flex-col items-center gap-10 p-10 lg:flex-row"
              >
                <div>
                  <Card className="flex max-w-xs flex-col items-center justify-center gap-6 rounded-xl px-6 py-6">
                    <Icon name={item.icon as IconName} className="h-12 w-12" />
                    <p className="text-center font-coHeadline text-lg">
                      {item.text}
                    </p>
                  </Card>
                </div>
                <img
                  src={item.picture}
                  className={cn(
                    'max-w-sm rounded-xl md:max-w-lg lg:max-w-xl xl:max-w-2xl',
                    {
                      'lg:-order-1': index % 2 !== 0,
                    },
                  )}
                />
              </div>
            ))}
          </Card>
        }
      />
      <section className="container mt-12 flex w-full">
        <div className="container flex flex-col justify-center gap-3 rounded-xl border bg-card p-8 text-center">
          <p className="text-center text-primary">Cine suntem noi</p>
          <p className="text-4xl italic">Pentru elevi, de la creatorii </p>
          <Link to="https://www.invatade10.ro/">
            <img
              src={'/img/features/invata-de-10.png'}
              className="mx-auto max-h-20 max-w-xs"
            />
          </Link>
        </div>
      </section>
      <LandingSection
        title="Învață în propriul tău ritm"
        icon="mindle-glasses"
        body={
          <Card className="items-div flex w-full flex-col rounded-xl border p-9">
            <div className="flex flex-col">
              <p>1. Câte zile pe săptăpână vrei să înveți?</p>
              <div className="relative [&>[role='slider']]:bg-primary">
                <Slider max={7} step={1} min={1} />
                <div className="-z-1 absolute left-0 right-0 top-1 h-[2px] bg-primary/50" />
              </div>
              <div className="flex justify-between px-2">
                {Array.from({ length: 7 })
                  .fill(0)
                  .map((_, index) => {
                    return <p key={'days' + index + 1}>{index + 1}</p>
                  })}
              </div>
              <div className="flex flex-col">
                <p>1. Câte zile pe săptăpână vrei să înveți?</p>
                <div className="relative [&>[role='slider']]:bg-primary">
                  <Slider max={7} step={1} min={1} />
                  <div className="-z-1 absolute left-0 right-0 top-1 h-[2px] bg-primary/50" />
                </div>
                <div className="flex justify-between px-2">
                  {Array.from({ length: 7 })
                    .fill(0)
                    .map((_, index) => {
                      return <p key={'days' + index + 1}>{index + 1}</p>
                    })}
                </div>
              </div>
            </div>
          </Card>
        }
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
