import type { Command } from '../../types/command'
import { CommandItem } from './CommandItem'

interface Props {
  commands: Command[]
  selectedIndex: number
  onSelect: (index: number) => void
  onHover: (index: number) => void
}

export function CommandList({ commands, selectedIndex, onSelect, onHover }: Props) {
  return (
    <div id="command-list" className="command-list" role="listbox" aria-label="Commands">
      {!commands.length ? <div className="empty-state">No commands found.</div> : null}
      {commands.map((command, index) => (
        <CommandItem
          key={command.id}
          command={command}
          active={selectedIndex === index}
          onHover={() => onHover(index)}
          onSelect={() => onSelect(index)}
        />
      ))}
    </div>
  )
}
