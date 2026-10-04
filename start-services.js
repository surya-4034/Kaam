import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = [
  { name: 'Backend API', cmd: 'node', args: ['index.js'], cwd: path.join(__dirname, 'server'), color: '\x1b[36m' },
  { name: 'Client App ', cmd: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'client-app'), color: '\x1b[33m' },
  { name: 'Worker App ', cmd: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'worker-app'), color: '\x1b[35m' },
  { name: 'Admin App  ', cmd: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'admin-app'), color: '\x1b[32m' },
];

console.log('\x1b[1m\x1b[34m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m  kaam (काम) - Standalone Multi-App Architecture\x1b[0m');
console.log('\x1b[1m\x1b[34m====================================================\x1b[0m');
console.log('⚡ Starting all 4 services with real SQLite DB connectivity...\n');

services.forEach(({ name, cmd, args, cwd, color }) => {
  const proc = spawn(cmd, args, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`\x1b[31m[${name} ERR]\x1b[0m ${line}`);
      }
    });
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m Process exited with code ${code}`);
  });
});
