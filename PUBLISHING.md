# Publishing Guide

## Quick Publish Commands

From the root directory:

```bash
# Patch version (1.0.1 -> 1.0.2) - Bug fixes
npm run publish:mcp

# Minor version (1.0.1 -> 1.1.0) - New features
npm run publish:mcp:minor

# Major version (1.0.1 -> 2.0.0) - Breaking changes
npm run publish:mcp:major
```

## What the Script Does

The `publish-mcp.js` script automates:

1. Builds the MCP server TypeScript code
2. Bumps the version in `packages/mcp-server/package.json`
3. Commits the version change
4. Publishes to npm
5. Creates a git tag
6. Pushes everything to GitHub

## Semantic Versioning

Follow semantic versioning (semver):

- **Patch** (1.0.x): Bug fixes, documentation updates, no API changes
- **Minor** (1.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes to the API

## Checking Current Version

```bash
# Local version
cat packages/mcp-server/package.json | grep version

# Published version on npm
npm view @houtini/geo-analyzer version
```

## Manual Publishing (if needed)

If you need to publish manually:

```bash
cd packages/mcp-server
npm run build
npm version patch  # or minor, major
npm publish
git push origin main --tags
```
