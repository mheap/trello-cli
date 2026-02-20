# @trello-cli/cache

## 1.0.5

### Patch Changes

- da2e9d5: Fix crash in `trello sync` when processing boards without organization. Boards with `null` organization (personal boards or boards not in a workspace) are now handled correctly instead of throwing `TypeError: Cannot read properties of undefined (reading 'id')`.

## 1.0.4

### Patch Changes

- 9b13556: Upgrade better-sqlite3 from ^9.1.1 → ^12.6.1 to enable node24 support

## 1.0.3

### Patch Changes

- Remove NOT NULL constraint from all fields

## 1.0.2

### Patch Changes

- Show Board details when sync fails

## 1.0.1

### Patch Changes

- Update version of better-sqlite-3

## 1.0.0

### Patch Changes

- c6ae218: Initial Release

## 1.0.0-alpha.4

### Patch Changes

- Initial Release

## 1.0.0-alpha.3

### Major Changes

- da02ea4: Initial alpha release of all components

### Minor Changes

- 1db754f: Added support for Labels
- 008051d: Added support for all phase 1 items

### Patch Changes

- 84df7af: Add support for TRELLO_API_KEY and TRELLO_TOKEN
- 55d5968: Bump patch release to alpha.1

## 1.0.0-alpha.2

### Minor Changes

- Add support for translating from name to ID and back again for boards, lists and members

### Patch Changes

- Add support for TRELLO_API_KEY and TRELLO_TOKEN

## 1.0.0-alpha.1

### Major Changes

- Initial alpha release of all components
