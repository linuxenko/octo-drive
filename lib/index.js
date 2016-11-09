var fuse = require('fuse-bindings');
var github = require('octonode');
var fs = require('fs');
var rl = require('readline-sync');

var MemFS  = require('./memory-fs');
var MemDRV = require('./memory-drv');
var GitHubFS = require('./middleware/github-middleware');

var ghToken = process.env['OCTODRIVE_TOKEN'];
var ghUser  = process.env['OCTODRIVE_USER'];
var ghPass  = process.env['OCTODRIVE_PASS'];
var driveSecret = process.env['OCTODRIVE_SECRET'];
var client = null;

if (process.argv.length < 4 || !fs.existsSync(process.argv[3])) {
  if (!fs.existsSync(process.argv[3])) {
    console.log('Mount point not found: ' + process.argv[3]);
  }
  if (!process.argv[2].match(/^\S+\/\S+$/)) {
    console.log('Wrong repository credentials: ' + process.argv[2]);
  }
  console.log('Usage:$ octo-drive username/repo mountpoint');
  process.exit(1);
}

var remoteRepo = process.argv[2];
var mountPoint = process.argv[3];

if (!ghToken && !ghUser) {

  var isToken =  rl.keyInYN('Use token authorization ?');

  if (isToken) {
    ghToken = rl.question('GitHub Token: ', {hideEchoBack: true});
  } else {
    ghUser = rl.question('GitHub username: ');
    ghPass = rl.question('GitHub password: ', {hideEchoBack: true});
  }

  if (!driveSecret) {
    driveSecret = rl.question('Drice secret: ', {hideEchoBack: true});
  }
}

if (!ghToken) {
  client = github.client({
    username : ghUser,
    password : ghPass
  });
} else {
  client = github.client(ghToken);
}

client.get('/user', function(err) {
  if (err) {
    console.log('GitHub authorization failed.');
    process.exit(0);
  }

  var ghfs = new GitHubFS(client, remoteRepo, {
    key : driveSecret
  });

  console.log('Fetching remote metafile..');
  ghfs.fetchMeta(function(err, startMeta) {
    if (err) startMeta = [];

    var memfs = new MemFS(startMeta, ghfs);
    var memdrv = new MemDRV(memfs);

    fuse.mount(
      mountPoint,
      memdrv.bindings(),
      function (err) {
        if (err) throw err;
        console.log('filesystem mounted on ' + mountPoint);
      }
    );

    process.on('SIGINT', function () {
      memfs.store.clean();
      fs.rmdirSync(memfs.tmpDir);
      console.log('Sync metadata ... ');
      ghfs.syncMeta(memfs.data, function() {
        console.log('Done.');
        fuse.unmount(mountPoint, function (err) {
          if (err) {
            console.log('filesystem at ' + mountPoint + ' not unmounted', err);
          } else {
            console.log('filesystem at ' + mountPoint + ' unmounted');
          }
        });
      });
    });
  });
});
