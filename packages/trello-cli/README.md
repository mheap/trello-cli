## Authentication

`trello-cli` can be configured in two ways:

1. Using `~/.trello-cli/<profile>/config.json`. Running the CLI explains how to generate tokens and will automatically create this file
2. Using the `TRELLO_TOKEN` and `TRELLO_API_KEY` environment variables. It is recommended to use option 1 to fetch these values, then set the environment variables and delete `config.json` if required.
