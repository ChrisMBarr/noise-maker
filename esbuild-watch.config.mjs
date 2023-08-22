import * as esbuild from 'esbuild';
import { esBuildOptions } from './esbuild.config.mjs';

async function watch() {
  const esBuildWatchOptions = { ...esBuildOptions };
  esBuildWatchOptions.minify = false;
  let ctx = await esbuild.context(esBuildWatchOptions);
  await ctx.watch();
  console.log('ESBuild Watching...');
}
watch();
