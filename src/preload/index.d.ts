import type { LabBridge } from './types'

declare global {
  interface Window {
    lab: LabBridge
  }
}
