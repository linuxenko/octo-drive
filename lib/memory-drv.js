var fuse = require('fuse-bindings');

var FuseBindings = function(memfs) {
  this.memfs = memfs;
};

FuseBindings.prototype.bindings = function() {
  return {
    readdir: this.readdir.bind(this),
    getattr: this.getattr.bind(this),
    open: this.open.bind(this),
    read: this.read.bind(this),
    unlink : this.unlink.bind(this),
    create : this.create.bind(this),
    write : this.write.bind(this),
    truncate : this.truncate.bind(this),
    utimens : this.utimens.bind(this),
    mkdir : this.mkdir.bind(this),
    rmdir : this.rmdir.bind(this),
    rename : this.rename.bind(this),
    release : this.release.bind(this),
    chmod : this.chmod.bind(this),
    chown : this.chown.bind(this),
    symlink : this.symlink.bind(this),
    readlink : this.readlink.bind(this)
  };
};

FuseBindings.prototype.readdir = function(path, cb) {
  this.memfs.readdir(path, function(err, data) {
    if (err) {
      return cb(0);
    }
    return cb(0, data);
  });
};

FuseBindings.prototype.getattr = function(path, cb) {
  this.memfs.getattr(path, function(err, data) {
    if (err) {
      return cb(fuse.ENOENT);
    }
    return cb(0, data);
  });
};

FuseBindings.prototype.open = function(path, flags, cb) {
  this.memfs.open(path, flags, function(err) {
    if (err) {
      return cb(fuse.EEXIST);
    }
    cb(0);
  });
};

FuseBindings.prototype.unlink = function(path, cb) {
  this.memfs.unlink(path, function(err) {
    if (err) return cb(fuse.EREMOTEIO);
    return cb(0);
  });
};

FuseBindings.prototype.create = function(path, mode, cb) {
  this.memfs.create(path, 'file', function(err) {
    if (err) return cb(fuse.EEXIST);
    return cb(0);
  });
};

FuseBindings.prototype.write = function(path, fd, buffer, length, position, cb) {
  this.memfs.write(path, fd, buffer, length, position, function(err, len) {
    if (err) return cb(fuse.EREMOTEIO);
    return cb(len);
  });
};

FuseBindings.prototype.read = function (path, fd, buffer, length, position, cb) {
  this.memfs.read(path, fd, buffer, length, position, function(err, len) {
    if (err) return cb(fuse.EREMOTEIO);
    cb(len);
  });
};

FuseBindings.prototype.release = function(path, fd, cb) {
  this.memfs.release(path, fd, function(err) {
    if (err) return cb(fuse.EIO);
    cb(0);
  });
};

FuseBindings.prototype.rename = function(src, dst, cb) {
  this.memfs.rename(src, dst, function(err) {
    if (err) return cb(fuse.EIO);
    cb(0);
  });
};

FuseBindings.prototype.truncate = function(path, len, cb) {
  cb(0);
};

FuseBindings.prototype.utimens = function(path, ctime, atime, cb) {
  if (typeof cb === 'function') {
    cb(0);
  }
};

FuseBindings.prototype.chown = function(path, uid, gid, cb) {
  cb(0);
};

FuseBindings.prototype.chmod = function(path, mode, cb) {
  cb(0);
};

FuseBindings.prototype.mkdir = function(path, mode, cb) {
  this.memfs.create(path, 'dir', function(err) {
    if (err) return cb(fuse.EIO);
    return cb(0);
  });
};

FuseBindings.prototype.rmdir = function(path, cb) {
  this.memfs.rmdir(path, function(err) {
    if (err) return cb(fuse.EIO);
    return cb(0);
  });
};

FuseBindings.prototype.readlink = function(path, cb) {
  this.memfs.readlink(path, function(err, link) {
    if (err) return cb(fuse.EIO);
    return cb(0, link);
  });
};

FuseBindings.prototype.symlink = function(src, dst, cb) {
  this.memfs.symlink(src, dst, function(err) {
    if (err) return cb(fuse.EIO);
    return cb(0);
  });
};

module.exports = FuseBindings;
