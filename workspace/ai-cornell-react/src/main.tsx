import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import NotesPage from './pages/NotesPage'
import McqPage from './pages/McqPage'
import FlashcardsPage from './pages/FlashcardsPage'
import MindmapPage from './pages/MindmapPage'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/notes', element: <NotesPage /> },
  { path: '/mcq', element: <McqPage /> },
  { path: '/flashcards', element: <FlashcardsPage /> },
  { path: '/mindmap', element: <MindmapPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
