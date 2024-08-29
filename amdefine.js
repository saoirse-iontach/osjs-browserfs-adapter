module.exports = (module, {exports} = module)=> function define(...args) {

  const definitions = args.pop();
  const dependenciesIds = args.pop() || ["require", "exports", "module"];

  if (typeof definitions !== 'function') return void (module.exports = definitions);

  const wp = !!(__webpack_require__);
  const cwd = module.id.slice(0, module.id.lastIndexOf('/')+1);
  const wprequire = (id)=> __webpack_require__(id.replace('./', cwd) + '.js');

  const dependencies = dependenciesIds.map(identifier =>(
    ({ module, exports, require: (d,c)=> process.nextTick(()=> define(d,c)) })
    [identifier] || (wp ? wprequire(identifier) : require(identifier))
  ));

  const result = definitions(...dependencies);

  if (result !== undefined) module.exports = result;

};
