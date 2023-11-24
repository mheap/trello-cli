## Adding Features

This repository uses [changesets](https://github.com/changesets/changesets) to manage package versioning. When adding a new feature, run `npx changeset add` from the root directory. This will prompt you for a short description of the change and let you interactively select which packages you've edited, and if there are major, minor or patch level changes.

Commit the `.changesets` folder alongside your code when raising a pull request. The content of your changeset should be used as the body for your PR.

## Running Tests

From the root directory:

```bash
pnpm build
pnpm test
```

## Releasing

Releases are a two step process:

1. Bump versions by aggregating unprocessed changesets using `npx changeset version`
2. Commit all changes
3. Publish packages using `npx changeset publish`

GitHub Actions can perform both of these tasks. Any merge to `main` with unprocessed changesets results in a pull request with bumped versions. Any merge to main _without_ unprocessed changesets triggers `changeset publish`.

@mheap tends to run `changeset version` locally, commit the bumped versions with a commit message in the format `release(package): x.y.z` and push to main to trigger a release.
