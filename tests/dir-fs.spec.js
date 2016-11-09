var expect = require('chai').expect;
var _ = require('lodash');
var jsonData = require('./fixture/flat');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(_.cloneDeep(jsonData));


describe('Memory-FS mk/rm dir tests', function() {

  it('should create /test-dir', function(done) {
    var path = '/test-dir';
    memfs.mkdir(path, function(err) {
      expect(err).to.be.null;

      memfs.getattr(path, function(err, data) {
        expect(err).to.be.null;

        expect(data).to.be.an('object');
        done();
      });
    });
  });

  it('should create /test-dir/dir-2', function(done) {
    var path = '/test-dir/dir-2';
    memfs.mkdir(path, function(err) {
      expect(err).to.be.null;

      memfs.getattr(path, function(err, data) {
        expect(err).to.be.null;

        expect(data).to.be.an('object');
        done();
      });
    });
  });

  it('should remove /test-dir', function(done) {
    var path = '/test-dir';
    memfs.rmdir(path, function(err) {
      expect(err).to.be.null;

      memfs.getattr(path, function(err) {
        expect(err).not.be.null;
        done();
      });
    });
  });

});

