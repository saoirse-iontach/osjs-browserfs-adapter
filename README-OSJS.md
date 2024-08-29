# OS.js Quick start

Get OS.js on githut: `https://github.com/os-js/OS.js/archive/refs/tags/3.1.12.zip` \
And extract it.

Edit `packages.json` to add a script:
```
  "scripts": {
    "dependencies": "npx bfs-adapter-prepare",
    ...
  },
```

Edit `webpack.config.js` to add a loader:
```
      // preceding: 'babel-loader'
      {
        test: /\.js$/,
        include: /browserfs-adapter/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/preset-env",{}]
            ]
          }
        }
      },
      // following: 'source-map-loader'
```

Edit `src/client/index.js`:
```
import bfsAdapter from '@osjs/browserfs-adapter';
// ...

  // Register your service providers
  osjs.register(VFSServiceProvider, {
    args: {
      adapters: {
        bfs: bfsAdapter
      }
    }
  });
```

Edit `src/client/config.js`:
```
export default {
  auth: {
    login: {
      username: 'demo',
      password: 'demo'
    }
  },
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
};
```

Then install, build, and run:
```
npm install saoirse-iontach/osjs-browserfs-adapter
npm install saoirse-iontach/browser-fs-dom
npm update
npm run package:discover
npm run build
npm run serve
```

OS.js is now available at: `http://localhost:8000`
