import { Navigate, createHashRouter, RouterProvider } from 'react-router-dom'
import { ToastStack } from '@renderer/components/ui/ToastStack'
import { HomeDashboard } from '@renderer/routes/HomeDashboard'
import { CommandCenterLayout } from '@renderer/routes/CommandCenterLayout'
import { LibraryWorkspace } from '@renderer/routes/LibraryWorkspace'
import { MasterPlan } from '@renderer/routes/MasterPlan'
import { NotesWorkspace } from '@renderer/routes/NotesWorkspace'
import { PageCustomiser } from '@renderer/routes/PageCustomiser'
import { PersonalOs } from '@renderer/routes/PersonalOs'
import { PipelineWorkspace } from '@renderer/routes/PipelineWorkspace'
import { PresenceWorkspace } from '@renderer/routes/PresenceWorkspace'
import { ProjectPreview } from '@renderer/routes/ProjectPreview'
import { ProjectEcosystem } from '@renderer/routes/ProjectEcosystem'
import { ProofWorkspace } from '@renderer/routes/ProofWorkspace'
import { SettingsWorkspace } from '@renderer/routes/SettingsWorkspace'
import { SkillMatrix } from '@renderer/routes/SkillMatrix'
import { Workspace } from '@renderer/routes/Workspace'
import './styles/app.css'

const router = createHashRouter([
  {
    path: '/',
    element: <CommandCenterLayout />,
    children: [
      {
        index: true,
        element: <HomeDashboard />
      },
      {
        path: 'home',
        element: <Navigate replace to="/" />
      },
      {
        path: 'direction',
        element: <MasterPlan />
      },
      {
        path: 'notes',
        element: <NotesWorkspace />
      },
      {
        path: 'execution',
        element: <PersonalOs />
      },
      {
        path: 'proof',
        element: <ProofWorkspace />
      },
      {
        path: 'proof/projects',
        element: <ProjectEcosystem />
      },
      {
        path: 'proof/skills',
        element: <SkillMatrix />
      },
      {
        path: 'pipeline',
        element: <PipelineWorkspace />
      },
      {
        path: 'presence',
        element: <PresenceWorkspace />
      },
      {
        path: 'library',
        element: <LibraryWorkspace />
      },
      {
        path: 'settings',
        element: <SettingsWorkspace />
      },
      {
        path: 'plan',
        element: <Navigate replace to="/direction" />
      },
      {
        path: 'os',
        element: <Navigate replace to="/execution" />
      },
      {
        path: 'ecosystem',
        element: <Navigate replace to="/proof/projects" />
      },
      {
        path: 'skills',
        element: <Navigate replace to="/proof/skills" />
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
            borderRadius: 14,
            border: '1px solid var(--lab-border)',
            background: 'var(--lab-panel)',
            boxShadow: '0 18px 48px rgba(15, 15, 15, 0.08)'
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
