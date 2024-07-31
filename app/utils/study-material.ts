import { z } from 'zod'

export const StudyMaterialTypeSchema = z.enum([
  'LITERARY_WORK',
  'MATH_CONCEPT',
  'PROGRAMMING_TOPIC',
])

export type StudyMaterialType = z.infer<typeof StudyMaterialTypeSchema>

export const StudyMaterialTypes: StudyMaterialType[] = [
  'LITERARY_WORK',
  'MATH_CONCEPT',
  'PROGRAMMING_TOPIC',
]
