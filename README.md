trello-cli is a CLI tool for Trello. Makes sense, right?

# Using trello-cli

* Run `npm install` in the same directory as `package.json` to install dependencies
* Run `./bin/trello` to generate basic config in your home directory.
* [Get an API key](https://trello.com/1/appKey/generate) and put it in `~/.trello-cli/config.json`
* Run `./bin/trello refresh` to refresh the list of Trello boards and lists.
* Run `./bin/trello` + follow the instructions

If you get stuck, you can always run `./bin/trello --help` or `./bin/trello command --help`

# If you installed globally
Instead of running `./bin/trello` just run `trello`.

# On Windows

Depending on how `node.js` is setup, you may not be able to run `trello` straight from the command line as shown above.  To remedy that, add the following to your Powershell profile (type `$profile` at the Powershell prompt to find where your profile is stored):

    function trello { & 'PATH_TO_NODE.EXE' 'PATH_TO_TRELLO_BIN' $args }

Replacing `PATH_TO_NODE.EXE` and `PATH_TO_TRELLO_BIN` with the values fro your system.

You will then have the `trello` command available anywhere. 