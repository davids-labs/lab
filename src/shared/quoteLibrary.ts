export type ArchetypeQuoteSourceType = 'builtin' | 'custom'

export type QuoteSortMode = 'topic' | 'author' | 'recent'

export interface ArchetypeQuote {
  id: string
  text: string
  author: string
  work: string | null
  topics: string[]
  source_url: string | null
  source_type: ArchetypeQuoteSourceType
  created_at: number
  updated_at: number
}

export interface QuotePreferences {
  smart_rotation: boolean
  selected_topics: string[]
  sort_mode: QuoteSortMode
}

export interface QuoteImportRecord {
  text: string
  author: string
  work?: string | null
  topics?: string[] | string | null
  source_url?: string | null
}

const BUILTIN_QUOTE_TIMESTAMP = Date.UTC(2026, 3, 6)

function createBuiltinQuote(
  id: string,
  text: string,
  author: string,
  work: string | null,
  topics: string[],
  sourceUrl: string
): ArchetypeQuote {
  return {
    id,
    text,
    author,
    work,
    topics: normalizeQuoteTopics(topics),
    source_url: sourceUrl,
    source_type: 'builtin',
    created_at: BUILTIN_QUOTE_TIMESTAMP,
    updated_at: BUILTIN_QUOTE_TIMESTAMP
  }
}

