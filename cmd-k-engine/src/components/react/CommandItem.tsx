import type { Command } from '../../types/command'

interface Props {
  command: Command
  active: boolean
  onSelect: () => void
  onHover: () => void
}

export function CommandItem({ command, active, onSelect, onHover }: Props) {
  return (
    <button
      type="button"
      className={`command${active ? ' active' : ''}`}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={onSelect}
    >
      <span className="command-content">
        <strong>{command.label}</strong>
        {command.description && <small>{command.description}</small>}
      </span>
      {command.children?.length ? <span className="arrow" aria-hidden="true">→</span> : null}
    </button>
  )
}
