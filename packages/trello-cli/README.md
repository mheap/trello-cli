# Trello CLI

## Installation

> Trello CLI requires node 18+

```bash
npm install -g trello-cli
```

If you're an Arch user, it's also available in the [Arch User Repository](https://aur.archlinux.org/packages/trello-cli/)

## Usage

You need to create a configuration file with an API key and token to use this CLI. Ensure that you're logged in to Trello and run `trello auth` to get started.

To see a list of available commands, run `trello --help`. Each command contains subcommands e.g.:

- `trello card`
  - `trello card:list`
  - `trello card:create`
  - `trello card:delete`
  - And more

To see all available subcommands, run `trello <command> --help` e.g. `trello card --help`

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
$ trello interactive
```
