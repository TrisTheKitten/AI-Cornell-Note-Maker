import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

type Tone = 'standard' | 'friendly' | 'formal'
type Length = 'normal' | 'short' | 'long'

export default function NotesPage() {
  const navigate = useNavigate()
  const [context, setContext] = useState('')
  const [tone, setTone] = useState<Tone>('standard')
  const [length, setLength] = useState<Length>('normal')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{type: 'info' | 'success' | 'error'; message: string} | null>(null)
  const [generated, setGenerated] = useState('')

  const apiKey = useMemo(() => localStorage.getItem('apiKey') ?? '', [])

  useEffect(() => {
    const handler = () => setLoading(true)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  function showNotification(message: string, type: 'info' | 'success' | 'error') {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  async function generateNote() {
    if (!apiKey || !context.trim()) {
      alert('API key or context is missing. Please provide the required inputs.')
      return
    }
    setLoading(true)
    showNotification('Generating notes...', 'info')

    const toneInstructions: Record<Tone, string> = {
      standard: 'Use a neutral and professional tone.',
      friendly: 'Use a casual and friendly tone.',
      formal: 'Use a formal and academic tone.',
    }

    const lengthInstructions: Record<Length, string> = {
      normal: 'Provide detailed notes.',
      short: 'Provide concise and brief notes.',
      long: 'Provide extended and comprehensive notes.',
    }

    const formatInstructions = `
Please format the response exactly as follows:

Cues:
- [Bullet points for key topics or questions]

Notes:
- [Main topic 1]:
  - [Subtopic 1 in details]
  - [Subtopic 2 in details]
- [Main topic 2]:
  - [Subtopic 1 in details]
  - [Subtopic 2 in details]
- [Must include simplified notes of all the key-details in the original context]

Summary:
[A concise summary of the main points]
`

    const prompt = `${context}

Tone: ${toneInstructions[tone]}
Length: ${lengthInstructions[length]}

${formatInstructions}`

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            { role: 'system', content: 'You are an AI assistant that generates notes based on the given context.' },
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
      setGenerated(response.data.choices[0].message.content as string)
      showNotification('Notes generated successfully!', 'success')
    } catch (error) {
      console.error(error)
      showNotification('Error generating notes. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const { cues, notes, summary } = useMemo(() => parseCornell(generated), [generated])
  const stats = useMemo(() => computeStats(context, notes.join(' ')), [context, notes])

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
          <h1 className="text-2xl font-bold">Cornell Notes</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Paste your context here"
              className="w-full h-48 p-3 border rounded"
            />
            <div className="flex items-center gap-3">
              <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="border rounded px-3 py-2">
                <option value="standard">Standard</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
              </select>
              <select value={length} onChange={(e) => setLength(e.target.value as Length)} className="border rounded px-3 py-2">
                <option value="short">Short</option>
                <option value="normal">Normal</option>
                <option value="long">Long</option>
              </select>
              <button onClick={generateNote} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Notes'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 border rounded bg-white">
              <p><strong>Characters:</strong> {context.length} / 15,000</p>
              <p><strong>Reduced words:</strong> {stats.reducedWords}</p>
              <p><strong>Sentences:</strong> {stats.sentenceCount}</p>
              <p><strong>Read time:</strong> {stats.readTime}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1 p-4 border rounded bg-white">
            <h3 className="font-semibold mb-2">Cues</h3>
            <ul className="list-disc list-inside space-y-1">
              {cues.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2 p-4 border rounded bg-white space-y-2">
            <h3 className="font-semibold mb-2">Notes</h3>
            {notes.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded bg-white">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p>{summary}</p>
        </div>
      </div>
    </div>
  )
}

function parseCornell(text: string) {
  const cues: string[] = []
  const notes: string[] = []
  let summary = ''
  let section: 'cues' | 'notes' | 'summary' | '' = ''

  text.split('\n').forEach((raw) => {
    const line = raw.trimEnd()
    if (!line.trim()) return
    if (line.startsWith('Cues:')) {
      section = 'cues'
      return
    }
    if (line.startsWith('Notes:')) {
      section = 'notes'
      return
    }
    if (line.startsWith('Summary:')) {
      section = 'summary'
      return
    }

    if (section === 'cues' && line.startsWith('- ')) {
      cues.push(line.slice(2))
    } else if (section === 'notes') {
      notes.push(line.replace(/^\-\s*/, ''))
    } else if (section === 'summary') {
      summary += (summary ? ' ' : '') + line
    }
  })

  return { cues, notes, summary }
}

function computeStats(original: string, output: string) {
  const originalWords = original.trim() ? original.trim().split(/\s+/).length : 0
  const outputWords = output.trim() ? output.trim().split(/\s+/).length : 0
  const reducedWords = Math.max(0, originalWords - outputWords)
  const sentenceCount = output.trim() ? (output.trim().split(/[.!?]+/).length - 1) : 0
  const averageReadingPace = 200
  const readTimeMinutes = Math.ceil(outputWords / averageReadingPace)
  const readTime = `${String(readTimeMinutes).padStart(2, '0')}:00`
  return { reducedWords, sentenceCount, readTime }
}