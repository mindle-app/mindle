import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Form, Link, redirect } from '@remix-run/react'
import Autoplay from 'embla-carousel-autoplay'
import { motion, useInView } from 'framer-motion'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { SweatyBrain } from '#app/components/illustrations/sweaty-brain.js'
import { makeMediaQueryStore } from '#app/components/media-query.js'
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
import { Input } from '#app/components/ui/input.js'
import { LinkButton } from '#app/components/ui/link-button.js'
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

type JoinSliderFieldProps = {
  onValueChange?: (value: string) => void
  ignoreMin?: boolean
}

const useIsWide = makeMediaQueryStore('(min-width: 640px)', true)

const JoinSliderField = ({
  onValueChange,
  ignoreMin,
}: JoinSliderFieldProps) => {
  const [minutesPerDay, setMinutesPerDay] = useState(60)
  const [days, setDays] = useState(3)
  const totalTimeNeeded = 6000 //in minutes
  const totalTimePerWeek = minutesPerDay * days
  const daysNeeded = Math.ceil(totalTimeNeeded / totalTimePerWeek)
  const isWide = useIsWide()

  useEffect(() => {
    if (minutesPerDay !== -1) {
      return
    }
    if (days !== -1) {
      return
    }
    onValueChange?.(`${minutesPerDay}|${days * 30}`)
  }, [minutesPerDay, onValueChange, days])

  return (
    <>
      <div className="h-full">
        <div className="mb-10">
          <label htmlFor="days" className="block text-xl font-medium">
            {ignoreMin ? '' : '1.'} Câte zile pe săptămână vrei să înveți?
            <input
              type="range"
              id="days"
              name="days"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-primary/20 accent-primary"
            />
          </label>

          <div className="mt-2 flex justify-between text-sm font-medium">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
          </div>
        </div>
        <div className="mb-10">
          <label htmlFor="minutes" className="block text-xl font-medium">
            {ignoreMin ? '' : '2.'} Câte minute pe zi vrei să înveți?
            <input
              type="range"
              id="minutes"
              name="minutes"
              min={30}
              max={240}
              step={30}
              value={minutesPerDay}
              onChange={(e) => setMinutesPerDay(Number(e.target.value))}
              className="mt-4 h-1 w-full cursor-pointer appearance-none rounded-lg bg-primary/20 accent-primary"
            />
          </label>

          <div className="mt-2 flex justify-between text-sm font-medium">
            <span>30 {isWide ? 'min' : ''}</span>
            <span>60 {isWide ? 'min' : ''}</span>
            <span>90 {isWide ? 'min' : ''}</span>
            <span>120 {isWide ? 'min' : ''}</span>
            <span>150 {isWide ? 'min' : ''}</span>
            <span>180 {isWide ? 'min' : ''}</span>
            <span>210 {isWide ? 'min' : ''}</span>
            <span>240 {isWide ? 'min' : ''}</span>
          </div>
        </div>
        {days < 0 || minutesPerDay < 0 ? (
          <></>
        ) : (
          <div className="text-center">
            <span className="text-xl font-medium">
              Vei termina de invatat in{' '}
            </span>
            <span className="text-xl font-medium text-primary">
              {daysNeeded} zile
            </span>
          </div>
        )}
        <div className="mt-8 flex w-full justify-center">
          <LinkButton
            buttonProps={{ variant: 'default', size: 'wide' }}
            to={'/welcome'}
          >
            Creează-ți cont
          </LinkButton>
        </div>
      </div>
    </>
  )
}

export const meta: MetaFunction = () => [
  { title: 'Mindle' },
  { name: 'description', content: 'Study budy-ul tău pentru bac' },
]

function Hero() {
  return (
    <div className="relative flex w-full flex-col justify-center overflow-hidden bg-repeat py-8 text-primary-foreground md:flex-row md:justify-between md:py-12">
      <div className="flex text-center md:container">
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <div className="flex w-full flex-1 flex-col gap-4 text-center md:justify-center lg:text-start">
            <h2 className="animate-slide-left font-poppinsLight text-lg [animation-delay:0s] [animation-fill-mode:backwards]">
              Heya! Eu sunt Mindle! 👋
            </h2>

            <h1 className="animate-slide-left font-coHeadlineBold text-4xl [animation-delay:0.2s] [animation-fill-mode:backwards] sm:text-5xl">
              Invață ușor și structurat pentru bac
            </h1>
            <div className="w-full animate-slide-left [animation-delay:0.4s] [animation-fill-mode:backwards] lg:mt-8 xl:pr-64">
              <Button variant={'secondary'} size={'wide'} asChild>
                <Link to={'/welcome'}>Alătură-te lui Mindle</Link>
              </Button>
            </div>
          </div>
          <img
            src={'/img/mindle-hero-screenshot.png'}
            className="border-1 max-w-xs animate-slide-left rounded rounded-xl object-center [animation-delay:0.4s] [animation-fill-mode:backwards] sm:max-w-sm md:max-w-lg lg:w-[564px] lg:max-w-xl xl:max-w-2xl"
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

// Used to prevent hydration errors when what is rendered on server
// differs from what is initially rendered on the client
function ClientOnly({ children }: { children: ReactNode }) {
  // There is a hydration error when we try
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    setShouldRender(true)
  }, [])

  return shouldRender ? children : null
}

