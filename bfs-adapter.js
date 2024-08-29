
if (typeof define !== 'function') { var define = require('./amdefine')(module) }

define(["./main"], ({browserfs, mime})=>{

  return (async()=>(
    browserfs = await browserfs,
    mime = await mime,
    Object.assign(adapterFactory, {
      browserfs, upgradeFs, mountHandler,
      mountOperations, vfsOperations,
      adapter, mime, vfsMime
    })
  ))();

  function adapterFactory(core) {
    core.singleton('osjs/bfs-adapter', () => adapter(core, browserfs));
    return core.make('osjs/bfs-adapter');
  };

  function adapter(core, bfs) {

    const _ = (...args) => core.make('osjs/locale').translate(...args);
    ///const {pathJoin} = core.make('osjs/fs');
    const mime = core.make('osjs/vfs').mime || vfsMime(core);

    const {promises, constants, getMounts} = bfs.fs;
    const fs = upgradeFs(promises, constants, _);

    const {mount, unmount, resolve} = mountOperations(mountHandler(bfs), _);
    const {readdir, ...others} = vfsOperations(fs, constants, resolve, mime, _);

    return {mount, unmount, ...others,
      readdir: (p,rp) => readdir(p).catch(
        // handle virtual dir to mountpoints
        (e) => e?.code !== 'EIO' ? Promise.reject(e) : (
          rp = resolve(p), (rp === '/') || (rp += '/'),
          Object.keys(getMounts()).filter(m => m.startsWith(rp))
            .map(m => m.slice(rp.length)).filter((v,i,a) => a.indexOf(v) === i)
            .map(m => ({isDirectory: true, isFile: false, mime: null,
              path: p.path + m, filename: m
            }))
        )
      )
    };
  }

  function vfsMime(core) {
    const defaultType = 'application/octet-stream';
    const coreType = (f) => core.config('mime')?.filenames?.[basename(f)];
    const basename = (path) => path.split('/').filter(Boolean).pop();

    mime.define(core.config('mime')?.define || {}, {force: true});

    return (filename) => (
      coreType(filename) || mime.getType(filename) || defaultType
    )
  };

  
  /**
   * OS.js VFS operations interface
   */
  function vfsOperations(fs, constants, resolve, mime, _) {

    const basename = (p) => p.slice(p.lastIndexOf('/')+1);
    const join = (a,b) => a.replace(/\/?$/, '/') + b;
    const is = (val, values) => (values.indexOf(val) !== -1);

    const r = resolve;
    const VOID = undefined;
    const TRUE = ()=>true;
    const FALSE = ()=>false;
    const THROW = (e)=>Promise.reject(e);
    const _catch = (...codes)=>(e)=>is(e.code, ...codes)||THROW(e);
    const EEXIST = _catch('EEXIST');
    const {F_OK} = constants; // 0

    const INT = (r) => r === (r|0) ? r : -1;
    const BUFFER = (r) => ( (r.length === r.buffer.byteLength) ?
      r.buffer :
      r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength)
    );

    const PATH = (o)=>r(o);
    const DATA = async(o)=>(
      Uint8Array.from(await o.arrayBuffer?.() ?? o)
    );

    // wrapper function name options then catch condition
    // path/parameter options resolve second optional
    const w = (fn,fo,t,c,cc)=>async(p,o)=>{
      f = fs[fn];
      rp = r(p);
      sp = await fo?.(o) ?? fo ;
      oc = cc && !o?.[cc] ? null : c ;

      console.debug(`${fn} ${rp} ${sp}`);
      return f(rp,sp).then(t, oc);
    }

    return {
      /* inode operations */
      stat,
      exist:  w('access', F_OK, TRUE, FALSE),
      unlink: w('remove', VOID, TRUE),
      rename: w('move',   PATH, TRUE),
      copy:   w('copy',   PATH, TRUE),

      /* directory operations */
      search: undefined,
      readdir,
      mkdir:  w('mkdir',  VOID, TRUE, EEXIST, 'ensure'),

      /* file operations */
      readfile:  w('readFile' ,  VOID, BUFFER),
      writefile: w('writeFile',  DATA, INT),
      touch:     w('ensureFile', VOID, TRUE),
    };

    async function stat(p,rp,n) {

      const createStat = (stat) => stat && ({
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        mime: stat.isFile() ? mime(basename(p)) : null,
        size: stat.size,
        path: p,
        filename: basename(p),
        stat
      });

      // handle concurrent modification on readdir/search()
      let c1 = (e)=> is(e.code, 'ENOENT','EACCES') ? null : THROW(e);

      // handle stat() after valid access() check
      const c2 = (e)=> ({
        isDirectory: () => false,
        isFile: () => true,
        size: 0
      });

      p.path ?
        (rp = r(p), p = p.path, c1 = undefined) :   // stat()
        (rp = join(rp,n), p = join(p,n), c1 = c1) ; // readdir/search()

      return fs.access(rp, F_OK).catch(_catch('ENOTSUP')).then(
        ()=> fs.stat(rp).catch(c1).catch(c2).then(createStat), c1
      );
    }

    async function readdir(p, rp) {
      rp = r(p); p = p.path;
      return fs.readdir(rp).then(
        (a) => Promise.all(a.map(n => stat(p,rp,n)))
      );
    }

    function search(){ return THROW('TODO') }

  } // function vfsOperations(fs, constants, resolve, _)


  /**
   * Add extra/unimplemented fs methods
   */
  function upgradeFs(fs, constants, _) {

    const dirname = (p)=> p.slice(0, p.lastIndexOf('/'));
    const ensure = (is,read,make,...args) => (p)=>(
      p && fs.stat(p).then(
        s => s[is]() || fs[read](p), // true || throw
        e => e.code !== 'ENOENT' ? Promise.reject(e) :
          ensureDir(dirname(p)).then(()=>fs[make](p,...args))
      )
    );
    const ensureDir = ensure('isDirectory', 'readdir', 'mkdir');
    const ensureFile = ensure('isFile', 'readFile', 'writeFile', '');

    return Object.assign(Object.create(fs), {

      /* node-fs */
      // no upgrade needed

      /* fs-extra */
      ensureDir, ensureFile,
      remove:  (from    ) => recurse(from, null, -1),
      move:    (from, to) => recurse(from, to, 0),
      copy:    (from, to) => recurse(from, to, 1),
    });

    async function recurse(src, dst, mode, depth = 0) {
      const rm = mode <= 0;
      const cp = mode >= 0;
      const stat = await fs.stat(src);
      const error = (msg) => {
        const label = _('LBL_' + (rm?'DELETE' : cp?'COPY' : 'MOVE'));
        const request = `${label} ${src} (${msg})`;
        return Error(_('ERR_REQUEST_NOT_OK', request));
      }

      if (cp && (src === dst)) return;
      if (cp && dst.startsWith(`${src}/`)) throw error('Recursion');

      if (!depth) {
        cp && await ensureDir(dirname(dst));
      }

      if (stat?.isFile()) {
        cp && await fs.writeFile(dst, await fs.readFile(src));
        rm && await fs.unlink(src);
        return;
      }
      if (stat?.isDirectory()) {
        cp && await fs.mkdir(dst).catch(
          (e) => (e.code === 'EEXIST') || Promise.reject(e)
        );
        for(let name of await fs.readdir(src)) {
          await recurse(`${src}/${name}`, `${dst}/${name}`, mode, depth + 1);
        }
        rm && await fs.rmdir(src);
        return;
      }
      throw error('Unknown file type');
    }

  } // function upgradeFs(fs, constants)


  /**
   * OS.js FileSystem mountpoint interface
   */
  function mountOperations({buildConfig, mountMappings, unmountMappings, normalize}, _) {

    const this_mountMap = Object.create(null);
    const join = (a,b) => (a === '/' ? '' : a) + b;

    return {mount, unmount, getmount, getmounts, resolve};

    async function mount(options, mount) {
      const name = mount.name;
      if (name in this_mountMap) {
        throw new Error(_('ERR_VFS_MOUNT_ALREADY_MOUNTED', name));
      }

      const config = mount.attributes || {};
      const {root, mountpoint} = config;
      const mappings = await buildConfig(config, mountpoint?? root?? mount.root);
      mountMappings(mappings);
      mount.mappings = mappings;
      mount.path = normalize(root?? mountpoint?? mount.root);

      this_mountMap[name] = mount;
      return true;
    }

    async function unmount(options, mount) {
      const name = mount.name;
      if (!(name in this_mountMap)) {
        throw new Error(_('ERR_VFS_MOUNT_NOT_MOUNTED', name));
      }

      unmountMappings(mount.mappings);
      delete mount.mappings;
      delete mount.path;

      delete this_mountMap[name];
      return true;
    }

    function getmount(name) {
      if (!(name in this_mountMap)) {
        throw new Error(_('ERR_VFS_MOUNT_NOT_MOUNTED', name));
      }
      return this_mountMap[name];
    }

    function getmounts() {
      return Object.values(this_mountMap);
    }

    function resolve({path}) {
      const re = /^([\w-_]+):+(.*)/;
      const match = String(path).replace(/\+/g, '/').match(re);
      if (!match) {
        throw new Error(_('ERR_VFS_PATH_FORMAT_INVALID', path));
      }

      return join(getmount(match[1]).path, normalize(match[2]));
    }

  } // function mountOperations(handler, translate)


  /**
   * Variation of BrowserFS::configure()
   * To handle concurrent initialize/finalize.
   */
  function mountHandler(browserfs) {

    const {
      ApiError, ErrorCode, getFileSystem,
      fs: {mount, getMount, umount},
      // path: {normalizeString}
    } = browserfs;

    // const normalize = (path) => '/' + normalizeString(String(path));

    const is = (type, o) => o && (type === typeof o);
    const all = (a) => a.every(e => !!e);
    const isFsName = (o) => is('string', o);
    const isFsConfig = (o) => is('object', o) && isFsName(o.fs);
    const isFileSystem = (o) => is('object', o) && all([
      is('object', o.metadata),
      is('function', o.whenReady),
      isFsName(o.constructor?.Name)
    ]);

    return {
      buildConfig,
      mountMappings,
      unmountMappings,
      mappingSort,
      normalize
    }

    function normalize(path) {
      return '/' +
      String(path).split('/').reduce((a,s)=>{
        (s === '..') ? a.pop() :
        (s === '.') ? void 0 :
        (s) && a.push(s) ;
        return a;
      }, []).join('/');
    }

    async function getFs(config) {
      const {fs, ...options} = config;
      for(let key in options) if (key.startsWith('/')) delete options[key];
      return getFileSystem({fs, options: options.options || options});
    }

    async function buildConfig(config, root = '/', mappings = {}, _) {

      root = normalize(root);

      if (mappings[root]) {
        throw new ApiError(ErrorCode.EINVAL, 'Duplicate mapping: ' + root);
      }

      if (isFsName(config))     mappings[root] = getFs({fs: config});
      if (isFsConfig(config))   mappings[root] = getFs(config);
      if (isFileSystem(config)) mappings[root] = config;

      const mountpoints = Object.keys(Object(config)).filter(k=>k.startsWith('/'));
      for(let key of mountpoints) buildConfig(config[key], root + key, mappings, -1);

      if (!_) {
        await Promise.all(Object.entries(mappings).map(
          ([k, p]) => p.then(v => mappings[k] = v)
        ));
      }
      return mappings;
    }

    function mountMappings(mappings) {

      const keys = Object.keys(mappings).sort(mappingSort);
      const msg = (k) => `Can not mount "${k}" since the filesystem is unavailable.`;

      for (const k of keys) {
        if (!mappings[k].constructor.isAvailable()) {
           throw new ApiError(ErrorCode.EINVAL,msg(k));
        }
      }

      let i = -1;
      try {
        while(++i < keys.length) mount(keys[i], mappings[keys[i]]);
      }
      catch (e) {
        while(--i >= 0) try { umount(keys[i]) } catch(_) {};
        throw e;
      }
    }

    function unmountMappings(mappings) {

      const keys = Object.keys(mappings).sort(mappingSort).reverse();

      for (const k of keys) {
        if (getMount(k) === mappings[k]) {
           try { umount(keys[i]) } catch(_) {};
        }
      }
    }

    function mappingSort(a, b) {
      a = a.split('/').filter(n => !!n);
      b = b.split('/').filter(n => !!n);
      let i = 0;
      while(a[i] && (a[i] === b[i])) i++;
      if (!a[i]) return -1;
      if (!b[i]) return  1;
      return a[i].localeCompare(b[i]);
    }

  } // function mountHandler(browserfs)


}); //=== endof module define() ===//
