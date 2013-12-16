trello-cli is a CLI tool for Trello. Makes sense, right?

# Using trello-cli

* Run `npm install` in the same directory as `package.json` to install dependencies
* Copy `config.json.dist` to `config.json`
* [Get an API key](https://trello.com/1/appKey/generate) and put it in `config.json`
* Run `./bin/trello` + follow the instructions

If you get stuck, you can always run `./bin/trello --help` or `./bin/trello command --help`

# If you installed globally
This is a bit of an issue at the minute, but you'll need to copy `config.json.dist` to `config.json` in `/usr/lib/node_modules`. I'm working on a nicer way to do things
