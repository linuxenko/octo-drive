var expect = require('chai').expect;
var _ = require('lodash');

var jsonData = require('./fixture/flat');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(_.cloneDeep(jsonData));


describe('Memory-FS create tests', function() {
  it('should create /new-file.txt', function(done) {
    var path = '/new-file.txt';

    memfs.create(path, 'file', function(err) {
      expect(err).to.be.null;

      memfs.getattr(path, function(err, data) {
        expect(err).to.be.null;
        expect(data).to.be.an('object');
        done();
      });
    });
  });

  it('should create /amadir/new-file.txt', function(done) {
    var path = '/amadir/new-file.txt';

    memfs.create(path, 'file', function(err) {
      expect(err).to.be.null;

      memfs.getattr(path, function(err, data) {
        expect(err).to.be.null;
        expect(data).to.be.an('object');
        done();
      });

    });
  });

  it('should create /amadir/subdir/new-file.txt', function(done) {
    var path = '/amadir/subdir/new-file.txt';

    memfs.create(path, 'file', function(err) {
      expect(err).to.be.null;

      memfs.getattr(path, function(err, data) {
        expect(err).to.be.null;
        expect(data).to.be.an('object');
        done();
      });
    });
  });

  it('should handle wrong path /notfound/new-file.txt', function(done) {
    var path = '/notfound/new-file.txt';

    memfs.create(path, 'file', function(err) {
      expect(err).not.be.null;

      memfs.getattr(path, function(err) {
        expect(err).not.be.null;
        done();
      });
    });
  });

  it('should file exists handle /hello.txt', function(done) {
    var path = '/hello.txt';

    memfs.create(path, 'file', function(err) {
      expect(err).not.be.null;

      memfs.getattr(path, function(err) {
        expect(err).to.be.null;
        done();
      });
    });
  });


});
