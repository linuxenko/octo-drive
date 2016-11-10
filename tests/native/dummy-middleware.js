var debouncy = require('debouncy');

var sync = debouncy(function(data) {
  return data;
}, 1000, null);

var Dummy = function() {

};

Dummy.prototype.fetch = function(json, callback) {
  setTimeout(function() {
    return callback(null, Buffer.from('hello world', 'utf8'));
  }, 2000);
};

Dummy.prototype.sync = function(json, callback) {
  sync(json);
  if (callback) {
    callback();
  }
};

Dummy.prototype.post = function(json, buffer, callback) {
  callback();
};

Dummy.prototype.del = function(json, callback) {
  callback();
};

module.exports = Dummy;
