#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

try {
  // Build client (React frontend)
  console.log('📦 Building React frontend...');
  console.log('Installing client dependencies...');
  execSync('npm install', { cwd: clientDir, stdio: 'inherit' });

  console.log('Building React application...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  console.log('✅ React frontend built successfully!');

  // Build server (Express backend)
  console.log('\n📦 Building Express backend...');
  console.log('Installing server dependencies...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });

  console.log('Building TypeScript server...');
  execSync('npm run build', { cwd: serverDir, stdio: 'inherit' });
  console.log('✅ Express backend built successfully!');

  console.log('\n✅ Full-stack build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed!');
  console.error(error.message);
  process.exit(1);
}
