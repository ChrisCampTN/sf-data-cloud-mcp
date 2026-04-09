---
name: release
description: Version bump, build, test, tag, and prepare for npm publish
disable-model-invocation: true
---

# Release

Prepare a release of the MCP server package.

## Usage

```
/release [patch|minor|major]
```

Defaults to `patch` if no version bump type is specified.

## Steps

1. Ensure working directory is clean (`git status`)
2. Run full test suite (`npm test`) — abort if any fail
3. Run TypeScript build (`npm run build`) — abort if errors
4. Bump version in package.json (`npm version <type> --no-git-tag-version`)
5. Show the user the new version and ask for confirmation before proceeding
6. Commit: `git commit -am "chore: release v<version>"`
7. Tag: `git tag v<version>`
8. Show final instructions for publishing:
   - `git push origin main --tags`
   - `npm publish --access public`

## Important

- Never publish automatically — always show the commands and let the user decide
- Never force-push or skip hooks
- If tests fail, stop and report the failures
