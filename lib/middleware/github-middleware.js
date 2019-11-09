var request = require('request');
var debouncy = require('debouncy');
var crypto = require('crypto');
var async = require('async');
var os = require('os');
var fs = require('fs');

var saltify = function(key, salt) {
  var out = '';
  var i = 0;

  for (; i < key.length; i++) {
    out += key.charAt(i);
    out += i < salt.length ? salt.charAt(i) : '';
  }

  for (; i < salt.length; i++) {
    out += salt.charAt(i);
  }

  return out;
};

var responseSha = function(data) {
  return data.content.sha;
};

var GH = function(client, repoName, opts) {
  opts = opts || {};


  this.repoName = repoName;
  this.client = client;
  this.ghrepo = client.repo(repoName);
  this.branch = opts.branch || 'master';
  this.folder = opts.folder || '';

  this.HASH_ALGO = opts.hashAlgo || 'sha256';
  this.CRYPTO_ALGO = opts.cryptoAlgo || 'aes-256-ctr';
  this.hashKey = opts.key || '';
  this.cryptoKey = opts.key || '';
  this.hashSalt = opts.hashSalt || 'g&hd!hhdf-S2nZ';
  this.cryptoSalt = opts.cryptoSalt || '90;jfd-S_+21';

  this.metaSha = null;

  this.hashKey = saltify(this.hashKey, this.hashSalt);
  this.cryptoKey = saltify(this.cryptoKey, this.cryptoSalt);

  this.metafile = opts.metafile ||
      os.tmpDir() + '/' + this.metaFileName();
};

GH.prototype.metaFileName = function() {
  return '.octometa-' + this.hash(this.repoName);
};

GH.prototype.hash = function(name) {
  return crypto.createHmac(this.HASH_ALGO, this.hashKey).update(name).digest('hex');
};

GH.prototype.commitMessage = function() {
  return '(=';
};

GH.prototype.encrypt = function(buffer) {
  var cipher = crypto.createCipher(this.CRYPTO_ALGO, this.cryptoKey);

  if (!(buffer instanceof Buffer)) {
    buffer = Buffer.from(buffer);
  }

  return cipher.update(buffer);
};

GH.prototype.decrypt = function(buffer) {
  var decipher = crypto.createDecipher(this.CRYPTO_ALGO, this.cryptoKey);

  if (!(buffer instanceof Buffer)) {
    buffer = Buffer.from(buffer);
  }

  return decipher.update(buffer);
};

GH.prototype.syncMeta = function(json, callback) {
  var self = this;
  var meta = this.encrypt(JSON.stringify(json)).toString('base64');
  this.upload(this.metaFileName(), meta, this.metaSha, function(err, sha) {
    if (err) return callback(err);
    self.metaSha = sha;
    if (self.metafile) {
      fs.writeFile(self.metafile, meta, function(err) {
        if (err) return callback(err);
        return callback(null);
      });
    } else {
      callback(null);
    }
  });
};

GH.prototype.fetchMeta = function(callback) {
  var self = this;
  async.parallel({
    meta : this.longFetch.bind(this, this.folder + this.metaFileName()),
    tree : this.fetchTree.bind(this)
  }, function(err, resp) {
    if (err) return callback(err);

    var itemSha = function(path) {
      for(var i = 0; i < resp.tree.length; i++) {
        if (path === resp.tree[i].path) {
          return resp.tree[i].sha;
        }
      }
    };

    var metaContains = function(meta, hash) {
      return meta.filter(function(i) { return i.hash === hash; }).length > 0;
    };

    self.metaSha = itemSha(self.metaFileName());

    var meta = JSON.parse(resp.meta.toString()).map(function(item) {
      if (item.type === 'file') {
        if (!item.hash) {
          item.hash = self.hash(item.path);
        }
        item.sha = itemSha(item.hash);
      }
      return item;
    });

    var lfName = '/lost+and+fuckOnIt';
    var found = resp.tree.filter(function(item) {
      return !metaContains(meta, item.path) &&
       item.path != self.metaFileName();
    }).map(function(item) {
      return {
        type : 'file',
        path : lfName + '/' + item.path,
        hash : item.path,
        size : item.size,
        sha  : item.sha,
        skip : true
      };
    });

    if (found.length > 0) {
      meta.push({
        path : lfName,
        type : 'dir',
        skip : true
      });

      meta = meta.concat(found);
    }

    callback(null, meta);
  });
};

GH.prototype.upload = function(path, content, sha, callback) {
  var createFile = function() {
    try {
      this.ghrepo.createContents(this.folder + path,
        this.commitMessage(), content, this.branch, function(err, resp) {
          if (err) return callback(err);
          return callback(null, responseSha(resp));
        });
    } catch(e) {
      return callback(e);
    }
  }.bind(this);

  var updateFile = function() {
    try {
      this.ghrepo.updateContents(this.folder + path,
        this.commitMessage(), content, sha, this.branch, function(err, resp) {
          if (err) return callback(err);
          return callback(null, responseSha(resp));
        });
    } catch(e) {
      return callback(e);
    }
  }.bind(this);
  if (!sha) {
    createFile();
  } else {
    updateFile();
  }
};

GH.prototype.delete = function(path, sha, callback) {
  var deleteFile = function() {
    try {
      this.ghrepo.deleteContents(this.folder + path, this.commitMessage(),
        sha, this.branch, function(err) {
          if (err) return callback(err);
          return callback(null);
        });
    } catch (e) {
      return callback(e);
    }
  }.bind(this);

  if (sha) {
    return deleteFile();
  }
  callback(null); // delete not existen fiile. ok
};

GH.prototype.longFetch = function(path, callback) {
  var self = this;
  this.ghrepo.contents(this.folder + path, this.branch, function(err, data) {
    if (err) return callback(err);
    /* Double base64 ))) */
    var blob = Buffer.from(Buffer.from(data.content.replace('\n',''), 
      'base64').toString(), 'base64');
    return callback(null, self.decrypt(blob));
  });
};

GH.prototype.download = function(path, callback) {
  var self = this;
  var url = 'https://raw.githubusercontent.com/' 
        + this.repoName + '/' + this.branch + '/' + path;
  request(url, function(err, response, content) {
    if (err || response.statusCode != 200) return callback('cannot download');
    return callback(null, self.decrypt(Buffer.from(content, 'base64')));
  });
};

GH.prototype.fetchTree = function(callback) {
  this.ghrepo.tree(this.branch, function(err, tree) {
    if (err) return callback(err);
    return callback(null, tree.tree);
  });
};
/* External  */

GH.prototype.sync = function(json, callback) {
  if (!this.debouncedSync) {
    this.debouncedSync = debouncy(this.syncMeta, 2500, this);
  }

  if (typeof callback !== 'function') {
    callback = function(err) {
      if (err) return this.sync(json);
    };
  }

  var data = json
    .filter(function(i) {
      return !i.skip;
    })
    .map(function(i) {
      if (i.type === 'file') {
        return {
          path : i.path,
          type : i.type,
          size : i.size,
          hash : i.hash
        };
      } else {
        return i;
      }
    });
  this.debouncedSync(data, callback);
};

GH.prototype.fetch = function(json, callback) {
  this.download(
    json.hash || this.hash(json.path),
    callback);
};

GH.prototype.post = function(json, buffer, callback) {
  this.upload(
    json.hash || this.hash(json.path),
    this.encrypt(buffer).toString('base64'),
    json.sha,
    callback);
};

GH.prototype.del = function(json, callback) {
  this.delete(
    json.hash || this.hash(json.path),
    json.sha, callback);
};

module.exports = GH;
