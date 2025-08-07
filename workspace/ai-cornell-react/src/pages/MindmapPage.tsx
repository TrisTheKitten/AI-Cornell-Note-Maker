import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { DataSet, Network } from 'vis-network/standalone'
import type { Node, Edge } from 'vis-network'

type MindmapNode = {
  id: number
  label: string
  level: number
  parent?: number
}

export default function MindmapPage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{type: 'info' | 'success' | 'error'; message: string} | null>(null)
  const [nodesData, setNodesData] = useState<MindmapNode[]>([])

  const apiKey = useMemo(() => localStorage.getItem('apiKey') ?? '', [])

  function showNotification(message: string, type: 'info' | 'success' | 'error') {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  async function generateMindmap() {
    if (!apiKey || !context.trim()) {
      alert('API key or context is missing. Please provide the required inputs.')
      return
    }
    setLoading(true)
    showNotification('Generating mindmap...', 'info')

    const prompt = `Based on the following context, generate a mindmap outline with keywords and their relationships. Use a hierarchical structure with main keywords and subkeywords. Format the response as an indented list, where the indentation level represents the hierarchy. Use the following format:

- Main Keyword 1
  - Subkeyword 1
  - Subkeyword 2
- Main Keyword 2
  - Subkeyword 1
  - Subkeyword 2

Context:
${context}

Mindmap Outline:`

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            { role: 'system', content: 'You are an AI assistant that generates mindmap outlines based on the given context.' },
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

      const mindmapText = (response.data.choices[0].message.content as string).trim()
      const parsed = parseMindmapText(mindmapText)
      setNodesData(parsed)
      showNotification('Mindmap generated successfully!', 'success')
    } catch (error) {
      console.error(error)
      showNotification('Error generating mindmap. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#000000',
    ]

    const nodes = new DataSet<Node>(
      nodesData.map((item, index) => ({
        id: item.id,
        label: item.label,
        color: {
          background: colors[index % colors.length],
          border: '#ffffff',
          highlight: { background: colors[index % colors.length], border: '#ffffff' },
          hover: { background: colors[index % colors.length], border: '#ffffff' },
        },
        font: { color: '#ffffff', size: 18, face: 'Inter' },
        shape: 'box',
        margin: { top: 8, bottom: 8, left: 8, right: 8 },
        widthConstraint: { maximum: 360 },
      }))
    )

    const edges = new DataSet<Edge>(
      nodesData
        .filter((n) => n.parent)
        .map((n) => ({ from: n.parent!, to: n.id, arrows: 'to', color: { color: '#000000' } }))
    )

    const network = new Network(container, { nodes, edges }, {
      layout: { hierarchical: false, improvedLayout: true, nodeSpacing: 250, edgeMinimization: true },
      physics: {
        enabled: true,
        barnesHut: { gravitationalConstant: -15000, centralGravity: 0.8, springLength: 250, springConstant: 0.04, damping: 0.09 },
        stabilization: { enabled: true, iterations: 500, fit: true },
      },
      interaction: { hover: true, zoomView: true, dragView: true },
      edges: { smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 } },
    })

    const resizeObserver = new ResizeObserver(() => network.fit({ animation: false }))
    resizeObserver.observe(container)
    return () => {
      resizeObserver.disconnect()
      network.destroy()
    }
  }, [nodesData])

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
          <h1 className="text-2xl font-bold">Mindmap (Alpha)</h1>
        </div>

        <div className="space-y-3">
          <textarea value={context} onChange={(e) => setContext(e.target.value)} className="w-full h-40 p-3 border rounded" placeholder="Paste your context here" />
          <button onClick={generateMindmap} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Generating...' : 'Generate Mindmap'}</button>
        </div>

        <div className="h-[600px] w-full border rounded bg-white" ref={containerRef} />
      </div>
    </div>
  )
}

function parseMindmapText(text: string): MindmapNode[] {
  const lines = text.split('\n').filter((l) => l.trim())
  const data: MindmapNode[] = []
  const stack: MindmapNode[] = []
  let idCounter = 1

  for (const line of lines) {
    const leadingSpaces = line.search(/\S/)
    const level = Math.max(0, Math.floor(leadingSpaces / 2))
    const label = line.trim().replace(/^[-\u2022]\s*/, '')

    const node: MindmapNode = { id: idCounter++, label, level }

    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop()
    }
    if (stack.length) {
      node.parent = stack[stack.length - 1].id
    }

    data.push(node)
    stack.push(node)
  }

  return data
}