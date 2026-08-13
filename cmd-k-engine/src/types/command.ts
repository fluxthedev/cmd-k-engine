export interface Command {
    id: string, 
    label: string,
    description?: string,
    keywords?: string[],
    // Nested Menus
    children?: Command[],
    // Executable commands
    action?: () => void | Promise<void>
}