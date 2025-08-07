import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') ?? '')
  const [output, setOutput] = useState<'cornell-notes' | 'mcq' | 'flashcards' | 'mindmap'>('cornell-notes')
  const navigate = useNavigate()

  function handleGenerate() {
    if (!apiKey.trim()) {
      alert('Please provide the API key.')
      return
    }
    localStorage.setItem('apiKey', apiKey.trim())
    if (output === 'cornell-notes') navigate('/notes')
    if (output === 'mcq') navigate('/mcq')
    if (output === 'flashcards') navigate('/flashcards')
    if (output === 'mindmap') navigate('/mindmap')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Developed by Tris</h1>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">AI Helper</h2>
          <Link to="https://ai-cornell-note-maker.vercel.app" className="text-sm text-blue-600 underline" target="_blank" rel="noreferrer">Live App</Link>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="api-key" className="block mb-2 font-semibold">GPT4o Mini API Key:</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="sk-..."
            />
          </div>

          <div>
            <p className="mb-2 font-semibold">Select Output Type:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'cornell-notes', label: 'Cornell Notes' },
                { value: 'mcq', label: 'MCQ Questions' },
                { value: 'flashcards', label: 'Flashcards' },
                { value: 'mindmap', label: 'Mindmap' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 p-3 border rounded-md cursor-pointer bg-white">
                  <input
                    type="radio"
                    name="output-type"
                    value={opt.value}
                    checked={output === (opt.value as any)}
                    onChange={() => setOutput(opt.value as any)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded-md">Generate</button>
          </div>
        </div>
      </div>
    </div>
  )
}
