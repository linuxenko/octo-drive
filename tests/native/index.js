var fuse = require('fuse-bindings');
var fs = require('fs');

//var jsonData = require('../tests/fixture/flat');
var MemFS = require('../../lib/memory-fs');
var MemDrv = require('../../lib/memory-drv');
var Dummy = require('./dummy-middleware');

var dummyfs = new Dummy();

var memfs = new MemFS([
  {
    path : '/hello.txt',
    type : 'file',
    size : 16
  }
], dummyfs);

var memdrv = new MemDrv(memfs);

var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';


var opts = memdrv.bindings();
opts.options = ['nonempty'];

fuse.mount(mountPath, opts, function (err) {
  if (err) throw err;
  console.log('filesystem mounted on ' + mountPath);
});

process.on('SIGINT', function () {

  memfs.store.clean();
  fs.rmdirSync(memfs.tmpDir);
  fuse.unmount(mountPath, function (err) {
    if (err) {
      console.log('filesystem at ' + mountPath + ' not unmounted', err);
    } else {
      console.log('filesystem at ' + mountPath + ' unmounted');
    }
  });
});

