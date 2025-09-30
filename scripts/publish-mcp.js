#!/usr/bin/env node

/**
 * Publish script for @houtini/geo-analyzer MCP server
 * Usage: node scripts/publish-mcp.js [patch|minor|major]
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const mcpDir = join(rootDir, 'packages', 'mcp-server');
const packageJsonPath = join(mcpDir, 'package.json');

function exec(command, cwd = mcpDir) {
  try {
    return execSync(command, { cwd, stdio: 'inherit' });
  } catch (error) {
    process.exit(1);
  }
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return pkg.version;
}

function bumpVersion(type = 'patch') {
  const validTypes = ['patch', 'minor', 'major'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid version type: ${type}. Use patch, minor, or major.`);
  }
  
  exec(`npm version ${type} --no-git-tag-version`, mcpDir);
  return getCurrentVersion();
}

function main() {
  const versionType = process.argv[2] || 'patch';
  
  const currentVersion = getCurrentVersion();
  
  exec('npm run build', mcpDir);
  
  const newVersion = bumpVersion(versionType);
  
  exec(`git add ${packageJsonPath}`, rootDir);
  exec(`git commit -m "chore(mcp): bump version from ${currentVersion} to ${newVersion}"`, rootDir);
  
  exec('npm publish', mcpDir);
  
  exec(`git tag @houtini/geo-analyzer@${newVersion}`, rootDir);
  exec('git push origin main --tags', rootDir);
}

main();
