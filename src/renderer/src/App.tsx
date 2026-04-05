import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ToastStack } from '@renderer/components/ui/ToastStack'
import { HomeDashboard } from '@renderer/routes/HomeDashboard'
import { CommandCenterLayout } from '@renderer/routes/CommandCenterLayout'
import { MasterPlan } from '@renderer/routes/MasterPlan'
import { PageCustomiser } from '@renderer/routes/PageCustomiser'
import { PersonalOs } from '@renderer/routes/PersonalOs'
import { ProjectPreview } from '@renderer/routes/ProjectPreview'
import { ProjectEcosystem } from '@renderer/routes/ProjectEcosystem'
import { SkillMatrix } from '@renderer/routes/SkillMatrix'
import { Workspace } from '@renderer/routes/Workspace'
import './styles/app.css'

const router = createMemoryRouter([
  {
    path: '/',
    element: <CommandCenterLayout />,
    children: [
      {
        index: true,
        element: <HomeDashboard />
      },
      {
        path: 'plan',
        element: <MasterPlan />
      },
      {
        path: 'os',
        element: <PersonalOs />
      },
      {
        path: 'ecosystem',
        element: <ProjectEcosystem />
      },
      {
        path: 'skills',
        element: <SkillMatrix />
      },
      {
        path: 'project/:id',
        element: <Workspace />
      },
      {
        path: 'project/:id/customise',
        element: <PageCustomiser />
      },
      {
        path: 'project/:id/preview',
        element: <ProjectPreview />
      }
    ]
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
            borderRadius: 16,
            border: '1px solid var(--lab-border)',
            background: 'var(--lab-surface)',
            boxShadow: 'var(--lab-shadow-card)'
          }}
        >
          <div
            style={{
              color: 'var(--lab-text-muted)',
              textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}
        >
            davids.lab
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--lab-font-sans)' }}>App bridge unavailable</h1>
          <p style={{ margin: 0, color: 'var(--lab-text-muted)' }}>
            The Electron preload script did not load, so davids.lab cannot talk to the local
            database or filesystem. Restart the app or rebuild the release.
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
