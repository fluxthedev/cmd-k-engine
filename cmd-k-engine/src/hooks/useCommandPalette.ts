import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Command } from '../types/command'

function fuzzyMatch(query: string, text: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedText = text.toLowerCase()
  if (!normalizedQuery) return true
  if (normalizedText.includes(normalizedQuery)) return true

  let queryIndex = 0
  for (const character of normalizedText) {
    if (character === normalizedQuery[queryIndex]) {
      queryIndex++
      if (queryIndex === normalizedQuery.length) return true
    }
  }
  return false
}

function commandMatches(command: Command, query: string): boolean {
  if (!query.trim()) return true
  return [command.label, command.description ?? '', ...(command.keywords ?? [])].some((field) =>
    fuzzyMatch(query, field),
  )
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [commands, setCommands] = useState<Command[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuStack, setMenuStack] = useState<Command[]>([])

  const currentCommands = useMemo(() => {
    const parent = menuStack[menuStack.length - 1]
    return parent?.children ?? commands
  }, [commands, menuStack])

  const filteredCommands = useMemo(
    () => currentCommands.filter((command) => commandMatches(command, query)),
    [currentCommands, query],
  )

  const selectedCommand = filteredCommands[selectedIndex]
  const breadcrumbs = useMemo(() => menuStack.map((command) => command.label), [menuStack])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, menuStack])

  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) setSelectedIndex(0)
  }, [filteredCommands.length, selectedIndex])

  const register = useCallback((command: Command) => {
    setCommands((current) => {
      const existingIndex = current.findIndex((item) => item.id === command.id)
      if (existingIndex < 0) return [...current, command]
      const next = [...current]
      next[existingIndex] = command
      return next
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setCommands((current) => current.filter((command) => command.id !== id))
  }, [])

  const reset = useCallback(() => {
    setQuery('')
    setSelectedIndex(0)
    setMenuStack([])
  }, [])

  const open = useCallback(() => {
    reset()
    setIsOpen(true)
  }, [reset])

  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((open) => !open), [])

  const moveDown = useCallback(() => {
    setSelectedIndex((index) => filteredCommands.length ? (index + 1) % filteredCommands.length : 0)
  }, [filteredCommands.length])

  const moveUp = useCallback(() => {
    setSelectedIndex((index) => filteredCommands.length ? (index - 1 + filteredCommands.length) % filteredCommands.length : 0)
  }, [filteredCommands.length])

  const enter = useCallback(() => {
    const command = filteredCommands[selectedIndex]
    if (!command) return

    if (command.children?.length) {
      setMenuStack((stack) => [...stack, command])
      setQuery('')
      setSelectedIndex(0)
      return
    }

    if (command.action) {
      void command.action()
      setIsOpen(false)
    }
  }, [filteredCommands, selectedIndex])

  const back = useCallback(() => {
    if (!menuStack.length) return
    setMenuStack((stack) => stack.slice(0, -1))
    setQuery('')
    setSelectedIndex(0)
  }, [menuStack.length])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
      const modifier = isMac ? event.metaKey : event.ctrlKey

      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toggle()
        return
      }

      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          close()
          break
        case 'ArrowDown':
          event.preventDefault()
          moveDown()
          break
        case 'ArrowUp':
          event.preventDefault()
          moveUp()
          break
        case 'Enter':
          event.preventDefault()
          enter()
          break
        case 'Backspace':
          if (!query) {
            event.preventDefault()
            back()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [back, close, enter, isOpen, moveDown, moveUp, query, toggle])

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    currentCommands,
    filteredCommands,
    selectedCommand,
    breadcrumbs,
    register,
    unregister,
    open,
    close,
    toggle,
    moveDown,
    moveUp,
    enter,
    back,
  }
}

export type CommandPalette = ReturnType<typeof useCommandPalette>
