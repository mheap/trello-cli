---
"@trello-cli/cache": patch
---

Fix crash in `trello sync` when processing boards without organization. Boards with `null` organization (personal boards or boards not in a workspace) are now handled correctly instead of throwing `TypeError: Cannot read properties of undefined (reading 'id')`.
