import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

import type { Command } from '@/types/command'

/**
 * Determines whether a search query "fuzzy matches" some text.
 *
 * Example:
 *
 *   query = "acct"
 *   text  = "Account Settings"
 *
 * The letters a → c → c → t appear in order,
 * so this returns true.
 *
 * They don't need to be next to each other.
 */

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

/**
 * Determines whether a command should appear
 * in the current search results.
 *
 * We search against more than just the label:
 *
 * - label
 * - description
 * - keywords
 *
 * This means a command can be discovered using
 * words that aren't actually displayed in its title.
 */
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

/**
 * Main state and behavior for the command palette.
 *
 * The component should mostly be responsible for
 * rendering this state.
 *
 * This composable is responsible for:
 *
 * - opening / closing
 * - command registration
 * - searching
 * - keyboard navigation
 * - nested menus
 * - executing commands
 */
export function useCommandPalette() {
  /**
   * Whether the palette is currently visible.
   *
   * Example:
   *
   * false → palette closed
   * true  → palette open
   */
  const isOpen = ref(false)


  /**
   * The text currently typed into the search box.
   *
   * Example:
   *
   * ""
   * "set"
   * "dark"
   */
  const query = ref('')

  /**
   * All root-level commands registered
   * by the application.
   *
   * This starts empty and App.vue can add commands
   * using palette.register(...).
   */
  const commands = ref<Command[]>([])

  /**
   * Which command is currently highlighted.
   *
   * Example:
   *
   * 0 = first command
   * 1 = second command
   * 2 = third command
   *
   * This is what ArrowUp / ArrowDown change.
   */
  const selectedIndex = ref(0)

  /**
   * Keeps track of the user's current position
   * in nested menus.
   *
   * At the root:
   *
   * []
   *
   * Inside "Theme":
   *
   * [Theme]
   *
   * Inside "Theme -> Colors":
   *
   * [Theme, Colors]
   *
   * This lets us implement Backspace navigation.
   */
  const menuStack = ref<Command[]>([])

  /**
   * Figures out which commands should be displayed
   * BEFORE search is applied.
   *
   * At the root, we return the top-level commands.
   *
   * Inside a submenu, we return that command's children.
   */
  const currentCommands = computed(() => {
    // Get the last item in the menu stack.
    //
    // If we're in:
    //
    // [Theme, Colors]
    //
    // then "Colors" is the current parent.
    const parent =
      menuStack.value[
        menuStack.value.length - 1
      ]

    // If there is a parent, display its children.
    //
    // Otherwise we're at the root, so display the
    // normal top-level commands.
    return parent?.children ??
      commands.value
  })

  /**
   * Applies the user's search query to the
   * commands we're currently viewing.
   *
   * Example:
   *
   * currentCommands:
   *   Settings
   *   Projects
   *   Help
   *
   * query:
   *   "set"
   *
   * result:
   *   Settings
   */
  const filteredCommands = computed(() => {
    return currentCommands.value.filter(
      (command) =>
        commandMatches(
          command,
          query.value,
        ),
    )
  })


  /**
   * Converts the selectedIndex number into
   * the actual selected command.
   *
   * Example:
   *
   * selectedIndex = 1
   *
   * filteredCommands = [
   *   Dashboard,
   *   Settings,
   *   Help
   * ]
   *
   * selectedCommand = Settings
   */
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