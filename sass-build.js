import * as sass from 'sass';
import { promisify } from 'util';
import { writeFile } from 'fs';
const sassRenderPromise = promisify(sass.render);
const writeFilePromise = promisify(writeFile);

const sourceFile = 'src/styles.scss';
const outFilePath = 'app/styles.css';

async function main() {
  const styleResult = await sassRenderPromise({
    file: `${process.cwd()}/${sourceFile}`,
    outFile: `${process.cwd()}/${outFilePath}`,
    sourceMap: true,
    sourceMapContents: true,
    outputStyle: 'compressed',
  });

  await writeFilePromise(outFilePath, styleResult.css, 'utf8');
  await writeFilePromise(`${outFilePath}.map`, styleResult.map, 'utf8');
}
main();
