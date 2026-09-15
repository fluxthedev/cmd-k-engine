export interface Command {
  id: string
  label: string
  description?: string
  keywords?: string[]
  children?: Command[]
  action?: () => void | Promise<void>
}
