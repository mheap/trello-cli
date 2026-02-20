---
"trello-cli": minor
---

Add interactive terminal UI (`trello interactive`)

- Full-screen TUI for browsing boards, lists, and cards
- Keyboard-driven navigation with arrow keys, Enter to select, Esc to go back
- Card detail view with breadcrumb navigation (Board / List / Card)
- Inline editing: card names, descriptions (multi-line), due dates
- Toggle labels, members, and checklist items from the keyboard
- Checklist management: create checklists, add items, paginated navigation
- Attachment viewing and adding
- Move and archive cards
- Filter boards by typing, view assigned cards with `m`
- Sync data with `s`, contextual help with `?`
- Header shows full card breadcrumb (Board / List / Card) during edit/assign modes
- Configurable via `~/.trello-cli/<profile>/tui.json`
