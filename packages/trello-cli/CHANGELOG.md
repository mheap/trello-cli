# @trello-cli/cli

## 1.3.0

### Minor Changes

- 1fe454b: Add card:update command for modifying card name, description, and due date. Supports natural language dates via chrono-node.
- 86b37ef: Add list:move-all-cards command

## 1.2.0

### Minor Changes

- 5ecb98b: Update all dependencies to the latest version
- 2066518: Add card:get-by-id command

### Patch Changes

- bfc961b: Add default card output for card:show and card:get-by-id

## 1.1.0

### Minor Changes

- 202a566: card:create accepts an optional flag "description"

### Patch Changes

- 9b13556: Fix dueDate bug when date cannot be parsed
- Updated dependencies [9b13556]
  - @trello-cli/cache@1.0.4

## 1.0.7

### Patch Changes

- Updated dependencies
  - @trello-cli/cache@1.0.3

## 1.0.6

### Patch Changes

- Updated dependencies
  - @trello-cli/cache@1.0.2

## 1.0.5

### Patch Changes

- Updated dependencies
  - @trello-cli/cache@1.0.1

## 1.0.4

### Patch Changes

- 22e8fbf: Make tests pass on Node 20.

  This is a workaround for a bug in Jest that reports the parent CLI exit code instead of the test suite exit code.

  See https://github.com/jestjs/jest/issues/14501

## 1.0.3

### Patch Changes

- d12b08f: Show labels when listing all cards

## 1.0.2

### Patch Changes

- Improve the authentication flow UX

## 1.0.1

### Patch Changes

- Fix binary name in help messages

## 1.0.0

### Patch Changes

- 7b7415c: Allow setting due date when creating a card
- c6ae218: Initial Release
- Updated dependencies [c6ae218]
  - @trello-cli/cache@1.0.0
  - @trello-cli/config@1.0.0

## 1.0.0-alpha.6

### Patch Changes

- 7b7415c: Allow setting due date when creating a card

## 1.0.0-alpha.5

### Patch Changes

- Initial Release
- Updated dependencies
  - @trello-cli/cache@1.0.0-alpha.4
  - @trello-cli/config@1.0.0-alpha.4

## 1.0.0-alpha.4

### Major Changes

- da02ea4: Initial alpha release of all components

### Minor Changes

- 008051d: Added support for all phase 1 items

### Patch Changes

- Update help text + rename some commands
- 55d5968: Bump patch release to alpha.1
- Updated dependencies [1db754f]
- Updated dependencies [84df7af]
- Updated dependencies [008051d]
- Updated dependencies [da02ea4]
- Updated dependencies [55d5968]
  - @trello-cli/cache@1.0.0-alpha.3
  - @trello-cli/config@1.0.0-alpha.3

## 1.0.0-alpha.3

### Patch Changes

- Update help text + rename some commands

## 1.0.0-alpha.2

### Minor Changes

- Added support for Board, List and Card manipulation
  - Card: Create, Assign, Unassign, Show, Delete, Move, Show Assigned
  - Board: Create, List, Delete, Close
  - List: Create, List, Archive

## 1.0.0-alpha.1

### Major Changes

- Initial alpha release of all components
