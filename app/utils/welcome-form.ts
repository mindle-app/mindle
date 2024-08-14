import { z } from 'zod'

export const stepSchema = z.enum(['1', '2', '3', '4', '5'])
export type WelcomeFormStep = z.infer<typeof stepSchema>

export function getStep(sp: URLSearchParams) {
  const step = stepSchema.safeParse(sp.get('step'))
  if (step.success) {
    return step.data
  }
  return '1'
}

export type WelcomeFormQuestion =
  | {
      type: 'single' | 'multi'
      question: string
      options: { text: string; icon?: string }[]
    }
  | { question: string; type: 'search'; loaderKey: 'highschools' }
  | { type: 'benefits'; question: string }

const q1Options = z.enum([
  'Să termin materia cât mai repede ca să mă focusez pe admitere',
  'Să iau notă maximă in bac',
  'Să promovez examenul cât mai ușor',
])

const q2Options = z.enum([
  'Limba și literatura română',
  'Matematica M1',
  'Matematica M2',
  'Fizică',
  'Chimie',
  'Biologie',
  'Informatică',
  'Geografie',
  'Logică și argumentare',
  'Psihologie',
  'Economie',
  'Sociologie',
  'Filosofie',
  'Încă nu sunt sigur/ă',
])

const q4Options = z.enum(['Seara', 'Dimineața', 'După-masa', 'In weekend'])

export const questions = {
  '1': {
    question: 'Care este obiectivul tău?',
    options: [
      {
        text: 'Să termin materia cât mai repede ca să mă focusez pe admitere',
        icon: '🏃‍♂️',
      },
      { text: 'Să iau notă maximă in bac', icon: '🏆' },
      { text: 'Să promovez examenul cât mai ușor', icon: '🎓' },
    ],
    type: 'single',
  },
  '2': {
    question: 'La ce dai bacul?',
    type: 'multi',
    options: [
      { icon: '📖', text: 'Limba și literatura română' },
      { icon: '➕', text: 'Matematica M1' },
      { icon: '➖', text: 'Matematica M2' },
      { icon: '⚛️', text: 'Fizică' },
      { icon: '🧪', text: 'Chimie' },
      { icon: '🧬', text: 'Biologie' },
      { icon: '💻', text: 'Informatică' },
      { icon: '🌍', text: 'Geografie' },
      { icon: '⁉️️', text: 'Logică și argumentare' },
      { icon: '🧠', text: 'Psihologie' },
      { icon: '💰', text: 'Economie' },
      { icon: '🏢', text: 'Sociologie' },
      { icon: '📚', text: 'Filosofie' },
      { icon: '🤔', text: 'Încă nu sunt sigur/ă' },
    ],
  },
  '3': {
    question: 'La ce liceu ești?',
    type: 'search',
    loaderKey: 'highschools',
  },
  '4': {
    question: 'Care este cea mai buna perioadă de învățat pentru tine?',
    options: [
      { icon: '🌙', text: 'Seara' },
      { icon: '🌅', text: 'Dimineața' },
      { icon: '🌞', text: 'După-masa' },
      { icon: '📆', text: 'In weekend' },
    ],
    type: 'single',
  },
  '5': { type: 'benefits', question: 'Sunt aici ca să te ajut!' },
} satisfies Record<WelcomeFormStep, WelcomeFormQuestion>

export const FormAnswersSchema = z.object({
  motivation: q1Options,
  examSubjects: z.string().transform((data) => {
    const parsed = JSON.parse(data)
    const res = z.array(q2Options).safeParse(parsed)
    if (res.success) {
      return res.data
    } else {
      return []
    }
  }),
  highSchoolId: z.string(),
  bestLearningTime: q4Options,
})

export type FormAnswers = z.infer<typeof FormAnswersSchema>
export type FormAnswersInput = z.input<typeof FormAnswersSchema>
export type Motivation = z.infer<typeof q1Options>
export type LearningTIme = z.infer<typeof q4Options>
