import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

import type { Command } from '@/types/command'

/**
 * Determines whether a search query "fuzzy matches"
 * some text.
 *
 * We first check for a normal substring match.
 *
 * Example:
 *
 * query = "dash"
 * text = "Dashboard"
 *
 * This is a direct match, so it returns true.
 *
 * If there isn't a direct match, we allow the
 * characters to appear in order without needing
 * to be next to each other.
 *
 * Example:
 *
 * query = "acct"
 * text = "Account Settings"
 *
 * a → c → c → t
 *
 * The letters appear in order, so this returns true.
 */
function fuzzyMatch(
  query: string,
  text: string,
): boolean {
  const normalizedQuery = query
    .trim()
    .toLowerCase()

  const normalizedText = text.toLowerCase()

  // Empty searches match everything.
  if (!normalizedQuery) {
    return true
  }

  // Prefer a normal substring match.
  //
  // Example:
  // "dash" → "Dashboard"
  if (
    normalizedText.includes(normalizedQuery)
  ) {
    return true
  }

  // If there isn't a direct match,
  // perform a simple fuzzy subsequence match.
  //
  // The letters must appear in order,
  // but they don't have to be adjacent.
  let queryIndex = 0

  for (
    const character of normalizedText
  ) {
    if (
      character ===
      normalizedQuery[queryIndex]
    ) {
      queryIndex++

      // We matched every character
      // in the query.
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
 * IMPORTANT:
 *
 * We search each field independently.
 *
 * Fields:
 *
 * - label
 * - description
 * - keywords
 *
 * We intentionally DON'T combine all of them
 * into one large string.
 *
 * Otherwise a query could accidentally match
 * by taking one character from the label,
 * another from the description, and another
 * from a keyword.
 */
function commandMatches(
  command: Command,
  query: string,
): boolean {
  if (!query.trim()) {
    return true
  }

  const fields = [
    command.label,
    command.description ?? '',
    ...(command.keywords ?? []),
  ]

  return fields.some((field) =>
    fuzzyMatch(query, field),
  )
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
   */
  const isOpen = ref(false)

  /**
   * The text currently typed into the search box.
   */
  const query = ref('')

  /**
   * All root-level commands registered
   * by the application.
   */
  const commands = ref<Command[]>([])

  /**
   * Which command is currently highlighted.
   *
   * 0 = first command
   * 1 = second command
   * 2 = third command
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
   */
  const menuStack = ref<Command[]>([])

  /**
   * Figures out which commands should be displayed
   * BEFORE search is applied.
   *
   * At the root, we return the top-level commands.
   *
   * Inside a submenu, we return that command's
   * children.
   */
  const currentCommands = computed(() => {
    // Get the last item in the menu stack.
    const parent =
      menuStack.value[
        menuStack.value.length - 1
      ]

    // If we're inside a submenu, display its
    // children.
    //
    // Otherwise display the root commands.
    return parent?.children ??
      commands.value
  })

  /**
   * Applies the user's search query to the
   * commands we're currently viewing.
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
   */
  const selectedCommand = computed(() => {
    return filteredCommands.value[
      selectedIndex.value
    ]
  })

  /**
   * Creates the breadcrumb labels used by the UI.
   *
   * Example:
   *
   * [Theme, Colors]
   *
   * becomes:
   *
   * ["Theme", "Colors"]
   */
  const breadcrumbs = computed(() => {
    return menuStack.value.map(
      (command) => command.label,
    )
  })

  /**
   * Adds a new command to the palette.
   *
   * If a command with the same ID already exists,
   * replace it instead of creating a duplicate.
   */
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

  /**
   * Removes a command by ID.
   */
  function unregister(id: string) {
    commands.value =
      commands.value.filter(
        (command) =>
          command.id !== id,
      )
  }

  /**
   * Opens the palette.
   *
   * Every time the palette opens,
   * we start from a clean state.
   */
  function open() {
    isOpen.value = true
    reset()
  }

  /**
   * Closes the palette.
   */
  function close() {
    isOpen.value = false
  }

  /**
   * Toggles the palette open/closed.
   */
  function toggle() {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  /**
   * Resets temporary UI state.
   *
   * This does NOT remove registered commands.
   *
   * It resets:
   *
   * - search text
   * - selected item
   * - submenu location
   */
  function reset() {
    query.value = ''
    selectedIndex.value = 0
    menuStack.value = []
  }

  /**
   * Moves the highlighted command down.
   *
   * Example:
   *
   * 0 → 1 → 2 → 0
   */
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

  /**
   * Moves the highlighted command up.
   *
   * Example:
   *
   * 2 → 1 → 0 → 2
   */
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

  /**
   * Handles pressing Enter.
   *
   * There are two possible behaviors:
   *
   * 1. The command has children
   * → enter the submenu.
   *
   * 2. The command has an action
   * → execute it and close the palette.
   */
  function enter() {
    const command =
      selectedCommand.value

    if (!command) {
      return
    }

    /**
     * If the command has children,
     * enter that submenu.
     */
    if (command.children?.length) {
      menuStack.value.push(command)

      // Clear the search when entering
      // a new submenu.
      query.value = ''

      // Start at the first item.
      selectedIndex.value = 0

      return
    }

    /**
     * Otherwise execute the command.
     */
    if (command.action) {
      void command.action()

      close()
    }
  }

  /**
   * Goes back one level in the menu hierarchy.
   *
   * IMPORTANT:
   *
   * Backspace should NOT close the palette.
   *
   * If we're already at the root, simply
   * do nothing.
   */
  function back() {
    // Already at the root.
    //
    // Escape is responsible for closing
    // the palette.
    if (
      menuStack.value.length === 0
    ) {
      return
    }

    // Remove the current submenu.
    menuStack.value.pop()

    // Clear the submenu search.
    query.value = ''

    // Start at the first command
    // in the previous menu.
    selectedIndex.value = 0
  }

  /**
   * Global keyboard handler.
   *
   * Keeping keyboard behavior here means
   * the UI component doesn't need to know
   * how the palette works internally.
   */
  function handleKeydown(
    event: KeyboardEvent,
  ) {
    /**
     * Determine whether the user is on macOS.
     *
     * Mac:
     * Cmd + K
     *
     * Windows/Linux:
     * Ctrl + K
     */
    const modifier =
      /Mac|iPhone|iPad|iPod/i.test(
        navigator.platform,
      )
        ? event.metaKey
        : event.ctrlKey

    /**
     * Cmd/Ctrl + K
     *
     * Toggle the command palette.
     */
    if (
      modifier &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault()
      toggle()

      return
    }

    /**
     * Don't process the remaining keyboard
     * commands if the palette isn't open.
     */
    if (!isOpen.value) {
      return
    }

    /**
     * Handle keyboard navigation.
     */
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
        /**
         * Only use Backspace for navigation
         * when the search field is empty.
         *
         * If the user has typed something,
         * Backspace should behave normally and
         * delete the character.
         */
        if (!query.value) {
          event.preventDefault()
          back()
        }

        break
    }
  }

  /**
   * Whenever the search query changes,
   * return the selection to the first result.
   *
   * Example:
   *
   * Before:
   *
   * Dashboard
   * Settings
   * Help <-- selected
   *
   * User types:
   *
   * "set"
   *
   * Results:
   *
   * Settings
   *
   * We want Settings to become selected.
   */
  watch(query, () => {
    selectedIndex.value = 0
  })

  /**
   * Make sure selectedIndex always points
   * to a valid result.
   *
   * This protects us when filtering causes
   * the number of results to shrink.
   */
  watch(
    filteredCommands,
    () => {
      if (
        filteredCommands.value.length === 0
      ) {
        selectedIndex.value = 0

        return
      }

      if (
        selectedIndex.value >=
        filteredCommands.value.length
      ) {
        selectedIndex.value = 0
      }
    },
  )

  /**
   * Start listening for global keyboard events
   * when the composable is mounted.
   */
  onMounted(() => {
    window.addEventListener(
      'keydown',
      handleKeydown,
    )
  })

  /**
   * Clean up the event listener when the
   * component using this composable is removed.
   *
   * This prevents memory leaks and duplicate
   * keyboard handlers.
   */
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