function SlideIn({
  children,
  direction = 'left',
  className,
}: {
  children: ReactNode
  direction?: 'left' | 'right' | 'top'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const isRight = direction === 'right'
  const isTop = direction === 'top'
  return (
    <motion.div
      ref={ref}
      initial={
        isTop ? { opacity: 0, y: 100 } : { opacity: 0, x: isRight ? -100 : 100 }
      }
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : isTop
            ? { opacity: 0, y: 100 }
            : { opacity: 0, x: isRight ? -100 : 100 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function FeatureCard({
  text,
  icon,
  picture,
  index,
}: {
  text: string
  icon: IconName
  picture: string
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const isOdd = index % 2 !== 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isOdd ? -100 : 100 }}
      animate={
        isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isOdd ? -100 : 100 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
      key={`feature-${text}`}
      className={cn(
        'flex flex-col items-center gap-10 md:p-10 lg:flex-row',
        {},
      )}
    >
      <div>
        <Card className="flex max-w-xs flex-col items-center justify-center gap-6 rounded-xl py-6 md:px-6">
          <Icon name={icon as IconName} className="h-12 w-12" />
          <p className="text-center font-coHeadline text-lg">{text}</p>
        </Card>
      </div>
      <img
        src={picture}
        className={cn(
          'max-w-xs rounded-xl sm:max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-2xl',
          {
            'lg:-order-1': index % 2 !== 0,
          },
        )}
      />
    </motion.div>
  )
}

const problems: { text: ReactNode; icon: IconName }[] = [
  {
    text: (
      <p>
        Materia e <span className="text-primary">stufoasă</span> și{' '}
        <span className="text-primary">greu de invățat</span>
      </p>
    ),
    icon: 'book-open-text',
  },
  {
    icon: 'stop-watch-check-lines',
    text: (
      <p>
        <span className="text-primary">Puțin timp</span> disponibil{' '}
        <span className="text-primary">de învățat</span>
      </p>
    ),
  },
  {
    icon: 'man-question',
    text: (
      <p>
        Lecțiile învățate se{' '}
        <span className="text-primary">uită foarte repede</span>
      </p>
    ),
  },
]

export default function Index() {
  return (
    <div className="grid h-full w-full font-poppins">
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
      <section className="container mt-5 w-full md:p-9">
        <div className="flex animate-slide-top flex-wrap justify-evenly gap-6 rounded-xl border bg-card py-8 [animation-delay:0.6s] [animation-fill-mode:backwards]">
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
      <SlideIn direction="top">
        <section className="container mt-5 w-full">
          <div className="flex w-full flex-col items-center justify-center rounded-xl border bg-card p-4 text-center md:p-12">
            <p className="text-4xl italic">
              Ce spun elevii care au invățat cu Mindle
            </p>
            <ClientOnly>
              <TestimonialCarousel />
            </ClientOnly>
          </div>
        </section>
      </SlideIn>
      <SlideIn direction={'top'} className="container">
        <section className="flex flex-col items-center justify-center gap-3 pt-16">
          <SweatyBrain />

          <p className="text-center font-coHeadlineBold text-3xl lg:text-4xl">
            Învățatul din manual a fost întotdeauna dificil
          </p>
          <div className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row lg:p-8">
            <div className="flex gap-3 md:p-8">
              {problems.map((p) => (
                <Card
                  key={`${p.icon}-problem`}
                  className="flex max-w-[10rem] flex-col flex-wrap items-center justify-center gap-8 p-2 text-center"
                >
                  <Icon name={p.icon} className="h-12 w-12 text-primary" />
                  {p.text}
                </Card>
              ))}
            </div>
            <div className="-order-1 flex justify-center gap-3 md:order-1">
              <img
                className="max-w-[12rem] rounded-xl"
                src={'/img/problems/manual-page-1.png'}
              />
              <img
                className="hidden max-w-[12rem] rounded-xl lg:block"
                src={'/img/problems/manual-page-2.png'}
              />
            </div>
          </div>
        </section>
      </SlideIn>
      <LandingSection
        icon="mindle-head"
        title="Sunt aici sa te ajut:"
        body={
          <Card className="mt-8 flex w-full flex-col items-center justify-center gap-6 p-2 sm:p-4 md:p-8">
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
            ].map(({ text, picture, icon }, index) => (
              <FeatureCard
                key={text}
                text={text}
                picture={picture}
                icon={icon as IconName}
                index={index}
              />
            ))}
          </Card>
        }
      />
      <section className="container mt-12 flex">
        <div className="flex w-full flex-col justify-center gap-3 rounded-xl border bg-card py-2 text-center md:p-8">
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
          <Card className="w-full p-6">
            <JoinSliderField />
          </Card>
        }
      />
      <section className="container mt-16">
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute -z-20 h-full w-full bg-primary" />
          <div
            className="absolute -z-10 h-[25vh] w-full bg-origin-content opacity-15"
            style={{ backgroundImage: 'url(/img/pattern-brand-elements.svg)' }}
          />
          <div className="z-auto flex flex-col gap-y-8 p-8 py-14 md:flex-row">
            <div className="w-full text-center text-primary-foreground md:text-left">
              <h2 className="text-4xl">Abonează-te la newsletter</h2>
              <ul className="list-disc pl-8 pt-8 text-xl text-primary-foreground">
                <li>tips & tricks despre cum să înveți</li>
                <li>noutăți despre materia și strictura anului școlar</li>
              </ul>
            </div>
            <div className="flex w-full items-center gap-2">
              <Form className="w-full" method="POST">
                <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-card px-4 py-2">
                  <Input
                    autoComplete="email"
                    name={'email'}
                    type="email"
                    className="border-none"
                    placeholder="exemplu@email.ro"
                  />
                  <Button type={'submit'}>Subscribe</Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
