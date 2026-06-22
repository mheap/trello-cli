# Trello CLI — Claude Code Reference

This is a CLI tool for managing Trello boards, lists, cards, and labels from the terminal. Install with `npm install -g trello-cli`. All commands use the `trello` prefix.

## Authentication

Set up credentials before using any commands:

```bash
trello auth:api-key <your_api_key>   # Get from https://trello.com/app-key
trello auth:token <your_token>        # Follow the URL printed by the previous command
trello sync                           # Build local cache (required after first auth)
```

Alternatively, set `TRELLO_API_KEY` and `TRELLO_TOKEN` environment variables.

Multiple profiles are supported via the `TRELLO_CLI_PROFILE` env var (default profile: `default`). Config is stored in `~/.trello-cli/<profile>/config.json`.

## Key Concepts

- Commands accept resource **names** (not IDs). The CLI resolves names to IDs via a local SQLite cache.
- Run `trello sync` to refresh the cache whenever boards, lists, or members change.
- Use `--format json` to get machine-readable JSON output. Other formats: `default`, `silent`, `csv`.
- Card commands require `--board`, `--list`, and `--card` flags to identify a card by name.
- Due dates accept natural language (e.g., "next friday", "tomorrow", "March 15").

## Command Reference

### Board Commands

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `board:list` | List all boards | — | `--filter` (all/closed/members/open/organization/public/starred, default: open) |
| `board:show` | Show board details | `--board` | — |
| `board:create` | Create a board | `--name` | `--description`, `--org`, `--defaultLists` (default: true), `--prefs.permissionLevel` (org/private/public) |
| `board:update` | Update a board | `--board` | `--name`, `--description` |
| `board:delete` | Delete a board | `--board` | — |
| `board:members` | List board members | `--board` | — |
| `board:set-closed` | Close or reopen a board | `--board` | `--open` (default: false) |

### List Commands

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `list:list` | Show all lists on a board | `--board` | `--filter` (all/closed/none/open, default: open) |
| `list:create` | Create a new list | `--name`, `--board` | `--position` (top/bottom, default: top) |
| `list:rename` | Rename a list | `--board`, `--list`, `--name` | — |
| `list:archive` | Archive a list | `--id` | — |
| `list:archive-cards` | Archive all cards in a list | `--board`, `--list` | — |
| `list:move-all-cards` | Move all cards between lists | `--board`, `--list`, `--destination-board`, `--destination-list` | — |

### Card Commands

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `card:list` | Show all cards in a list | `--board`, `--list` | — |
| `card:show` | Show card details | `--board`, `--list`, `--card` | — |
| `card:get-by-id` | Show card details by ID | `--id` | — |
| `card:create` | Create a card | `--name`, `--board`, `--list` | `--position` (top/bottom, default: bottom), `--label` (multiple), `--due`, `--description` |
| `card:update` | Update a card | `--board`, `--list`, `--card` | `--name`, `--description`, `--due`, `--clear-due` |
| `card:delete` | Delete a card | `--board`, `--list`, `--card` | — |
| `card:archive` | Archive a card | `--board`, `--list`, `--card` | — |
| `card:move` | Move a card to another list | `--board`, `--list`, `--card`, `--to` | `--position` (top/bottom, default: bottom) |
| `card:assign` | Assign a user to a card | `--board`, `--list`, `--card`, `--user` | — |
| `card:unassign` | Remove a user from a card | `--board`, `--list`, `--card`, `--user` | — |
| `card:assigned-to` | Show cards assigned to a user | — | `--user` (default: me) |
| `card:label` | Add a label to a card | `--board`, `--list`, `--card`, `--label` | — |
| `card:unlabel` | Remove a label from a card | `--board`, `--list`, `--card`, `--label` | — |
| `card:comment` | Add a comment to a card | `--board`, `--list`, `--card`, `--text` | — |
| `card:comments` | List comments on a card | `--board`, `--list`, `--card` | — |
| `card:checklist` | Add a checklist to a card | `--board`, `--list`, `--card`, `--name` | — |
| `card:checklists` | List checklists on a card | `--board`, `--list`, `--card` | — |
| `card:check-item` | Complete/uncomplete a checklist item | `--board`, `--list`, `--card`, `--item`, `--state` (complete/incomplete) | `--checklist` |
| `card:attach` | Add an attachment to a card | `--board`, `--list`, `--card`, `--url` | `--name` |
| `card:attachments` | List attachments on a card | `--board`, `--list`, `--card` | — |

