const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with code ${code}`));
    });
  });
}

async function main() {
  await runCommand(npmCommand, ['run', 'build:backend'], 'backend build');
  await runCommand(npxCommand, ['--prefix', 'frontend', 'tsc', '--noEmit', '-p', 'frontend/tsconfig.json'], 'frontend type check');
  await runCommand(npmCommand, ['run', 'build:admin'], 'admin build');
  console.log('[check:all] all checks passed');
}

main().catch((error) => {
  console.error(`[check:all] ${error.message}`);
  process.exit(1);
});
