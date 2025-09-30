# NPM Publishing Guide

## Ready to Publish! ✅

The package is now configured and ready to publish to npm as `@houtini/geo-analyzer`.

## Before Publishing

1. **Ensure you're logged into npm:**
   ```bash
   npm login
   # Follow prompts to authenticate with your npm account
   ```

2. **Verify you have permissions for @houtini scope:**
   - Visit https://www.npmjs.com/settings/houtini/packages
   - Ensure you're a member of the @houtini organization
   - Or create the scope if it doesn't exist

## Publishing Steps

### Option 1: Standard Publish

```bash
cd packages/mcp-server
npm publish --access public
```

### Option 2: Test First (Recommended)

```bash
cd packages/mcp-server

# Create a test package
npm pack

# This creates: houtini-geo-analyzer-1.0.0.tgz
# Test install locally:
npm install -g ./houtini-geo-analyzer-1.0.0.tgz

# Test the CLI:
geo-analyzer
# Should show the error about GEO_WORKER_URL (expected behaviour)

# If everything works, publish:
npm publish --access public
```

### Option 3: Dry Run First

```bash
cd packages/mcp-server

# See what will be published without actually publishing
npm publish --dry-run --access public

# If output looks good, publish for real:
npm publish --access public
```

## Post-Publishing

### 1. Verify Publication
Visit: https://www.npmjs.com/package/@houtini/geo-analyzer

### 2. Test Installation
```bash
# In a different directory:
npx @houtini/geo-analyzer
# Should show the GEO_WORKER_URL error message
```

### 3. Create Git Tag
```bash
cd C:\MCP\geo-analyzer
git tag -a v1.0.0 -m "Release v1.0.0: Initial public release"
git push origin v1.0.0
```

### 4. Create GitHub Release
1. Go to https://github.com/houtini-ai/geo-analyzer/releases
2. Click "Draft a new release"
3. Select tag: v1.0.0
4. Title: "v1.0.0 - Initial Release"
5. Description:
   ```markdown
   ## 🚀 Initial Release

   GEO Analyzer MCP is now available on npm!

   ### Features
   - ✅ Detailed GEO analysis via MCP server
   - ✅ Deploy your own Cloudflare Worker
   - ✅ Choose any LLM model (Llama 3.3, Mistral, etc)
   - ✅ Full control over analysis pipeline
   - ✅ Three powerful tools: analyze_url, compare_extractability, validate_rewrite

   ### Installation
   ```bash
   npm install -g @houtini/geo-analyzer
   ```

   Or use with npx:
   ```bash
   npx @houtini/geo-analyzer
   ```

   ### Quick Start
   See the [README](https://github.com/houtini-ai/geo-analyzer#readme) for full setup instructions.
   ```
6. Publish release

## Troubleshooting

### "You do not have permission to publish"
- Ensure you're logged in: `npm whoami`
- Check organization membership at npmjs.com
- Verify publishConfig.access is "public" in package.json

### "Package name taken"
- The @houtini scope should prevent conflicts
- If @houtini doesn't exist, create it at npmjs.com

### "File not found" errors
- Run `npm run build` first
- Check that dist/index.js exists
- Verify package.json "files" field includes dist/**/*

## Package Contents

What gets published:
```
@houtini/geo-analyzer@1.0.0
├── dist/
│   └── index.js (26.3 kB)
├── LICENSE (1.1 kB)
├── README.md (15.5 kB)
└── package.json (1.5 kB)

Total: ~44.4 kB unpacked
```

## Future Releases

For version updates:
```bash
cd packages/mcp-server

# Bump version (patch, minor, or major)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Push changes
git push && git push --tags

# Publish new version
npm publish --access public
```

## Success Criteria

After publishing, verify:
- ✅ Package appears at https://www.npmjs.com/package/@houtini/geo-analyzer
- ✅ `npx @houtini/geo-analyzer` works (shows expected error about GEO_WORKER_URL)
- ✅ Installation works: `npm install -g @houtini/geo-analyzer`
- ✅ README displays correctly on npm page
- ✅ GitHub tag v1.0.0 exists
- ✅ GitHub release published

---

**Ready to publish?** Run: `npm publish --access public` from `packages/mcp-server`
