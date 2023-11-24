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

### On Windows

Depending on how `node.js` is setup, you may not be able to run `trello` straight from the command line as shown above. To remedy that, add the following to your Powershell profile (type `$profile` at the Powershell prompt to find where your profile is stored):

    function trello { & 'PATH_TO_NODE.EXE' 'PATH_TO_TRELLO_BIN' $args }

Replacing `PATH_TO_NODE.EXE` and `PATH_TO_TRELLO_BIN` with the values from your system.

You will then have the `trello` command available anywhere.

# Examples

```bash
$ trello card:create --board "Inbox" --list "Inbox" --name "Quick card added from command line"
```
