const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];
let shuttingDown = false;

function startProcess(label, args, envOverrides = {}) {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  child.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }

    if (code && code !== 0) {
      console.error(`[dev:all] ${label} exited with code ${code}`);
      shutdown(code);
    }
  });

  processes.push(child);
}

function shutdown(exitCode = 0) {
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  setTimeout(() => process.exit(exitCode), 150);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

startProcess('backend', ['--prefix', 'backend', 'run', 'start:dev'], {
  PORT: '4317',
});
startProcess('frontend-web', ['--prefix', 'frontend', 'run', 'web', '--', '--port', '8934', '--host', 'lan', '--clear'], {
  EXPO_PUBLIC_API_PORT: '4317',
});
startProcess('admin-web', ['--prefix', 'admin-web', 'run', 'dev'], {
  VITE_API_PORT: '4317',
});
