const DEFAULT_URLS = {
  backendRoot: process.env.BACKEND_ROOT_URL || 'http://127.0.0.1:4317/',
  backendHealth: process.env.BACKEND_HEALTH_URL || 'http://127.0.0.1:4317/health',
  backendKnowledge: process.env.BACKEND_KNOWLEDGE_URL || 'http://127.0.0.1:4317/api/knowledge/categories',
  frontendWeb: process.env.FRONTEND_WEB_URL || 'http://127.0.0.1:8934/',
  adminWeb: process.env.ADMIN_WEB_URL || 'http://127.0.0.1:5617/',
};

async function checkUrl(name, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let extra = '';
    if (name === 'backendHealth') {
      const body = await response.json();
      extra = ` (${body.status || 'unknown'}, ${body.databaseType || 'unknown'})`;
    }

    console.log(`[health:check] OK ${name}: ${url}${extra}`);
  } catch (error) {
    throw new Error(`${name} -> ${url} failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  for (const [name, url] of Object.entries(DEFAULT_URLS)) {
    await checkUrl(name, url);
  }

  console.log('[health:check] all endpoints are reachable');
}

main().catch((error) => {
  console.error(`[health:check] ${error.message}`);
  process.exit(1);
});
