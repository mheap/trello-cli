---
"trello-cli": patch
---

Fix `card:update`'s `--description` flag, `card:create`'s `--description` flag,
`card:comment`'s `--text` flag, `board:create`'s `--description` flag, and the
interactive TUI's multiline description editor to send parameters in the JSON
request body instead of the URL query string for POST and PUT requests. This
resolves HTTP 414 errors that occurred when long text (around 900 Chinese
characters or more) pushed the percent-encoded URL past Trello's ~8KB limit,
causing updates to fail entirely.
