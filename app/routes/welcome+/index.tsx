import { useSearchParams } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon.js'

const questions = {
  '1': {
    question: 'Care este obiectivul tău?',
    options: [
      'Să termin materia cât mai repede ca să mă focusez pe admitere',
      'Să iau notă maximă in bac',
      'Să promovez examenul cât mai ușor',
    ],
  },
  '2': {
    question: 'La ce dai bacul?',
    options: [
      'Biologie',
      'Limba Română',
      'Matematica',
      'Informatică',
      'Istorie',
      'Logică',
      'Fizică',
      'Chimie',
      'Incă nu sunt sigur/ă',
    ],
  },
  // '3': { question: 'La ce liceu ești?', options: '*Licee*' },
  '4': {
    question: 'Care este cea mai buna perioadă de învățat pentru tine?',
    options: ['Seara', 'Dimineața', 'După-masa', 'In weekend'],
  },
}

export default function WelcomeForm() {
  const [searchParams] = useSearchParams()
  const step = Number(searchParams.get('step')) ?? 1
  return (
    <div className="container flex h-screen flex-col">
      <div className="flex flex-grow overflow-hidden">
        <main className="flex-grow overflow-scroll p-5 2xl:p-9">
          <section className="flex flex-row justify-center backdrop-blur-sm">
            <div
              className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-solid border-primary bg-card px-3"
              role="img"
            >
              <Icon name={'mini-mindle'} className="h-9 w-auto" />
            </div>
          </section>
          <section className="mt-9 flex w-full flex-1 flex-col gap-9 rounded-lg border-2 border-solid border-primary/20 bg-card p-9 shadow-sm">
            <div className="flex h-full w-full flex-col">
              <section
                id="quiz-choice"
                className="flex flex-col gap-6"
              ></section>
            </div>
            <div className="flex w-full flex-row gap-9"></div>
          </section>
        </main>
      </div>
    </div>
  )
}