export const BUILTIN_ARCHETYPE_QUOTES: ArchetypeQuote[] = [
  createBuiltinQuote(
    'marcus-humanly-possible',
    'Do not think that what is hard for you to master is humanly impossible; if it is humanly possible, it is within your reach.',
    'Marcus Aurelius',
    'Meditations VI.19',
    ['discipline', 'self-improvement'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-good-man',
    'Waste no more time arguing what a good man should be. Be one.',
    'Marcus Aurelius',
    'Meditations X.16',
    ['duty', 'discipline'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-right-true',
    'If it is not right, do not do it; if it is not true, do not say it.',
    'Marcus Aurelius',
    'Meditations XII.17',
    ['clarity', 'integrity'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-obstacle-way',
    'The impediment to action advances action. What stands in the way becomes the way.',
    'Marcus Aurelius',
    'Meditations VI.9',
    ['resilience', 'courage'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-truth-change',
    'If someone can show me that I do not think or act rightly, I will gladly change, for I seek the truth.',
    'Marcus Aurelius',
    'Meditations VI.21',
    ['clarity', 'humility'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-future',
    'Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.',
    'Marcus Aurelius',
    'Meditations VII.8',
    ['courage', 'resilience'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-bear',
    'Nothing happens to anybody which he is not fitted by nature to bear.',
    'Marcus Aurelius',
    'Meditations V.18',
    ['courage', 'resilience'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'marcus-mind-strength',
    'You have power over your mind, not outside events. Realize this, and you will find strength.',
    'Marcus Aurelius',
    'Meditations',
    ['clarity', 'resilience'],
    'https://en.wikiquote.org/wiki/Marcus_Aurelius'
  ),
  createBuiltinQuote(
    'epictetus-difficulties',
    'It is difficulties that show what men are.',
    'Epictetus',
    'Discourses',
    ['resilience', 'courage'],
    'https://en.wikiquote.org/wiki/Epictetus'
  ),
  createBuiltinQuote(
    'epictetus-what-you-would-be',
    'First say to yourself what you would be; and then do what you have to do.',
    'Epictetus',
    'Discourses III.23',
    ['discipline', 'clarity'],
    'https://en.wikiquote.org/wiki/Epictetus'
  ),
  createBuiltinQuote(
    'epictetus-throw-away-conceit',
    'If a man would pursue philosophy, his first task is to throw away conceit.',
    'Epictetus',
    'The Golden Sayings of Epictetus',
    ['clarity', 'humility'],
    'https://www.gutenberg.org/files/871/871-h/871-h.htm'
  ),
  createBuiltinQuote(
    'epictetus-great-things-slow',
    'All great things are slow of growth.',
    'Epictetus',
    'The Golden Sayings of Epictetus',
    ['patience', 'discipline'],
    'https://www.gutenberg.org/files/871/871-h/871-h.htm'
  ),
  createBuiltinQuote(
    'epictetus-principle-daily',
    'It is no easy thing for a principle to become a man’s own, unless each day he maintain it and hear it maintained, as well as work it out in life.',
    'Epictetus',
    'The Golden Sayings of Epictetus',
    ['discipline', 'duty'],
    'https://www.gutenberg.org/files/871/871-h/871-h.htm'
  ),
  createBuiltinQuote(
    'epictetus-habitual',
    'Whatever you would make habitual, practice it; and if you would not make a thing habitual, do not practice it.',
    'Epictetus',
    'Discourses II.18',
    ['discipline', 'self-improvement'],
    'https://en.wikiquote.org/wiki/Epictetus'
  ),
  createBuiltinQuote(
    'epictetus-hurried',
    'Be not swept off your feet by the vividness of the impression, but say: Impression, wait for me a little.',
    'Epictetus',
    'Discourses II.18',
    ['clarity', 'patience'],
    'https://en.wikiquote.org/wiki/Epictetus'
  ),
  createBuiltinQuote(
    'epictetus-freedom',
    'For freedom is not acquired by satisfying yourself with what you desire, but by destroying your desire.',
    'Epictetus',
    'Discourses IV.1',
    ['duty', 'temperance'],
    'https://en.wikiquote.org/wiki/Epictetus'
  ),
  createBuiltinQuote(
    'seneca-adversity',
    'Fire tries gold, misfortune tries brave men.',
    'Seneca',
    'On Providence 5.9',
    ['courage', 'resilience'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-time-truth',
    'We should always allow some time to elapse, for time discloses the truth.',
    'Seneca',
    'On Anger II.22',
    ['clarity', 'patience'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-good-mind-kingdom',
    'A good mind possesses a kingdom.',
    'Seneca',
    'Thyestes',
    ['duty', 'resilience'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-rule-be-ruled',
    'No one is able to rule unless he is also able to be ruled.',
    'Seneca',
    'On Anger II.15',
    ['discipline', 'humility'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-weakness-cruelty',
    'All cruelty springs from weakness.',
    'Seneca',
    'On the Happy Life',
    ['clarity', 'temperance'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-postponing',
    'While we are postponing, life speeds by.',
    'Seneca',
    'On the Shortness of Life',
    ['discipline', 'time'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-waste-time',
    'It is not that we have a short time to live, but that we waste a lot of it.',
    'Seneca',
    'On the Shortness of Life',
    ['discipline', 'time'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  ),
  createBuiltinQuote(
    'seneca-imagination',
    'We suffer more often in imagination than in reality.',
    'Seneca',
    'Letters from a Stoic',
    ['courage', 'clarity'],
    'https://en.wikiquote.org/wiki/Lucius_Annaeus_Seneca'
  )
]

export function normalizeQuoteTopic(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function normalizeQuoteTopics(value: string[] | string | null | undefined): string[] {
  const rawTopics = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return Array.from(
    new Set(rawTopics.map((entry) => normalizeQuoteTopic(entry)).filter(Boolean))
  )
}

export function formatQuoteTopicLabel(topic: string): string {
  return topic
    .split(' ')
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function getAllQuoteTopics(quotes: ArchetypeQuote[]): string[] {
  return Array.from(new Set(quotes.flatMap((quote) => quote.topics))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function hashString(input: string): number {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }

  return hash
}

export function filterQuotesByTopics(quotes: ArchetypeQuote[], topics: string[]): ArchetypeQuote[] {
  const normalizedTopics = normalizeQuoteTopics(topics)

  if (normalizedTopics.length === 0) {
    return quotes
  }

  return quotes.filter((quote) => quote.topics.some((topic) => normalizedTopics.includes(topic)))
}

export function sortQuotes(quotes: ArchetypeQuote[], mode: QuoteSortMode): ArchetypeQuote[] {
  const next = [...quotes]

  if (mode === 'recent') {
    return next.sort((left, right) => {
      const updatedDelta = right.updated_at - left.updated_at
      return updatedDelta !== 0 ? updatedDelta : left.author.localeCompare(right.author)
    })
  }

  if (mode === 'author') {
    return next.sort((left, right) => {
      const authorDelta = left.author.localeCompare(right.author)
      if (authorDelta !== 0) {
        return authorDelta
      }

      return (left.work ?? '').localeCompare(right.work ?? '')
    })
  }

  return next.sort((left, right) => {
    const topicDelta = (left.topics[0] ?? '').localeCompare(right.topics[0] ?? '')
    if (topicDelta !== 0) {
      return topicDelta
    }

    const authorDelta = left.author.localeCompare(right.author)
    if (authorDelta !== 0) {
      return authorDelta
    }

    return left.text.localeCompare(right.text)
  })
}

export function getQuoteById(
  quotes: ArchetypeQuote[],
  id: string | null | undefined
): ArchetypeQuote | null {
  if (!id) {
    return null
  }

  return quotes.find((quote) => quote.id === id) ?? null
}

export function getDailyQuoteFromPool(
  quotes: ArchetypeQuote[],
  dateKey: string,
  salt = 'default'
): ArchetypeQuote {
  const source = quotes.length > 0 ? quotes : BUILTIN_ARCHETYPE_QUOTES
  const index = hashString(`davids.lab:${dateKey}:${salt}`) % source.length
  return source[index]
}

export function getRandomQuoteFromPool(
  quotes: ArchetypeQuote[],
  currentId?: string | null
): ArchetypeQuote {
  const source = quotes.length > 0 ? quotes : BUILTIN_ARCHETYPE_QUOTES
  const options = currentId ? source.filter((quote) => quote.id !== currentId) : source
  const index = Math.floor(Math.random() * options.length)
  return options[index] ?? source[0]
}

export function parseQuoteImportJson(rawText: string): QuoteImportRecord[] {
  const parsed = JSON.parse(rawText) as unknown
  const records = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { quotes?: unknown }).quotes)
      ? ((parsed as { quotes: unknown[] }).quotes ?? [])
      : null

  if (!records) {
    throw new Error('Quote import JSON must be an array or an object with a "quotes" array.')
  }

  return records.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Quote ${index + 1} is not an object.`)
    }

    const record = entry as Record<string, unknown>
    const text = typeof record.text === 'string' ? record.text.trim() : ''
    const author = typeof record.author === 'string' ? record.author.trim() : ''

    if (!text || !author) {
      throw new Error(`Quote ${index + 1} must include both text and author.`)
    }

    return {
      text,
      author,
      work: typeof record.work === 'string' ? record.work.trim() : null,
      topics:
        Array.isArray(record.topics) || typeof record.topics === 'string'
          ? (record.topics as string[] | string)
          : null,
      source_url: typeof record.source_url === 'string' ? record.source_url.trim() : null
    }
  })
}
