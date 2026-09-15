import { useEffect, useRef } from 'react'
import type { CommandPalette as CommandPaletteState } from '../../hooks/useCommandPalette'
import { CommandBreadcrumbs } from './CommandBreadcrumbs'
import { CommandFooter } from './CommandFooter'
import { CommandList } from './CommandList'

export function CommandPalette({ palette }: { palette: CommandPaletteState }) {
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (palette.isOpen) searchInput.current?.focus()
  }, [palette.isOpen])

  if (!palette.isOpen) return null

  const selectCommand = (index: number) => {
    palette.setSelectedIndex(index)
    palette.enter()
  }

  return (
    <div className="palette-backdrop" onMouseDown={(event) => event.target === event.currentTarget && palette.close()}>
      <section className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <header className="palette-header">
          <CommandBreadcrumbs breadcrumbs={palette.breadcrumbs} />
          <input
            ref={searchInput}
            value={palette.query}
            onChange={(event) => palette.setQuery(event.target.value)}
            className="search-input"
            type="text"
            placeholder="Search commands..."
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-controls="command-list"
          />
        </header>
        <CommandList
          commands={palette.filteredCommands}
          selectedIndex={palette.selectedIndex}
          onSelect={selectCommand}
          onHover={palette.setSelectedIndex}
        />
        <CommandFooter />
      </section>
    </div>
  )
}
