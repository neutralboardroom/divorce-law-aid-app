'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const applicationRoot = path.join(repositoryRoot, '.runtime', 'divorce-law-aid-v0.87.0');
const commit = String(process.env.RENDER_GIT_COMMIT || '').trim();
const serviceId = String(process.env.RENDER_SERVICE_ID || '').trim();
const environment = { ...process.env };

if (environment.RENDER === 'true') {
  environment.DLA_ENVIRONMENT = environment.DLA_ENVIRONMENT || 'production';
  environment.DLA_DEPLOYMENT_ID = environment.DLA_DEPLOYMENT_ID || [serviceId || 'render', commit || 'current'].join(':');
  environment.DLA_RELEASE_CANDIDATE_ID = environment.DLA_RELEASE_CANDIDATE_ID || `DLA-0.87.0-${commit ? commit.slice(0, 12) : 'RENDER'}`;
}

const child = spawn(process.execPath, ['server.js'], {
  cwd: applicationRoot,
  env: environment,
  stdio: 'inherit'
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
