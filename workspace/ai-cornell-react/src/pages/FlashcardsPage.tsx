import { useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

type Difficulty = 'easy' | 'normal' | 'hard'
type Tonality = 'casual' | 'standard' | 'academic'

type Card = { front: string; back: string }

export default function FlashcardsPage() {
  const navigate = useNavigate()
  const [context, setContext] = useState('')
  const [numCards, setNumCards] = useState(8)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [tonality, setTonality] = useState<Tonality>('standard')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{type: 'info' | 'success' | 'error'; message: string} | null>(null)
  const [cards, setCards] = useState<Card[]>([])

  const apiKey = useMemo(() => localStorage.getItem('apiKey') ?? '', [])

  function showNotification(message: string, type: 'info' | 'success' | 'error') {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  async function generateFlashcards() {
    if (!apiKey || !context.trim()) {
      alert('API key or context is missing. Please provide the required inputs.')
      return
    }
    setLoading(true)
    showNotification('Generating flashcards...', 'info')

    const difficultyInstructions: Record<Difficulty, string> = {
      easy: 'simple and straightforward',
      normal: 'moderate difficulty',
      hard: 'challenging and thought-provoking',
    }

    const tonalityInstructions: Record<Tonality, string> = {
      casual: 'casual and friendly tone',
      standard: 'neutral and professional tone',
      academic: 'formal and academic tone',
    }

    const prompt = `${context}
Generate ${numCards} flashcards based on the provided context. The flashcards should be of ${difficultyInstructions[difficulty]} and have a ${tonalityInstructions[tonality]}. Format the output as follows:

  Front: [Question text]
  Back: [Answer text(Answer should be the key point of the question, include only main points, and be concise)]`

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            { role: 'system', content: 'You are an AI assistant that generates flashcards based on the given context.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 4000,
          n: 1,
          stop: null,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )

      const text = (response.data.choices[0].message.content as string).trim()
      const parsed = parseCards(text)
      setCards(parsed)
      showNotification('Flashcards generated successfully!', 'success')
    } catch (error) {
      console.error(error)
      showNotification('Error generating flashcards. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className={`fixed top-0 left-0 right-0 p-3 text-white text-center ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 border rounded" onClick={() => navigate('/')}>Back</button>
          <h1 className="text-2xl font-bold">Flashcards</h1>
        </div>

        <div className="space-y-3">
          <textarea value={context} onChange={(e) => setContext(e.target.value)} className="w-full h-40 p-3 border rounded" placeholder="Paste your context here" />
          <div className="flex flex-wrap gap-3">
            <input type="number" min={1} max={50} value={numCards} onChange={(e) => setNumCards(Number(e.target.value))} className="w-28 px-3 py-2 border rounded" />
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="px-3 py-2 border rounded">
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
            <select value={tonality} onChange={(e) => setTonality(e.target.value as Tonality)} className="px-3 py-2 border rounded">
              <option value="casual">Casual</option>
              <option value="standard">Standard</option>
              <option value="academic">Academic</option>
            </select>
            <button onClick={generateFlashcards} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Generating...' : 'Generate Flashcards'}</button>
          </div>
        </div>

        {cards.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <FlipCard key={i} front={c.front} back={c.back} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function parseCards(text: string): Card[] {
  const pairs = text.split('\n\n').map((p) => p.trim()).filter(Boolean)
  const cards: Card[] = []
  for (const pair of pairs) {
    const [frontLine, backLine] = pair.split('\n')
    if (!frontLine || !backLine) continue
    const front = frontLine.replace(/^Front:\s*/i, '')
    const back = backLine.replace(/^Back:\s*/i, '')
    cards.push({ front, back })
  }
  return cards
}

function FlipCard({ front, back }: Card) {
  const [flipped, setFlipped] = useState(false)
  return (
    <button onClick={() => setFlipped((f) => !f)} className="relative w-full h-40 [perspective:1000px]">
      <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="absolute inset-0 bg-white border rounded shadow-sm p-3 [backface-visibility:hidden] flex items-center justify-center text-center">
          {front}
        </div>
        <div className="absolute inset-0 bg-gray-100 border rounded shadow-sm p-3 [transform:rotateY(180deg)] [backface-visibility:hidden] flex items-center justify-center text-center">
          {back}
        </div>
      </div>
    </button>
  )
}