import * as esbuild from 'esbuild';

const entryPoints = [
  'src/index.ts',
  'src/request-confirmations.ts'
];

await esbuild.build({
  entryPoints,
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  packages: 'external',
}); 