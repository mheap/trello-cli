trello-cli is a CLI tool for [Trello](http://www.trello.com). Makes sense, right?

[![Build Status](https://api.travis-ci.org/mheap/trello-cli.svg?branch=master)](https://travis-ci.org/mheap/trello-cli)

`trello-cli` requires a minimum NodeJS version of 6.9.4

# Using trello-cli

* Run `npm install` in the same directory as `package.json` to install dependencies
* Run `./bin/trello` to generate basic config in your home directory.
* [Get an API key](https://trello.com/app-key) and put it in `~/.trello-cli/config.json`
* Run `./bin/trello refresh` to refresh the list of Trello boards and lists.
* Run `./bin/trello` + follow the instructions

If you get stuck, you can always run `./bin/trello --help` or `./bin/trello command --help`

# If you installed globally
Instead of running `./bin/trello` just run `trello`.

# Supported API commands

trello-cli currently supports the following commands:

	add-board          Adds a new board with the specified name
	add-card           Add a card to a board
	add-list           Adds a new list to the spcified board with the specified name
	assigned-to-me     Show cards that are currently assigned to you
	close-board        Closes those board(s) where the specified text occurs in their name
	delete-card        Remove a card from a board
	move-all-cards     Move all cards from one list to another
	refresh            Refresh all your board/list names
	show-boards        Show the list of cached boards
	show-cards         Show the cards on a list
	show-labels        Show labels defined on a board
	show-list          DEPRECATED.  Show cards on a list (use 'show-cards' instead; command retained for backwards compatibility)
	show-lists         Show the list of cached lists

# On Windows

Depending on how `node.js` is setup, you may not be able to run `trello` straight from the command line as shown above.  To remedy that, add the following to your Powershell profile (type `$profile` at the Powershell prompt to find where your profile is stored):

    function trello { & 'PATH_TO_NODE.EXE' 'PATH_TO_TRELLO_BIN' $args }

Replacing `PATH_TO_NODE.EXE` and `PATH_TO_TRELLO_BIN` with the values from your system.

You will then have the `trello` command available anywhere.

# Examples

    # Add card:
    $ trello add-card -b "Inbox" -l "Inbox" "Quick card added from command line" -p bottom

    # Move all cards:
    $ trello move-all-cards -b "GTD" -l "Completed next actions" -c "GTD" -d "Completed next actions (Nov 2-8)"

