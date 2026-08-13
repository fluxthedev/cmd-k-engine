import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

import type { Command } from '@/types/command'

function fuzzyMatch(
  query: string,
  text: string,
): boolean {
  if (!query) {
    return true
  }

  const normalizedQuery =
    query.toLowerCase()

  const normalizedText =
    text.toLowerCase()

  let queryIndex = 0

  for (
    let i = 0;
    i < normalizedText.length;
    i++
  ) {
    if (
      normalizedText[i] ===
      normalizedQuery[queryIndex]
    ) {
      queryIndex++

      if (
        queryIndex ===
        normalizedQuery.length
      ) {
        return true
      }
    }
  }

  return false
}

function commandMatches(
  command: Command,
  query: string,
): boolean {
  const searchText = [
    command.label,
    command.description ?? '',
    ...(command.keywords ?? []),
  ].join(' ')

  return fuzzyMatch(query, searchText)
}

export function useCommandPalette() {
  const isOpen = ref(false)

  const query = ref('')

  const commands = ref<Command[]>([])

  const selectedIndex = ref(0)

  /**
   * Commands representing the current
   * submenu path.
   *
   * Example:
   *
   * []
   *
   * [Theme]
   *
   * [Theme, Editor]
   */
  const menuStack = ref<Command[]>([])

  const currentCommands = computed(() => {
    const parent =
      menuStack.value[
        menuStack.value.length - 1
      ]

    return parent?.children ??
      commands.value
  })

  const filteredCommands = computed(() => {
    return currentCommands.value.filter(
      (command) =>
        commandMatches(
          command,
          query.value,
        ),
    )
  })

  const selectedCommand = computed(() => {
    return filteredCommands.value[
      selectedIndex.value
    ]
  })

  const breadcrumbs = computed(() => {
    return menuStack.value.map(
      (command) => command.label,
    )
  })

  function register(command: Command) {
    const existingIndex =
      commands.value.findIndex(
        (item) =>
          item.id === command.id,
      )

    if (existingIndex >= 0) {
      commands.value[
        existingIndex
      ] = command

      return
    }

    commands.value.push(command)
  }

  function unregister(id: string) {
    commands.value =
      commands.value.filter(
        (command) =>
          command.id !== id,
      )
  }

  function open() {
    isOpen.value = true
    reset()
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  function reset() {
    query.value = ''
    selectedIndex.value = 0
    menuStack.value = []
  }

  function moveDown() {
    const count =
      filteredCommands.value.length

    if (!count) {
      return
    }

    selectedIndex.value =
      (selectedIndex.value + 1) %
      count
  }

  function moveUp() {
    const count =
      filteredCommands.value.length

    if (!count) {
      return
    }

    selectedIndex.value =
      (selectedIndex.value - 1 + count) %
      count
  }

  function enter() {
    const command =
      selectedCommand.value

    if (!command) {
      return
    }

    if (command.children?.length) {
      menuStack.value.push(command)
      query.value = ''
      selectedIndex.value = 0
      return
    }

    if (command.action) {
      void command.action()
      close()
    }
  }

  function back() {
    if (!menuStack.value.length) {
      close()
      return
    }

    menuStack.value.pop()
    query.value = ''
    selectedIndex.value = 0
  }

  function handleKeydown(
    event: KeyboardEvent,
  ) {
    const modifier =
      /Mac|iPhone|iPad|iPod/i.test(
        navigator.platform,
      )
        ? event.metaKey
        : event.ctrlKey

    if (
      modifier &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault()
      toggle()
      return
    }

    if (!isOpen.value) {
      return
    }

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
        if (!query.value) {
          event.preventDefault()
          back()
        }
        break
    }
  }

  watch(
    filteredCommands,
    () => {
      if (
        selectedIndex.value >=
        filteredCommands.value.length
      ) {
        selectedIndex.value = Math.max(
          filteredCommands.value.length - 1,
          0,
        )
      }
    },
  )

  onMounted(() => {
    window.addEventListener(
      'keydown',
      handleKeydown,
    )
  })

  onUnmounted(() => {
    window.removeEventListener(
      'keydown',
      handleKeydown,
    )
  })

  return {
    isOpen,
    query,
    selectedIndex,
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