### Label Commands

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `label:list` | List all labels on a board | `--board` | — |
| `label:create` | Create a label | `--board`, `--name`, `--color` | — |
| `label:update` | Update a label's text | `--board`, `--color`, `--name` | `--old-name` |
| `label:delete` | Delete a label | `--board`, `--color` | `--text` |

Label colors: green, yellow, orange, red, purple, blue, sky, lime, pink, black.

### Search & Utility

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `search` | Search Trello | `--query` | `--board`, `--type` (cards/boards/organizations) |
| `sync` | Refresh the local name-to-ID cache | — | — |
| `debug` | Debug your installation (outputs JSON) | — | — |

## Workflow Examples

### Create a card with labels and a due date, then assign it

```bash
trello card:create --board "My Project" --list "To Do" --name "Implement login page" \
  --label "frontend" --label "priority" --due "next friday" --description "Build the OAuth login flow"
trello card:assign --board "My Project" --list "To Do" --card "Implement login page" --user "michael"
```

### Review all cards assigned to me

```bash
trello card:assigned-to
trello card:assigned-to --format json   # Machine-readable output
```

### Move a card through a workflow

```bash
trello card:move --board "My Project" --list "To Do" --card "Implement login page" --to "In Progress"
# Later...
trello card:move --board "My Project" --list "In Progress" --card "Implement login page" --to "Done"
```

### Set up a new board with custom lists and labels

```bash
trello board:create --name "Sprint 42" --defaultLists false
trello sync
trello list:create --board "Sprint 42" --name "Done" --position top
trello list:create --board "Sprint 42" --name "In Review" --position top
trello list:create --board "Sprint 42" --name "In Progress" --position top
trello list:create --board "Sprint 42" --name "Backlog" --position top
trello label:create --board "Sprint 42" --name "bug" --color red
trello label:create --board "Sprint 42" --name "feature" --color green
trello label:create --board "Sprint 42" --name "urgent" --color orange
```

### Search for a card and add a comment

```bash
trello search --query "login page" --format json
trello card:comment --board "My Project" --list "In Progress" --card "Implement login page" \
  --text "Updated the OAuth redirect URI to match production config"
```

### Move all cards from one list to another

```bash
trello list:move-all-cards --board "Sprint 42" --list "Done" \
  --destination-board "Sprint 42" --destination-list "Archive"
```

### Manage checklists on a card

```bash
trello card:checklist --board "My Project" --list "To Do" --card "Launch prep" --name "Pre-launch"
trello card:check-item --board "My Project" --list "To Do" --card "Launch prep" \
  --item "DNS configured" --state complete
trello card:checklists --board "My Project" --list "To Do" --card "Launch prep" --format json
```

## Tips

- Always use `--format json` when you need to parse command output programmatically.
- Run `trello sync` if a board or list name isn't recognized — the cache may be stale.
- Card names must be unique within their list for name-based lookup to work.
- The `--label` flag on `card:create` can be repeated to add multiple labels at once.
- Use `trello debug` to verify that authentication is configured correctly.

## Claude Code Skill

A Claude Code skill is included at `skills/trello-cli/SKILL.md` for users who want Claude Code to know about `trello-cli` from any project directory. To install:

```bash
cp -r skills/trello-cli ~/.claude/skills/trello-cli
```

Once installed, Claude Code will automatically detect when you're asking about Trello and know how to use the CLI.
