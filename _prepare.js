#!/usr/bin/env node
const {dirname, basename, sep} = require('path');
const {readFileSync, writeFileSync, existsSync, rmSync} = require('fs');
const resolve = (n)=>{try{return require.resolve(n)}catch{}};
const resolveDir = (n)=>parent(resolve(n));
const parent = (n)=>n&&dirname(n);
const env = process.env;

const command = env.npm_command;
const lifecycle = env.npm_lifecycle_event;
if ( (lifecycle === 'prepare') && (command !== 'run-script')
  || (lifecycle === 'dependencies') && (command === 'install')
  || (lifecycle === 'dependencies') && (command === 'ci')
  || (lifecycle === 'install') && (command === 'exec') // npx
  ) {
  process.exit();
}

const root = (
  parent(resolveDir('.package-lock.json'))
  || env.npm_config_local_prefix
  || env.INIT_CWD
  || dirname(env.npm_package_json)
).concat(sep);
console.log('rootDir =', root);

const pkg = (
  (env.npm_package_name === 'osjs/browserfs-adapter' ?
    dirname(env.npm_package_json) : module?.path
  ) || env.INIT_CWD
).concat(sep);

writeFileSync(`${pkg}.timestamp-${command}-${lifecycle}.txt`, String(new Date()))

prepareAmd('browser-fs-core.min.js', '@browserfs/core/browser.min.js', 'BrowserFS');
prepareAmd('browser-fs-dom.min.js', '@browserfs/fs-dom/browser.min.js', 'BrowserFS_DOM');


function prepareAmd(target, source, external) {

  const sourceRoot = dirname(source) + '/src';
  const sourcePath = resolve(source);
  const targetPath = pkg + target;

  const fn = (s)=> s.slice(0, s.lastIndexOf('//#')) + (
`(__=>(typeof module === 'object')
  && (typeof exports === 'object')
  && (module?.exports === (exports||''))
   ? (module.exports = __)
   : (typeof define === 'function')
  && define.amd && define(__)
)(globalThis.${external} = ${external})
//# sourceMappingURL=${target}.map
` );

  return prepareFile(targetPath, sourcePath, false, fn)
  && [true, prepareSourcemap(targetPath, sourcePath, sourceRoot)];
}

function prepareSourcemap(targetPath, sourcePath, sourceRoot){
  targetPath += '.map';
  sourcePath += '.map';
  const fn = (s)=>s.replace('"sources"',
    `"sourceRoot": "${sourceRoot}",\n  $&`
  );

  return prepareFile(targetPath, sourcePath, true, fn);
}

function prepareFile(targetPath, sourcePath, clean, fn){

  if (!sourcePath?.startsWith(root)) {
    if (clean) rmSync(targetPath, {force: true});
    return;
  }

  const script = fn(readFileSync(sourcePath, 'utf-8'));

  if (!existsSync(targetPath)
  || (readFileSync(targetPath, 'utf-8') !== script)
  ){
    writeFileSync(targetPath, script, 'utf-8');
    console.log('prepared', basename(targetPath),
      '\t', 'from', dirname(sourcePath).replace(root,''));
    return true;
  }
}
