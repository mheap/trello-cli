# Trello CLI

## Installation

> Trello CLI requires node 18+

```bash
npm install -g trello-cli
```

If you're an Arch user, it's also available in the [Arch User Repository](https://aur.archlinux.org/packages/trello-cli/)

## Usage

You need to create a configuration file with an API key and token to use this CLI. Ensure that you're logged in to Trello and run `trello auth` to get started.

To see a list of available commands, run `trello --help`. Each command contains subcommands e.g. `trello card:list`, `trello card:create`. To see all available subcommands, run `trello <command> --help`.

Most commands identify boards, lists, and cards by name, e.g. `--board "My Board" --list "To Do" --card "My card"`. All commands accept `--format json` or `--format csv` for machine-readable output.

### Reading card data

- `trello card:list` — Show all cards in a list. Flags: `--board`, `--list`
- `trello card:show` — Show card details. Flags: `--board`, `--list`, `--card`
- `trello card:get-by-id` — Show card details by ID. Flag: `--id`
- `trello card:assigned-to` — Show cards assigned to a user (default: `me`). Flag: `--user`
- `trello card:comments` — List comments on a card. Flags: `--board`, `--list`, `--card`
- `trello card:activity` — List recent activity on a card. Flags: `--board`, `--list`, `--card`, `--filter` (comma-separated action types, e.g. `commentCard,updateCard`)
- `trello card:attachments` — List attachments on a card. Flags: `--board`, `--list`, `--card`
- `trello card:checklists` — List checklists on a card. Flags: `--board`, `--list`, `--card`

### Creating and updating cards

- `trello card:create` — Create a card. Flags: `--name`, `--board`, `--list`, `--description`, `--due`, `--label` (repeatable), `--position` (`top` or `bottom`)
- `trello card:update` — Update a card's name, description, or due date. Flags: `--board`, `--list`, `--card`, `--name`, `--description`, `--due`, `--clear-due`. Dates accept natural language, e.g. `--due "next friday"`.
- `trello card:move` — Move a card to another list. Flags: `--board`, `--list`, `--card`, `--to`, `--position`
- `trello card:comment` — Add a comment to a card. Flags: `--board`, `--list`, `--card`, `--text`
- `trello card:attach` — Add an attachment to a card by URL. Flags: `--board`, `--list`, `--card`, `--url`, `--name`
- `trello card:label` — Add a label to a card. Flags: `--board`, `--list`, `--card`, `--label`
- `trello card:unlabel` — Remove a label from a card. Flags: `--board`, `--list`, `--card`, `--label`
- `trello card:assign` — Assign a user to a card. Flags: `--board`, `--list`, `--card`, `--user`
- `trello card:unassign` — Unassign a user from a card. Flags: `--board`, `--list`, `--card`, `--user`
- `trello card:checklist` — Add a checklist to a card. Flags: `--board`, `--list`, `--card`, `--name`
- `trello card:check-item` — Update a checklist item to `complete` or `incomplete`. Flags: `--board`, `--list`, `--card`, `--item`, `--state`, `--checklist`
- `trello card:archive` — Archive a card. Flags: `--board`, `--list`, `--card`
- `trello card:delete` — Delete a card. Flags: `--board`, `--list`, `--card`

### Updating boards, lists, and labels

- `trello board:update` — Update a board's name or description. Flags: `--board`, `--name`, `--description`
- `trello list:rename` — Rename a list. Flags: `--board`, `--list`, `--name`
- `trello label:update` — Update a label's text, creating it if needed. Flags: `--board`, `--color`, `--name`, `--old-name`

## Interactive Terminal UI

Launch a full-screen interactive terminal UI with:

```bash
trello interactive
```

### Views

- **Home** - Browse and filter your boards. Type to filter, press Enter to open a board.
- **Board** - View all lists and cards in a board, displayed as columns. Navigate with arrow keys.
- **Card Detail** - View full card details including description, labels, members, checklists, and attachments. Shows a breadcrumb trail (Board / List / Card) in the header.
- **My Cards** - View all cards assigned to you across boards.

### Keyboard Shortcuts

#### Home View

| Key | Action |
|-----|--------|
| Up/Down | Navigate boards |
| Enter | Open selected board |
| Type | Filter boards by name |
| m | View my assigned cards |
| s | Sync data from Trello |
| q / Esc | Quit |

#### Board View

| Key | Action |
|-----|--------|
| Arrow keys | Navigate between lists and cards |
| Enter | Open card detail |
| n | Create new card in selected list |
| L | Create new list |
| Esc | Back to home |
| ? | Show help |

#### Card Detail View

| Key | Action |
|-----|--------|
| e | Edit card name |
| D | Edit description |
| d | Set due date |
| l | Toggle labels |
| M | Toggle members |
| m | Move card to another list |
| c | Browse/toggle checklists |
| C | Create new checklist |
| a | View attachments |
| A | Add attachment |
| o | Open card in browser |
| x | Archive card |
| Esc | Back to board |
| ? | Show help |

### Configuration

The interactive UI can be configured via `~/.trello-cli/tui.json`:

```json
{
  "mouse": true,
  "syncIntervalMs": 300000,
  "defaultView": "home",
  "theme": {
    "primary": "cyan",
    "secondary": "blue",
    "accent": "green",
    "warning": "yellow",
    "error": "red",
    "muted": "gray"
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `mouse` | `true` | Enable mouse support. Override per-session with `--mouse` / `--no-mouse` flags. |
| `syncIntervalMs` | `300000` | Auto-sync interval in milliseconds (5 minutes). |
| `defaultView` | `"home"` | View to show on launch (`home`, `board`, `card-detail`, `my-cards`). |
| `theme` | See above | Color scheme. Values are any colors supported by [chalk](https://github.com/chalk/chalk). |

### On Windows

Depending on how `node.js` is setup, you may not be able to run `trello` straight from the command line as shown above. To remedy that, add the following to your Powershell profile (type `$profile` at the Powershell prompt to find where your profile is stored):

    function trello { & 'PATH_TO_NODE.EXE' 'PATH_TO_TRELLO_BIN' $args }

Replacing `PATH_TO_NODE.EXE` and `PATH_TO_TRELLO_BIN` with the values from your system.

You will then have the `trello` command available anywhere.

## Authentication

`trello-cli` can be configured in two ways:

1. Using `~/.trello-cli/<profile>/config.json`. Running the CLI explains how to generate tokens and will automatically create this file
2. Using the `TRELLO_TOKEN` and `TRELLO_API_KEY` environment variables. It is recommended to use option 1 to fetch these values, then set the environment variables and delete `config.json` if required.

# Examples

```bash
$ trello card:create --board "Inbox" --list "Inbox" --name "Quick card added from command line"
```

```bash
$ trello card:comments --board "Inbox" --list "Inbox" --card "Quick card added from command line"
```

```bash
$ trello card:activity --board "Inbox" --list "Inbox" --card "Quick card added from command line" --filter "commentCard,updateCard"
```

```bash
$ trello card:attachments --board "Inbox" --list "Inbox" --card "Quick card added from command line"
```

```bash
$ trello card:update --board "Inbox" --list "Inbox" --card "Quick card added from command line" --name "New name" --due "next friday"
```

```bash
$ trello interactive
```
