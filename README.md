<img align="right" src="https://www.tutorialkart.com/wp-content/uploads/2017/09/node-fs.png" height=70>
<img align="right" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-footer.png" height=45>

# OS.js BrowserFS Adapter

[![Home](https://img.shields.io/badge/osjs-home-572a79.svg)](https://www.os-js.org)
[![Doc](https://img.shields.io/badge/osjs-doc-5e96cd.svg)](https://manual.os-js.org)
[![Chat](https://img.shields.io/badge/osjs-chat-0dbd8b.svg)](https://gitter.im/os-js/OS.js)
[![Forum](https://img.shields.io/badge/osjs-forum-1f883d.svg)](https://community.os-js.org/)
&nbsp;&nbsp;
[![Browserfs](https://img.shields.io/badge/bfs-iontach-25b425.svg)](https://github.com/saoirse-iontach/browser-fs-dom)
[![Bfs-Core](https://img.shields.io/badge/bfs-core-25b425.svg)](https://saoirse-iontach.github.io/browser-fs-core)
[![Bfs-Dom](https://img.shields.io/badge/bfs-dom-25b425.svg)](https://saoirse-iontach.github.io/browser-fs-dom)

This is a BrowserFS VFS Adapter for OS.js.

[OS.js](https://www.os-js.org/)
is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE)
web desktop platform with a window manager, application APIs, GUI toolkit, filesystem abstractions and much more.

[@BrowserFS](https://github.com/saoirse-iontach/browser-fs-core)
is an in-browser file system that emulates the [Node JS file system API](http://nodejs.org/api/fs.html)
and supports storing and retrieving files from various backends.
BrowserFS also integrates nicely with other tools.

> [!NOTE]
> **@ZenFS** is an (breaking) update of **BrowserFS**, <ins>with a **node:fs**  interface</ins>.
> \
> **@BrowserFS** is [transient](//github.com/browser-fs/NOTICE) project
> _(<sub>from **BrowserFS** towards **@ZenFS**</sub>_).
> \
> **@BrowserFS-iontach**</ins> is a bugfixed fork of **@BrowserFS @1.0**.
>
> | Project        | author    | timeline          | links |
> | -------------- | --------- | :---------------: | :---: |
> | **BrowserFS**  | John Vilk | 2014 - 2017       | [npm](//www.npmjs.com/package/browserfs) [github](//github.com/jvilk/BrowserFS) |
> | **@BrowserFS** | dr-Vortex | 09/2023 - 03/2024 | [npm](//www.npmjs.com/org/browserfs) [github](//github.com/browser-fs) |
> | **@ZenFS**     | dr-Vortex | 03/2024 - ...     | [npm](//www.npmjs.com/org/zenfs) [github](//github.com/zen-fs) |

> [!IMPORTANT]
> Next version probably move back to original **jVilk BrowserFS**

### Citing

BrowserFS is a component of the [Doppio](http://doppiojvm.org/) and [Browsix](https://browsix.org/) research projects from the PLASMA lab at the University of Massachusetts Amherst. If you decide to use BrowserFS in a project that leads to a publication, please cite the academic papers on [Doppio](https://dl.acm.org/citation.cfm?doid=2594291.2594293) and [Browsix](https://dl.acm.org/citation.cfm?id=3037727).

<details><summary><i>citations</i></summary>

  - > John Vilk and Emery D. Berger. Doppio: Breaking the Browser Language Barrier. In
      *Proceedings of the 35th ACM SIGPLAN Conference on Programming Language Design and Implementation*
      (2014), pp. 508–518.

    <details><summary><i>references</i></summary>

    ```bibtex
    @inproceedings{VilkDoppio,
        author	= {John Vilk and Emery D. Berger},
        title	= {{Doppio: Breaking the Browser Language Barrier}},
        booktitle	= {Proceedings of the 35th {ACM} {SIGPLAN} Conference
        			on Programming Language Design and Implementation},
        pages	= {508--518},
        year	= {2014},
        url	= {http://doi.acm.org/10.1145/2594291.2594293},
        doi	= {10.1145/2594291.2594293}
    }
    ```
    </details>

  - > Bobby Powers, John Vilk, and Emery D. Berger. Browsix: Bridging the Gap Between Unix and the Browser.
      In *Proceedings of the Twenty-Second International Conference on Architectural Support
      for Programming Languages and Operating Systems* (2017), pp. 253–266.

    <details><summary><i>references</i></summary>

    ```bibtex
    @inproceedings{PowersBrowsix,
        author	= {Bobby Powers and John Vilk and Emery D. Berger},
        title	= {{Browsix: Bridging the Gap Between Unix and the Browser}},
        booktitle	= {Proceedings of the Twenty-Second International Conference
        			on Architectural Support for Programming Languages and Operating Systems},
        pages	= {253--266},
        year	= {2017},
        url	= {http://doi.acm.org/10.1145/3037697.3037727},
        doi	= {10.1145/3037697.3037727}
    }
    ```

    </details>
</details>

### License

This **OS.js BrowserFS Adapter** is licensed under the MIT License.\
It embed a fork of **Broofa mime** that is under the MIT License.\
**OS.js**, **BrowserFS**, and **ZenFS** are also licensed under the MIT License.

See [LICENSE.txt](LICENSE.txt) and [broofa-mime.js](broofa-mime.js) for details.

## Installation

```sh
npm install saoirse-iontach/osjs-browserfs-adapter  # @osjs/browserfs-adapter
```

<details><summary><h4>Overriding BrowserFS dependencies</h4></summary>

  If you fork **@BrowserFS-iontach**, then add the following to your *package.json*:

  ```json
    "scripts": {
      "dependencies": "npx bfs-adapter-prepare",
      "test": "npx bfs-adapter-test"
    },
    "dependencies": {
      "@browserfs/core": "...",
      "@browserfs/fs-dom": "..."
    }
  ```

  Then if you remove a ```@browserfs/*```, you must do ```npm ci```.

  #### Testing

  Run simple tests with `npx bfs-adapter-test`.\
  Then analyze console output.

</details>

## Usage

Register adapter in your `src/client/index.js` bootstrap file:

```js
  import bfsAdapter from '@osjs/browserfs-adapter';

  osjs.register(VFSServiceProvider, {
    args: {
      adapters: {
        bfs: bfsAdapter
      }
    }
  });
```

Then create mountpoints in your `src/client/config.js` file:\
*(and provide missing mime type)*

```js
{
  mime: {
    filenames: {
      // 'filename': 'mime/type'
      'Makefile': 'text/x-makefile',
      '.gitignore': 'text/plain'
    },
    define: {
      // 'mime/type': ['ext']
      'text/x-lilypond': ['ly', 'ily'],
      'text/x-python': ['py'],
      'application/tar+gzip': ['tgz']
    }
  },
  vfs: {
    mountpoints: [{
      name: 'localstorage',
      label: 'Browser low data',
      adapter: 'bfs',
      attributes: {
        fs: 'Storage'
      }
    },{
      name: 'opfs',
      label: 'Browser files',
      adapter: 'bfs',
      attributes: {
        fs: 'FileSystemAccess'
      }
    },{
      name: 'debug-bfs',
      label: 'BrowserFS internals',
      adapter: 'bfs',
      attributes: {
        root: '/'
      }
    },{
      name: 'test-shortcut',
      label: 'My Documents',
      adapter: 'bfs',
      attributes: {
        root: 'opfs:/MyDocuments'
      }
    }]
  }
}
```

**`mountpoint.root`** is the vfs path prefix.\
**`attributes.root`** is the bfs path prefix.\
This is use for path translation on vfs operation.

**`attributes.fs`** is the bfs backend name.\
**`attributes.mountpoint`** is the bfs mountpoint.\
This is used (if provided) to mount a backend.

Use **`attributes['/subpath']`** to mount a nested backend.\
Then you can provide either a `string` for backend name,\
or a nested `object` for backend config and inner nest.

**`attributes.options`** will be pass to backend. \
Else others **`attributes.xxx`** will be pass as `options`.

<!--
  mount: {
    name: string,  // mount id
    root?: string, // vfs path prefix
    attributes: fsconfig
  }

  config: fsname | fsconfig | FileSystem
  fsname: string
  fsconfig: {
      fs: string   // backend name
      root?: string,       // bfs path prefix
      mountpoint?: string  // bfs mount point
      ...backendConfig,
      ...nestedMounts: {[subpath: '/'+string]: config}
    }
-->

<details><summary><h4>advanced usage</h4></summary>

```js
  // Await all
  import bfsAdapter from '@osjs/browserfs-adapter';

  const {mime, core, dom, browserfs, adapter} = await bfsAdapter.default;
```

```js
  // Await some
  import bfsAdapter from '@osjs/browserfs-adapter';

  const mime = await bfsAdapter.mime;
  const adapter = await bfsAdapter.adapter;
```

```js
  // Don't wait for the adapter
  import bfsAdapter from '@osjs/browserfs-adapter';

  const adapter = bfsAdapter.preload;
  // adapter will wait to complete mount,
  // andwill be updated to awaited  bfsAdapter.adapter
```

```js
  // internals api, to build your custom adapter
  import bfsAdapter from '@osjs/browserfs-adapter';

  const { browserfs, upgradeFs, mountHandler,
    mountOperations, vfsOperations, mime, vfsMime }
    = await bfsAdapter.adapter;
```

Open **`_index.html`** in a browser to have a view of exports.\
Then in the browser console, you can play with:
 - `require`: the requirejs module loader
 - `adapter`: the adapter factory (see basic usage)
 - `modules`: the bundled submodules (see advanced usage)

<!--
  preload is a dummy ready to use adapter
  that will on loaded be updated to real adapter ;
  mount operation will wait for that,
  while other operation will immediatly fail.
-->

</details>

## Documentation

See the [OS.js Official Manuals](https://manual.os-js.org/) for articles, tutorials and guides.\
See the [BrowserFS Core](https://saoirse-iontach.github.io/browser-fs-core)
and the [BrowserFS DOM](https://saoirse-iontach.github.io/browser-fs-dom) for configuring backends.

## Links

* [OS.js Official Chat](https://gitter.im/os-js/OS.js)
* [OS.js Community Forums and Announcements](https://community.os-js.org/)
* [OS.js Homepage](https://os-js.org/)

<!-- -->

* [Broofa Mime](https://github.com/broofa/mime)
* [JShttp Mime-DB](https://github.com/jshttp/mime-db)
