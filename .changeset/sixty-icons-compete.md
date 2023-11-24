---
"trello-cli": patch
---

Make tests pass on Node 20.

This is a workaround for a bug in Jest that reports the parent CLI exit code instead of the test suite exit code.

See https://github.com/jestjs/jest/issues/14501

