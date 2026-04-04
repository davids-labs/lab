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
  return (
    <div className="appShell">
      <RouterProvider router={router} />
      <ToastStack />
    </div>
  )
}
