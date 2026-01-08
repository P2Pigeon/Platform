#!/usr/bin/env node
/**
 * Script to add P2Pigeon watermark headers and clean up legacy comments
 */

const fs = require('fs');
const path = require('path');

const TODAY = new Date().toISOString().split('T')[0];

const HEADER_TS = `/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: ${TODAY}
 */

`;

// Patterns to remove from comments (legacy cleanup)
const PATTERNS_TO_REMOVE = [
  /\(replaces Chakra[^)]*\)/gi,
  /\/\/.*replaces Chakra.*$/gim,
  /\/\/.*Chakra.*replacement.*$/gim,
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove unwanted patterns
  for (const pattern of PATTERNS_TO_REMOVE) {
    const newContent = content.replace(pattern, '');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  // Clean up empty comment lines that might remain
  content = content.replace(/\/\*\*\s*\n(\s*\*\s*\n)+\s*\*\//g, '');
  
  // Check if file already has P2Pigeon header
  if (!content.includes('P2Pigeon - Secure P2P Communication Platform')) {
    // Remove existing file-level JSDoc comment if it exists
    const existingHeaderMatch = content.match(/^\/\*\*[\s\S]*?\*\/\s*\n/);
    if (existingHeaderMatch) {
      // Keep the @file and @description parts, but add our header before
      content = HEADER_TS + content;
    } else {
      content = HEADER_TS + content;
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
    return true;
  }
  return false;
}

function walkDir(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        files.push(...walkDir(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Process frontend/src
const srcDir = path.join(__dirname, '../frontend/src');
const files = walkDir(srcDir, ['.ts', '.tsx']);

console.log(`Found ${files.length} files to process...`);

let updatedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\nDone! Updated ${updatedCount} files.`);
