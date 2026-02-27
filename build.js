#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, 'server');

try {
  console.log('Installing server dependencies...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });

  console.log('\nBuilding TypeScript...');
  execSync('npm run build', { cwd: serverDir, stdio: 'inherit' });

  console.log('\n✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}
