#!/usr/bin/env node
import { existsSync, readdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';

const projectRoot = resolve(import.meta.dirname, '..');
const postsDir = join(projectRoot, 'src', 'content', 'posts');
const assetsDir = join(projectRoot, 'public', 'assets');
const distDir = join(projectRoot, 'dist');

interface CleanResult {
  posts: number;
  assets: number;
  dist: boolean;
}

function cleanDirectory(dir: string, pattern?: RegExp): number {
  if (!existsSync(dir)) {
    return 0;
  }

  const entries = readdirSync(dir);
  let count = 0;

  for (const entry of entries) {
    if (entry.startsWith('.')) continue; // .gitkeep 등 유지
    if (pattern && !pattern.test(entry)) continue;

    const fullPath = join(dir, entry);
    rmSync(fullPath, { recursive: true });
    count++;
  }

  return count;
}

function clean(): CleanResult {
  const postsCount = cleanDirectory(postsDir, /\.md$/);
  const assetsCount = cleanDirectory(assetsDir);

  let distCleaned = false;
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true });
    distCleaned = true;
  }

  return { posts: postsCount, assets: assetsCount, dist: distCleaned };
}

function main() {
  console.log('🧹 Cleaning synced content...\n');

  const result = clean();

  if (result.posts > 0) {
    console.log(`📄 Posts: ${result.posts} files removed`);
  } else {
    console.log('📄 Posts: already clean');
  }

  if (result.assets > 0) {
    console.log(`🖼️  Assets: ${result.assets} directories removed`);
  } else {
    console.log('🖼️  Assets: already clean');
  }

  if (result.dist) {
    console.log('📦 Dist: build output removed');
  } else {
    console.log('📦 Dist: no build output found');
  }

  console.log('\n✅ Clean complete!');
}

export { clean, cleanDirectory };

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
