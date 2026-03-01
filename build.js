#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

try {
  // Build client (React frontend)
  console.log('\n═══════════════════════════════════════════════');
  console.log('  📦 Building React Frontend (Client)');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('📌 Installing client dependencies...');
  execSync('npm install', { cwd: clientDir, stdio: 'inherit' });

  console.log('\n🔨 Compiling React application...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  
  // Verify client dist was created
  const clientDistPath = path.join(clientDir, 'dist');
  if (!fs.existsSync(clientDistPath)) {
    throw new Error(`❌ Client dist directory not created at ${clientDistPath}`);
  }
  
  const indexPath = path.join(clientDistPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`❌ index.html not found in client dist at ${indexPath}`);
  }
  
  console.log('✅ React frontend built successfully!');
  console.log('   Build location:', clientDistPath);
  console.log('   Files:');
  const files = fs.readdirSync(clientDistPath);
  files.slice(0, 5).forEach(file => console.log(`     - ${file}`));
  if (files.length > 5) console.log(`     ... and ${files.length - 5} more files`);

  // Build server (Express backend)
  console.log('\n═══════════════════════════════════════════════');
  console.log('  📦 Building Express Backend (Server)');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('📌 Installing server dependencies...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });

  console.log('\n🔨 Compiling TypeScript server...');
  execSync('npm run build', { cwd: serverDir, stdio: 'inherit' });
  
  // Verify server dist was created
  const serverDistPath = path.join(serverDir, 'dist');
  if (!fs.existsSync(serverDistPath)) {
    throw new Error(`❌ Server dist directory not created at ${serverDistPath}`);
  }
  
  const serverIndexPath = path.join(serverDistPath, 'index.js');
  if (!fs.existsSync(serverIndexPath)) {
    throw new Error(`❌ index.js not found in server dist at ${serverIndexPath}`);
  }
  
  console.log('✅ Express backend built successfully!');
  console.log('   Build location:', serverDistPath);

  // Final verification
  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ Full-Stack Build Completed Successfully!');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('📊 Build Summary:');
  console.log(`  ✓ Client build: ${clientDistPath}`);
  console.log(`  ✓ Server build: ${serverDistPath}`);
  console.log('\n🚀 Ready to start server with: npm start');
  
  process.exit(0);
} catch (error) {
  console.error('\n═══════════════════════════════════════════════');
  console.error('  ❌ Build Failed!');
  console.error('═══════════════════════════════════════════════\n');
  console.error('Error:', error.message);
  console.error('\nCommon fixes:');
  console.error('  1. Check Node.js version (should be 18+)');
  console.error('  2. Delete node_modules and package-lock.json, then retry');
  console.error('  3. Check for syntax errors in code');
  console.error('  4. Ensure all dependencies are installed\n');
  process.exit(1);
}
