'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const archiveName = 'divorce-law-aid-v0.87.0.zip';
const expectedSha256 = '26336408cb5a3d3fd85cae7f5fb8df60aca02e68ad8e73caac52ea68bbe705a1';
const expectedSize = 41849620;
const expectedRootName = 'divorce-law-aid-v0.87.0';
const partDefinitions = [
  {
    name: 'divorce-law-aid-v0.87.0.zip.part01',
    size: 20924810,
    sha256: '5b077b31ac4158f30df49d7169cdb731e33918d557c205c2c934a4311251c307'
  },
  {
    name: 'divorce-law-aid-v0.87.0.zip.part02',
    size: 20924810,
    sha256: '6fcf7af80545cd2a44aa1e0c2325bbc980d1f5c604f0cde4043ccece38636c64'
  }
];
const carrierRoot = path.join(repositoryRoot, '.carrier');
const archivePath = path.join(carrierRoot, archiveName);
const runtimeRoot = path.join(repositoryRoot, '.runtime');
const applicationRoot = path.join(runtimeRoot, expectedRootName);

function fail(message) {
  console.error(`[divorce-law-aid-bootstrap] ${message}`);
  process.exit(1);
}

function digestFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: process.env,
    ...options
  });
  if (result.error) return { ok: false, error: result.error };
  return { ok: result.status === 0, status: result.status };
}

function prepareExactArchive() {
  const directArchive = path.join(repositoryRoot, archiveName);
  fs.rmSync(carrierRoot, { recursive: true, force: true });
  fs.mkdirSync(carrierRoot, { recursive: true });

  if (fs.existsSync(directArchive)) {
    fs.copyFileSync(directArchive, archivePath);
    console.log('[divorce-law-aid-bootstrap] using direct exact ZIP carrier');
    return;
  }

  const buffers = [];
  for (const part of partDefinitions) {
    const partPath = path.join(repositoryRoot, part.name);
    if (!fs.existsSync(partPath)) fail(`missing split carrier part ${part.name}`);
    const stat = fs.statSync(partPath);
    if (stat.size !== part.size) {
      fail(`split carrier part size mismatch for ${part.name}: expected ${part.size}, received ${stat.size}`);
    }
    const partDigest = digestFile(partPath);
    if (partDigest !== part.sha256) {
      fail(`split carrier part SHA-256 mismatch for ${part.name}: ${partDigest}`);
    }
    buffers.push(fs.readFileSync(partPath));
  }

  fs.writeFileSync(archivePath, Buffer.concat(buffers));
  console.log('[divorce-law-aid-bootstrap] reconstructed exact ZIP from two verified browser-uploadable parts');
}

prepareExactArchive();
const stat = fs.statSync(archivePath);
if (stat.size !== expectedSize) fail(`artifact size mismatch: expected ${expectedSize}, received ${stat.size}`);
const digest = digestFile(archivePath);
if (digest !== expectedSha256) fail(`artifact SHA-256 mismatch: ${digest}`);

const preflightRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dla-v087-provider-preflight-'));
try {
  const probe = run('unzip', ['-q', archivePath, '-d', preflightRoot]);
  if (!probe.ok) fail('provider-equivalent extraction preflight failed');
  const probeApplication = path.join(preflightRoot, expectedRootName);
  const packagePath = path.join(probeApplication, 'package.json');
  if (!fs.existsSync(packagePath)) fail(`missing expected root ${expectedRootName}`);
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.name !== 'divorce-law-aid' || pkg.version !== '0.87.0') fail('internal product identity mismatch');
  if (Object.keys(pkg.dependencies || {}).length !== 0) fail('unexpected runtime dependencies in sealed source');

  const exactArtifact = run(process.execPath, [
    path.join(probeApplication, 'scripts', 'exact-artifact-test-v087.js'),
    archivePath
  ], { cwd: probeApplication });
  if (!exactArtifact.ok) fail(`exact-artifact qualification failed with status ${exactArtifact.status ?? 'unknown'}`);

  for (const script of [
    'scripts/validate-v087-release.js',
    'scripts/validate-v38-controls.js',
    'scripts/check-js-syntax.js',
    'scripts/scan-release-secrets.js'
  ]) {
    const result = run(process.execPath, [path.join(probeApplication, script)], { cwd: probeApplication });
    if (!result.ok) fail(`${script} failed with status ${result.status ?? 'unknown'}`);
  }

  const audit = run('npm', ['audit', '--omit=dev', '--audit-level=high'], { cwd: probeApplication });
  if (!audit.ok) fail(`npm audit failed with status ${audit.status ?? 'unknown'}`);
} finally {
  fs.rmSync(preflightRoot, { recursive: true, force: true });
}

fs.rmSync(runtimeRoot, { recursive: true, force: true });
fs.mkdirSync(runtimeRoot, { recursive: true });

const pythonProgram = [
  'import pathlib, sys, zipfile',
  'archive=pathlib.Path(sys.argv[1])',
  'target=pathlib.Path(sys.argv[2]).resolve()',
  'with zipfile.ZipFile(archive) as z:',
  '  for info in z.infolist():',
  "    name=info.filename.replace('\\\\','/')",
  '    member=pathlib.PurePosixPath(name)',
  "    if member.is_absolute() or '..' in member.parts:",
  "      raise SystemExit(f'unsafe ZIP member: {name}')",
  '  z.extractall(target)'
].join('\n');

let extraction = run('python3', ['-c', pythonProgram, archivePath, runtimeRoot]);
if (!extraction.ok) {
  fs.rmSync(runtimeRoot, { recursive: true, force: true });
  fs.mkdirSync(runtimeRoot, { recursive: true });
  extraction = run('unzip', ['-q', archivePath, '-d', runtimeRoot]);
}
if (!extraction.ok) fail('safe runtime extraction failed');

const runtimePackagePath = path.join(applicationRoot, 'package.json');
if (!fs.existsSync(runtimePackagePath)) fail('runtime application root missing after extraction');
const runtimePackage = JSON.parse(fs.readFileSync(runtimePackagePath, 'utf8'));
if (runtimePackage.name !== 'divorce-law-aid' || runtimePackage.version !== '0.87.0') fail('runtime identity mismatch');

const install = run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: applicationRoot,
  env: { ...process.env, NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false' }
});
if (!install.ok) fail(`runtime locked install failed with status ${install.status ?? 'unknown'}`);

fs.rmSync(carrierRoot, { recursive: true, force: true });
console.log(`[divorce-law-aid-bootstrap] prepared exact Divorce Law Aid v${runtimePackage.version}`);
console.log(`[divorce-law-aid-bootstrap] sealed artifact SHA-256 ${digest}`);
console.log('[divorce-law-aid-bootstrap] split-carrier, exact-artifact, provider-equivalent, syntax, secret, and vulnerability gates passed');