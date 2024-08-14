import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '#app/utils/misc.js'
import { Card } from '../ui/card'
import { Icon } from '../ui/icon'
import { type IconName } from '@/icon-name'

export function FeatureCard({
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

export function FeatureSection() {
  return (
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
  )
}
