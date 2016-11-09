var FILE_MODE = 33152; //33188;
var DIR_MODE = 16832; //16877;
var LINK_MODE = 41408;

var NOT_FOUND = 'Not Found';
var UID = process.getuid();
var GID = process.getgid();
var MOUNT_DATE = new Date();

var Store = require('encrypted-cache');
var tmp = require('tmp'); // nodejs v4 support

var pathToArray = function(path) {
  return path
    .replace(/\/\//gi,'/')
    .replace(/\/$/,'')
    .split('/').slice(1);
};

var dirExists = function(json, path) {
  if (path === '/') {
    return true;
  }

  return json.filter(function(record) {
    return record.path === path;
  }).length > 0;
};

var findDir = function(json, path) {
  if (dirExists(json, path)) {
    return json.filter(function(record) {
      return record.path === path;
    })[0];
  }

  return null;
};

var readJSONDir = function(json, path) {
  var col = pathToArray(path);
  var parent = col.length < 1 ? col.join('/') : '/' 
    + col.join('/').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  var regex = new RegExp('^' + parent + '\/[^\\\/]*$');

  return json.filter(function(record) {
    return record.path.match(regex);
  });
};

var getFileName = function(path) {
  var col = pathToArray(path);
  return col.pop();
};

var fakeMiddleware = {
  fetch : function(j, cb) { cb(); },
  sync  : function(j, cb) { cb(); },
  post  : function(j, name, buf, cb) { cb(); },
  del   : function(j, cb) { cb(); }
};

var MemFS = function(data, middleware) {
  this.middleware = middleware || fakeMiddleware;
  this.data = data;
  this.tmpDir = tmp.dirSync({mode : 0700, prefix : 'vfs-cache-'}).name;
  this.store = new Store(this.tmpDir);
  this.writeBuffer = {
    sync : false,
    path : null,
    buf : Buffer.alloc(0)
  };
};

MemFS.prototype.getattr = function(path, callback) {
  if (!dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  var record = findDir(this.data, path) || {};
  var dir = {};

  dir.uid = UID;
  dir.gid = GID;

  dir.ctime = MOUNT_DATE;
  dir.mtime = MOUNT_DATE;
  dir.atime = MOUNT_DATE;

  switch(record.type) {
  case 'file':
    dir.mode = FILE_MODE;
    dir.size = record.size ? record.size : 0;
    break;
  case 'link':
    dir.mode = LINK_MODE;
    dir.size = 1;
    break;
  default:
    dir.mode = DIR_MODE;
    dir.size = 4096;
    break;
  }

  callback(null, dir);
};

MemFS.prototype.readdir = function(path, callback) {
  var sortFs = function(a, b) {
    var nameA = a.toUpperCase();
    var nameB = b.toUpperCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  };

  if (!dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  var data = readJSONDir(this.data, path);

  var dirs = data
    .filter(function(record) {
      return record.type === 'dir';
    })
    .map(function(record) {
      return getFileName(record.path);
    })
    .sort(sortFs);
  var files = data
    .filter(function(record) {
      return record.type !== 'dir';
    })
    .map(function(record) {
      return getFileName(record.path);
    })
    .sort(sortFs);

  return callback(null, dirs.concat(files));
};

MemFS.prototype.open = function(path, flags, callback) {
  this.writeBuffer.path = path;
  this.writeBuffer.sync = false;
  this.writeBuffer.flag = flags;
  this.writeBuffer.buf = Buffer.alloc(0);

  return callback(null);
};

MemFS.prototype.write = function(path, fd, buffer, length, position, callback) {
  this.writeBuffer.sync = true;
  this.writeBuffer.buf =
    Buffer.concat([this.writeBuffer.buf, buffer]);
  return callback(null, length);
};

MemFS.prototype.read = function(path, fd, buffer, length, position, callback) {
  var self = this;

  var readNext = function() {
    var buf = self.writeBuffer.buf.slice(position, position + length);
    buf.copy(buffer);
    callback(null, buf.length);
  };

  if (this.writeBuffer.buf.length === 0) {
    return this.prefetch(path, function(err, data) {
      if (err) return callback(err);
      self.writeBuffer.buf = data;
      readNext();
    });
  }
  return readNext();
};

MemFS.prototype.release = function(path, fd, callback) {
  var self = this;

  var saveBuffer = function() {
    self.middleware.post(findDir(self.data, path), self.writeBuffer.buf, function(error, sha) {
      if (error) {
        self.writeBuffer.buf = Buffer.alloc(0);
        return callback(error);
      }

      self.data = self.data.map(function(record) {
        if (record.path === path) {
          record.size = self.writeBuffer.buf.length;
          record.sha = sha;
        }
        return record;
      });

      self.store.write(path, self.writeBuffer.buf, function(err) {
        self.middleware.sync(self.data, function() { });
        self.writeBuffer.buf = Buffer.alloc(0);
        if (err || error) return callback(err || error);
        return callback(null);
      });
    });
  };

  if (this.writeBuffer.sync === true) {
    this.writeBuffer.sync = false;

    if (this.writeBuffer.flag === 33793) { // append mode
      this.prefetch(path, function(error) {
        if (error) return callback(error);

        self.store.read(path, function(err, buffer) {
          self.writeBuffer.buf = Buffer.concat([buffer, self.writeBuffer.buf]);
          saveBuffer();
        });
      });
    } else {
      saveBuffer();
    }

  } else {
    self.writeBuffer.buf = Buffer.alloc(0);
    return callback(null);
  }
};

MemFS.prototype.rmdir = function(path, callback) {
  return this.unlink(path, callback);
};

MemFS.prototype.mkdir = function(path, callback) {
  return this.create(path, 'dir', callback);
};

MemFS.prototype.unlink = function(path, callback) {
  var self = this;

  if (!dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  this.getattr(path, function(err, data) {
    if (data.mode === FILE_MODE) {
      self.middleware.del(findDir(self.data, path), function(err) {
        if (err) return callback(err);
        self.data = self.data.filter(function(record) {
          return record.path !== path;
        });
        self.store.remove(path, function() {});
        self.middleware.sync(self.data, function() {});
        callback(null);
      });
    } else {
      var col = pathToArray(path);
      var parent = '/' + col.join('/');
      var regex = new RegExp('^' + parent);

      self.data = self.data.filter(function(record) {
        return !record.path.match(regex);
      });
      self.middleware.sync(self.data, function() {});
      callback(null);
    }
  });
};

MemFS.prototype.create = function(path, mode, callback) {
  var col = pathToArray(path);
  var parent = '/' + col.slice(0, col.length - 1).join('/');

  if (!dirExists(this.data, parent) || dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  var item = {
    path : path,
    type : mode
  };

  if (mode === 'file') {
    item.size = 0;
  }

  this.data.push(item);

  this.middleware.sync(this.data, function() {});
  return callback(null);
};

MemFS.prototype.rename = function(src, dst, callback) {
  var self = this;
  if (dirExists(this.data, dst)
    || !dirExists(this.data, src)
    || src === dst) {
    return callback(NOT_FOUND);
  }

  this.getattr(src, function(err, data) {
    if (data.mode === FILE_MODE) {
      self.data = self.data.map(function(record) {
        if (record.path === src) {
          record.path = dst;
        }
        return record;
      });

      return callback(null);
    } else {
      var col = pathToArray(src);
      var dest = '/' + pathToArray(dst).join('/');
      var parent = '/' + col.join('/');
      var regex = new RegExp('^' + parent);

      self.data = self.data.map(function(record) {
        if (record.path.match(regex)) {
          record.path = record.path.replace(regex, dest);
        }
        return record;
      });
    }
    self.middleware.sync(self.data, function() { });
    callback(null);
  });
};

MemFS.prototype.readlink = function(path, callback) {
  var dir = findDir(this.data, path);

  if (dir) {
    return callback(null, dir.src);
  }
  return callback(NOT_FOUND);
};

MemFS.prototype.symlink = function(src, dst, callback) {
  var linkItem = {
    type : 'link',
    path : dst,
    src : src
  };

  this.data.push(linkItem);
  this.middleware.sync(this.data, function() {});
  return callback(null);
};

MemFS.prototype.prefetch = function(path, callback) {
  var self = this;
  this.store.read(path, function(err, data) {
    if (err) {
      self.middleware.fetch(findDir(self.data, path), function(error, buf) {
        if (error) return callback(error);

        self.store.write(path, buf, function(e) {
          if (e) return callback(e);
          callback(null, buf);
        });
      });
    } else {
      return callback(null, data);
    }
  });
};

MemFS.prototype.getData = function() {
  return this.data;
};

MemFS.prototype.setData = function(data) {
  this.data = data;
};

module.exports = MemFS;
