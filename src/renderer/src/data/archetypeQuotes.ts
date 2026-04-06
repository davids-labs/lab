export type ArchetypeQuoteTheme =
  | 'discipline'
  | 'courage'
  | 'clarity'
  | 'patience'
  | 'duty'
  | 'resilience'

export interface ArchetypeQuote {
  id: string
  text: string
  author: string
  work: string
  theme: ArchetypeQuoteTheme
  sourceUrl: string
}

export const ARCHETYPE_QUOTES: ArchetypeQuote[] = [
  {
    id: 'marcus-humanly-possible',
    text:
      'Do not think that what is hard for you to master is humanly impossible; if it is humanly possible, it is within your reach.',
    author: 'Marcus Aurelius',
    work: 'Meditations VI.19',
    theme: 'discipline',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-good-man',
    text: 'Waste no more time arguing what a good man should be. Be one.',
    author: 'Marcus Aurelius',
    work: 'Meditations X.16',
    theme: 'duty',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-right-true',
    text: 'If it is not right, do not do it; if it is not true, do not say it.',
    author: 'Marcus Aurelius',
    work: 'Meditations XII.17',
    theme: 'clarity',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-obstacle-way',
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius',
    work: 'Meditations VI.9',
    theme: 'resilience',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-truth-change',
    text:
      'If someone can show me that I do not think or act rightly, I will gladly change, for I seek the truth.',
    author: 'Marcus Aurelius',
    work: 'Meditations VI.21',
    theme: 'clarity',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-future',
    text:
      'Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.',
    author: 'Marcus Aurelius',
    work: 'Meditations VII.8',
    theme: 'courage',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-bear',
    text: "Nothing happens to anybody which he is not fitted by nature to bear.",
    author: 'Marcus Aurelius',
    work: 'Meditations V.18',
    theme: 'courage',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'marcus-mind-strength',
    text: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    work: 'Meditations',
    theme: 'resilience',
    sourceUrl: 'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  },
  {
    id: 'epictetus-difficulties',
    text: 'It is difficulties that show what men are.',
    author: 'Epictetus',
    work: 'Discourses',
    theme: 'resilience',
    sourceUrl: 'https://en.wikiquote.org/wiki/Epictetus'
  },
  {
    id: 'epictetus-what-you-would-be',
    text: 'First say to yourself what you would be; and then do what you have to do.',
    author: 'Epictetus',
    work: 'Discourses III.23',
    theme: 'discipline',
    sourceUrl: 'https://en.wikiquote.org/wiki/Epictetus'
  },
  {
    id: 'epictetus-throw-away-conceit',
    text: 'If a man would pursue philosophy, his first task is to throw away conceit.',
    author: 'Epictetus',
    work: 'The Golden Sayings of Epictetus',
    theme: 'clarity',
    sourceUrl: 'https://www.gutenberg.org/files/871/871-h/871-h.htm'
  },
  {
    id: 'epictetus-great-things-slow',
    text: 'All great things are slow of growth.',
    author: 'Epictetus',
    work: 'The Golden Sayings of Epictetus',
    theme: 'patience',
    sourceUrl: 'https://www.gutenberg.org/files/871/871-h/871-h.htm'
  },
  {
    id: 'epictetus-principle-daily',
    text:
      'It is no easy thing for a principle to become a man’s own, unless each day he maintain it and hear it maintained, as well as work it out in life.',
    author: 'Epictetus',
    work: 'The Golden Sayings of Epictetus',
    theme: 'discipline',
    sourceUrl: 'https://www.gutenberg.org/files/871/871-h/871-h.htm'
  },
  {
    id: 'epictetus-habitual',
    text:
      'Whatever you would make habitual, practice it; and if you would not make a thing habitual, do not practice it.',
    author: 'Epictetus',
    work: 'Discourses II.18',
    theme: 'discipline',
    sourceUrl: 'https://en.wikiquote.org/wiki/Epictetus'
  },
  {
    id: 'epictetus-hurried',
    text:
      'Be not swept off your feet by the vividness of the impression, but say: Impression, wait for me a little.',
    author: 'Epictetus',
    work: 'Discourses II.18',
    theme: 'clarity',
    sourceUrl: 'https://en.wikiquote.org/wiki/Epictetus'
  },
  {
    id: 'epictetus-freedom',
    text: 'For freedom is not acquired by satisfying yourself with what you desire, but by destroying your desire.',
    author: 'Epictetus',
    work: 'Discourses IV.1',
    theme: 'duty',
    sourceUrl: 'https://en.wikiquote.org/wiki/Epictetus'
  },
  {
    id: 'seneca-adversity',
    text: 'Fire tries gold, misfortune tries brave men.',
    author: 'Seneca',
    work: 'On Providence 5.9',
    theme: 'courage',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-time-truth',
    text: 'We should always allow some time to elapse, for time discloses the truth.',
    author: 'Seneca',
    work: 'On Anger II.22',
    theme: 'clarity',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-good-mind-kingdom',
    text: 'A good mind possesses a kingdom.',
    author: 'Seneca',
    work: 'Thyestes',
    theme: 'duty',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-rule-be-ruled',
    text: 'No one is able to rule unless he is also able to be ruled.',
    author: 'Seneca',
    work: 'On Anger II.15',
    theme: 'discipline',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-weakness-cruelty',
    text: 'All cruelty springs from weakness.',
    author: 'Seneca',
    work: 'On the Happy Life',
    theme: 'clarity',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-postponing',
    text: 'While we are postponing, life speeds by.',
    author: 'Seneca',
    work: 'On the Shortness of Life',
    theme: 'patience',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-waste-time',
    text: 'It is not that we have a short time to live, but that we waste a lot of it.',
    author: 'Seneca',
    work: 'On the Shortness of Life',
    theme: 'discipline',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  },
  {
    id: 'seneca-imagination',
    text: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
    work: 'Letters from a Stoic',
    theme: 'courage',
    sourceUrl: 'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  }
]

function hashString(input: string): number {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }

  return hash
}

export function getQuoteById(id: string | null | undefined): ArchetypeQuote | null {
  if (!id) {
    return null
  }

  return ARCHETYPE_QUOTES.find((quote) => quote.id === id) ?? null
}

export function getDailyArchetypeQuote(dateKey: string): ArchetypeQuote {
  const index = hashString(`davids.lab:${dateKey}:stoic-calibration`) % ARCHETYPE_QUOTES.length
  return ARCHETYPE_QUOTES[index]
}

export function getAnotherArchetypeQuote(currentId?: string | null): ArchetypeQuote {
  const options = currentId
    ? ARCHETYPE_QUOTES.filter((quote) => quote.id !== currentId)
    : ARCHETYPE_QUOTES

  const index = Math.floor(Math.random() * options.length)
  return options[index] ?? ARCHETYPE_QUOTES[0]
}
