import * as esbuild from 'esbuild';

/**
 * @typedef {esbuild.BuildOptions}
 */
export const esBuildOptions = {
  stdin: { contents: '' },
  allowOverwrite: true,
  bundle: true,
  minify: true,
  sourcemap: true,
  inject: [
    'src/main.ts',
    'src/code-output.ts',
    'src/controls.ts',
    'src/handles.ts',
    'src/helpers.ts',
    'src/lighting.ts',
    'src/presets.ts',
  ],
  outfile: 'app/index.js',
};

await esbuild.build(esBuildOptions);
