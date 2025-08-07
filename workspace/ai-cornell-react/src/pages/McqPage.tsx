import { useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

type Difficulty = 'easy' | 'normal' | 'hard'
type Tonality = 'casual' | 'standard' | 'academic'

export default function McqPage() {
  const navigate = useNavigate()
  const [context, setContext] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [tonality, setTonality] = useState<Tonality>('standard')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{type: 'info' | 'success' | 'error'; message: string} | null>(null)
  const [mcqText, setMcqText] = useState('')
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})

  const apiKey = useMemo(() => localStorage.getItem('apiKey') ?? '', [])

  function showNotification(message: string, type: 'info' | 'success' | 'error') {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  async function generateMCQs() {
    if (!apiKey || !context.trim()) {
      alert('API key or context is missing. Please provide the required inputs.')
      return
    }
    setLoading(true)
    showNotification('Generating MCQs...', 'info')

    const difficultyInstructions: Record<Difficulty, string> = {
      easy: 'The questions should be simple and straightforward.',
      normal: 'The questions should be of moderate difficulty.',
      hard: 'The questions should be challenging and thought-provoking.',
    }

    const tonalityInstructions: Record<Tonality, string> = {
      casual: 'Please use a casual and friendly tone.',
      standard: 'Please use a neutral and professional tone.',
      academic: 'Please use a formal and academic tone.',
    }

    const prompt = `${context}

Generate ${numQuestions} multiple choice questions based on the given context. The questions should be ${difficultyInstructions[difficulty]} and have a ${tonalityInstructions[tonality]}. Each question should have exactly 4 options labeled A, B, C, and D, with one correct answer. Format the output as follows:
Question 1: [Question text]
A. [Option 1]
B. [Option 2]
C. [Option 3]
D. [Option 4]
Correct answer: [Correct option letter]
Repeat this format for all questions.`

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            { role: 'system', content: 'You are an AI assistant that generates multiple choice questions based on the given context.' },
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
      setMcqText(text)
      const parsed = parseMCQs(text)
      setCorrectAnswers(parsed.correctAnswers)
      showNotification('MCQs generated successfully!', 'success')
    } catch (error) {
      console.error(error)
      showNotification('Error generating MCQs. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const questions = useMemo(() => parseMCQs(mcqText).questions, [mcqText])

  function handleSubmit() {
    showNotification('Answers evaluated.', 'success')
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
          <h1 className="text-2xl font-bold">MCQ Generator</h1>
        </div>

        <div className="space-y-3">
          <textarea value={context} onChange={(e) => setContext(e.target.value)} className="w-full h-40 p-3 border rounded" placeholder="Paste your context here" />
          <div className="flex flex-wrap gap-3">
            <input type="number" min={1} max={20} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-28 px-3 py-2 border rounded" />
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
            <button onClick={generateMCQs} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Generating...' : 'Generate MCQs'}</button>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {questions.map((q, qi) => (
                <div key={qi} className="p-4 border rounded bg-white">
                  <p className="font-semibold mb-2">{q.question}</p>
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        value={opt.letter}
                        onChange={(e) => setUserAnswers((a) => ({ ...a, [qi]: e.target.value }))}
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              ))}
              <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
            </div>

            <div className="space-y-2">
              {questions.map((q, i) => {
                const ua = userAnswers[i] ?? 'None'
                const ca = correctAnswers[i]
                const correct = ua === ca
                return (
                  <div key={i} className={`p-3 border rounded ${correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <p className="font-semibold">Question {i + 1}</p>
                    <p>Your Answer: {ua}</p>
                    <p>Correct Answer: {ca}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function parseMCQs(text: string) {
  const blocks = text.split('\n\n').map((b) => b.trim()).filter(Boolean)
  const questions: { question: string; options: { letter: string; text: string }[] }[] = []
  const correctAnswers: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (!lines.length) continue
    const question = lines[0]
    const optionsLines = lines.slice(1, lines.length - 1)
    const answerLine = lines[lines.length - 1]
    const match = answerLine.match(/Correct answer:\s*([A-D])/i)
    if (!match) continue
    const correct = match[1].toUpperCase()
    correctAnswers.push(correct)
    const options = optionsLines.map((l) => ({
      letter: (l.slice(0, 1).toUpperCase()),
      text: l.replace(/^[A-D]\.\s*/, ''),
    }))
    questions.push({ question, options })
  }

  return { questions, correctAnswers }
}