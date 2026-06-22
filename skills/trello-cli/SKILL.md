---
name: trello-cli
description: Use when the user asks to manage Trello boards, lists, cards, labels, or checklists from the terminal, or when a task involves creating, moving, searching, or organizing Trello content
---

# Trello CLI

Manage Trello boards, lists, cards, and labels via the `trello` command-line tool. Requires `trello-cli` to be installed (`npm install -g trello-cli`).

## Prerequisites

Authentication must be configured before any commands work:

```bash
trello auth:api-key <key>    # Get from https://trello.com/app-key
trello auth:token <token>    # URL printed by previous command
trello sync                  # Build local cache (required once after auth)
```

Or set `TRELLO_API_KEY` and `TRELLO_TOKEN` environment variables.

## Key Concepts

- Commands accept resource **names** (not IDs). The CLI resolves names via local SQLite cache.
- Run `trello sync` to refresh the cache when boards, lists, or members change.
- Use `--format json` for machine-readable output. Other formats: `default`, `silent`, `csv`.
- Most card commands need `--board`, `--list`, and `--card` to identify a card by name.
- Due dates accept natural language ("next friday", "tomorrow", "March 15").

## Quick Reference

### Boards

```bash
trello board:list                                    # List open boards
trello board:list --filter starred                   # List starred boards
trello board:show --board "My Board"                 # Show board details
trello board:create --name "New Board"               # Create board
trello board:create --name "B" --defaultLists false  # Create without default lists
trello board:update --board "B" --name "New Name"    # Rename board
trello board:delete --board "B"                      # Delete board
trello board:members --board "B"                     # List members
trello board:set-closed --board "B"                  # Close board
trello board:set-closed --board "B" --open           # Reopen board
```

### Lists

```bash
trello list:list --board "B"                         # Show lists on board
trello list:create --board "B" --name "To Do"        # Create list (top by default)
trello list:create --board "B" --name "X" --position bottom
trello list:rename --board "B" --list "Old" --name "New"
trello list:archive --id <list_id>                   # Archive a list
trello list:archive-cards --board "B" --list "Done"  # Archive all cards in list
trello list:move-all-cards --board "B" --list "Done" \
  --destination-board "B" --destination-list "Archive"
```

### Cards

```bash
# View
trello card:list --board "B" --list "To Do"
trello card:show --board "B" --list "To Do" --card "My Card"
trello card:get-by-id --id <card_id>
trello card:assigned-to                              # My cards across all boards
trello card:assigned-to --user "username"

# Create
trello card:create --board "B" --list "To Do" --name "Task" \
  --label "bug" --label "urgent" --due "friday" --description "Details here"

# Update
trello card:update --board "B" --list "L" --card "C" --name "New Name"
trello card:update --board "B" --list "L" --card "C" --due "march 15"
trello card:update --board "B" --list "L" --card "C" --clear-due

# Move / Archive / Delete
trello card:move --board "B" --list "To Do" --card "C" --to "In Progress"
trello card:archive --board "B" --list "L" --card "C"
trello card:delete --board "B" --list "L" --card "C"

# Assign / Unassign
trello card:assign --board "B" --list "L" --card "C" --user "username"
trello card:unassign --board "B" --list "L" --card "C" --user "username"

# Labels
trello card:label --board "B" --list "L" --card "C" --label "bug"
trello card:unlabel --board "B" --list "L" --card "C" --label "bug"

# Comments
trello card:comment --board "B" --list "L" --card "C" --text "My comment"
trello card:comments --board "B" --list "L" --card "C"

# Checklists
trello card:checklist --board "B" --list "L" --card "C" --name "Tasks"
trello card:checklists --board "B" --list "L" --card "C"
trello card:check-item --board "B" --list "L" --card "C" \
  --item "Item name" --state complete
trello card:check-item --board "B" --list "L" --card "C" \
  --item "Item name" --state incomplete --checklist "Tasks"

# Attachments
trello card:attach --board "B" --list "L" --card "C" --url "https://..." --name "Doc"
trello card:attachments --board "B" --list "L" --card "C"
```

### Labels

```bash
trello label:list --board "B"
trello label:create --board "B" --name "bug" --color red
trello label:update --board "B" --color red --name "critical bug"
trello label:update --board "B" --color red --name "new" --old-name "old"
trello label:delete --board "B" --color red
trello label:delete --board "B" --color red --text "bug"  # Disambiguate
```

Colors: green, yellow, orange, red, purple, blue, sky, lime, pink, black.

### Search

```bash
trello search --query "login page"
trello search --query "bug" --board "My Board"
trello search --query "auth" --type cards --format json
```

### Utility

```bash
trello sync     # Refresh local name-to-ID cache
trello debug    # Check auth and config (outputs JSON)
```

## Workflow Examples

### Set up a new board

```bash
trello board:create --name "Sprint 42" --defaultLists false
trello sync
trello list:create --board "Sprint 42" --name "Done" --position top
trello list:create --board "Sprint 42" --name "In Review" --position top
trello list:create --board "Sprint 42" --name "In Progress" --position top
trello list:create --board "Sprint 42" --name "Backlog" --position top
trello label:create --board "Sprint 42" --name "bug" --color red
trello label:create --board "Sprint 42" --name "feature" --color green
```

### Create and assign a card

```bash
trello card:create --board "B" --list "To Do" --name "Implement auth" \
  --label "feature" --due "next friday" --description "OAuth flow"
trello card:assign --board "B" --list "To Do" --card "Implement auth" --user "me"
```

### Move a card through workflow stages

```bash
trello card:move --board "B" --list "To Do" --card "Task" --to "In Progress"
trello card:move --board "B" --list "In Progress" --card "Task" --to "Done"
```

### Sprint cleanup

```bash
trello list:move-all-cards --board "B" --list "Done" \
  --destination-board "B" --destination-list "Archive"
trello list:archive-cards --board "B" --list "Archive"
```

## Tips

- Use `--format json` when parsing output programmatically.
- Run `trello sync` if a name isn't recognized — the cache may be stale.
- Card names must be unique within their list for name-based lookup.
- The `--label` flag on `card:create` accepts multiple values.
- Use `trello debug` to verify authentication is working.
