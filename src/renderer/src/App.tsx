import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ToastStack } from '@renderer/components/ui/ToastStack'
import { Dashboard } from '@renderer/routes/Dashboard'
import { PageCustomiser } from '@renderer/routes/PageCustomiser'
import { Workspace } from '@renderer/routes/Workspace'
import './styles/app.css'

const router = createMemoryRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/project/:id',
    element: <Workspace />
  },
  {
    path: '/project/:id/customise',
    element: <PageCustomiser />
  }
])

export function App(): JSX.Element {
  if (typeof window.lab === 'undefined') {
    return (
      <div
        className="appShell"
        style={{ display: 'grid', placeItems: 'center', padding: 32, minHeight: '100vh' }}
      >
        <div
          style={{
            width: 'min(560px, 100%)',
            display: 'grid',
            gap: 12,
            padding: 24,
            borderRadius: 24,
            border: '1px solid var(--lab-border)',
            background: 'rgba(16, 18, 23, 0.96)'
          }}
        >
          <div
            style={{
              color: 'var(--lab-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            LAB
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--lab-font-sans)' }}>App bridge unavailable</h1>
          <p style={{ margin: 0, color: 'var(--lab-text-muted)' }}>
            The Electron preload script did not load, so LAB cannot talk to the local database or
            filesystem. Restart the app or rebuild the release.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="appShell">
      <RouterProvider router={router} />
      <ToastStack />
    </div>
  )
}
