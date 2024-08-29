#!/usr/bin/env node
test();
async function test(){
  console.log('hello')
  console.log('')
  console.debug('typeof module:', typeof module)
  console.debug('module:', module)
  console.log('')
  console.log('BFS:',     global.BrowserFS = require('./browser-fs-core.min'))
  console.log('BFS_DOM:', require('./browser-fs-dom.min'))
  console.log('main:',    require('./main'))

  const core = {make:x=>Object()};
  const preloaded = require('./main').preload(core);

  console.log('preloaded:', preloaded)
  console.log('default:', await (require('./main').default))
  console.log('preloaded:', preloaded)
  console.log('')
  console.log('bye')
};

/*
(typeof module === 'object')
&& (typeof exports === 'object')
&& exports && (module?.exports === exports))
&& module.exports = BrowserFS;
*/