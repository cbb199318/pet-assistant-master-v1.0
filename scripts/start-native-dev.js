const os = require('os');
const { spawn } = require('child_process');
const path = require('path');

function isPrivateIpv4(address) {
  return (
    address.startsWith('10.') ||
    address.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function resolveLanIp() {
  const networkInterfaces = os.networkInterfaces();

  for (const addresses of Object.values(networkInterfaces)) {
    for (const info of addresses || []) {
      if (info.family === 'IPv4' && !info.internal && isPrivateIpv4(info.address)) {
        return info.address;
      }
    }
  }

  return '';
}

const lanIp = resolveLanIp();
const apiBaseUrl = lanIp ? `http://${lanIp}:4317` : '';
const projectRoot = path.resolve(__dirname, '..');

if (apiBaseUrl) {
  console.log(`[native-dev] EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}`);
} else {
  console.warn('[native-dev] 未探测到局域网 IPv4，将回退到应用内默认逻辑。');
}

const child = spawn(
  'npm',
  ['--prefix', 'frontend', 'run', 'start', '--', '--host', 'lan', '--clear'],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PUBLIC_API_PORT: '4317',
      ...(apiBaseUrl ? { EXPO_PUBLIC_API_BASE_URL: apiBaseUrl } : {}),
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
