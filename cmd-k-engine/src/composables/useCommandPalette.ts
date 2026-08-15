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

   /**
   * Creates the breadcrumb labels used by the UI.
   *
   * Example:
   *
   * menuStack:
   *   [Theme, Colors]
   *
   * breadcrumbs:
   *   ["Theme", "Colors"]
   *
   * The component can render:
   *
   *   Commands / Theme / Colors
   */

  const breadcrumbs = computed(() => {
    return menuStack.value.map(
      (command) => command.label,
    )
  })

    /**
   * Adds a new command to the palette.
   *
   * We use the command's ID as its unique identity.
   *
   * If a command with that ID already exists,
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
   *
   * Example:
   *
   * palette.unregister('settings')
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
   * We reset the navigation state every time
   * the palette opens so the user starts fresh.
   */
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

  /**
   * Resets temporary UI state.
   *
   * This does NOT remove registered commands.
   *
   * It only resets:
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
   *
   * The modulo operator (%) makes navigation
   * wrap back to the beginning.
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
   *
   * Again, modulo lets us wrap around.
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
   *    → enter the submenu.
   *
   * 2. The command has an action
   *    → execute it and close the palette.
   */
  function enter() {
    const command =
      selectedCommand.value

    // Nothing selected
    if (!command) {
      return
    }

    /**
     * If the command has children, it isn't
     * an action we execute yet.
     *
     * Instead, move into that submenu.
     */
    if (command.children?.length) {
      menuStack.value.push(command)
      query.value = ''
      selectedIndex.value = 0
      return
    }

    /**
     * Otherwise this is a normal command.
     *
     * action() may be synchronous or async,
     * so we don't care which one it is here.
     */
    if (command.action) {
      void command.action()
      // The palette is no longer needed
      // after executing a command.
      close()
    }
  }

  function back() {
    // No submenu to go back from
    if (!menuStack.value.length) {
      close()
      return
    }

    // Remove current submenu
    menuStack.value.pop()

    // Clear any search from submenu
    query.value = ''

    // Start the previous menu at it's first item
    selectedIndex.value = 0
  }

  /** 
   * Global keyboard handler
   * 
   * This is intentionally inside the composable keyboard behavior is part of the 
   * logic and not UI
   */

  function handleKeydown(
    event: KeyboardEvent,
  ) {

    // Determines whether we are on MacOS, Mac is cmd and Linux/Windows is ctrl
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
      // Prevent the browser from handling the keyboard shortcut
      event.preventDefault()
      toggle()
      return
    }


    //If modal isn't open then the other keyboard commands shouldn't be handled
    if (!isOpen.value) {
      return
    }

    // Once open, map standard keyboard controls to our state functionns, this prevents the browser to control the keys pressed
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

      // Execute selected command or enter its submenu
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

  /**
   * Make sure the seleced index remains valid whenever the filtering list changes.
   * 
   * Example:
   * 
  *    Before Searching: 
  * 
  *    Dashboard
  *    Settings
  *    Help      <-- Selected index = 2
  * 
  *    User searches "set"
  * 
  *    There is no longer an index of 2
  * 
  *    The watcher moves the selection back to a valid index
   */
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


  // Look for keyboard events when the component is mounted
  onMounted(() => {
    window.addEventListener(
      'keydown',
      handleKeydown,
    )
  })

  // stop looking when it is unmounted
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