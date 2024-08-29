if (typeof define !== 'function') { var define = require('./amdefine')(module) }
if (require.include) {
  // Webpack
  require.include('./bfs-adapter');
  require.include('./broofa-mime');
  require('./browser-fs-core.min');
  require('./browser-fs-dom.min');
}
define(function(require, exports, module){
const P = Promise,  O = Object,
  clone = (s, n, t={})=>(n.split(' ').forEach(k=>t[k]=s[k]), t);

  // AMD with Webpack compat

  if (require.context) {
    const context = require.context('.', false, /\.js$/);
    require = ([m],r)=> r(context.resolve(m.slice(2)));
  }

  exports.adapter = new P(r=>(
    require(['./bfs-adapter'], r)
  ));

  exports.mime = new P(r=>(
    require(['./broofa-mime'], r)
  ));

  exports.core = new P(r=>(
    require(['./browser-fs-core.min'], r)
  ));

  exports.dom = new P(r=>exports.core.then(_=>
    require(['./browser-fs-dom.min'], r)
  ));


  exports.browserfs = P.all([
    exports.core, exports.dom,
  ]).then(([core, ...plugins])=>{

    const BCT = { // BackendConstructorType
      Name: 'string',
      Options:'object',
      isAvailable:'function',
      Create: 'function'
    };
    const get = (o,n) => o?.[n] || undefined;
    const has = (o,n,t)=>(t === typeof get(o,n));
    /* */ has.bind = (o)=>([n,t])=>has(o,n,t);
    const is = (type)=>(object)=>(
      O.entries(type).every(has.bind(object))
    );

    const imports = plugins.flatMap(O.values);
    const backends = imports.filter(is(BCT));
    backends.map(core.registerBackend);

    core.fs.umount('/');

    return clone(core, 'ApiError ErrorCode registerBackend getFileSystem',
      {fs: clone(core.fs, 'mount umount getMount getMounts promises constants')}
    );

  });


exports.default = P.all(
 O.entries(exports).map(
   ([k,v])=> v.then(v => [k,v])
 )
).then(O.fromEntries);

exports.preload = (core)=>{ const
 up = t=> exports.adapter.then(f => O.assign(t, f(core))),
 mount = (_,m,a)=> (a = m._adapter, a.mount = r, up(a).then(a => a.mount(_,m))),
 r = t=> P.reject('pending init'),
 a = {mount, unmount: r};

 ('stat exist unlink rename copy search '
 +'readdir mkdir readfile writefile touch')
 .split(' ').forEach(k=> a[k]=r);

 return up(a),a;
};

module.exports = O.assign(exports.preload, exports);

});