var expect = require('chai').expect;
var jsonData = require('./fixture/flat');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(jsonData);


describe('Memory-FS getattr tests', function() {

  it('should getattr of /', function( done) {
    memfs.getattr('/', function(err, dir) {
      expect(err).to.be.null;
      expect(dir).to.be.an('object');
      expect(dir.mode).to.equal(16832);
      done();
    });
  });

  it('should getattr for /amadir', function(done) {
    memfs.getattr('/amadir', function(err, dir) {
      expect(err).to.be.null;
      expect(dir).to.be.an('object');
      expect(dir.mode).to.equal(16832);
      expect(dir.mtime).to.be.a('date');
      expect(dir.atime).to.be.a('date');
      expect(dir.ctime).to.be.a('date');
      done();
    });
  });

  it('should handle not found /notexist', function(done) {
    memfs.getattr('/notexists', function(err, dir) {
      expect(dir).to.be.an('undefined');
      expect(err).to.contain('Not Found');
      done();
    });
  });

  it('should getattr for /hello.txt', function(done) {
    memfs.getattr('/hello.txt', function(err, dir) {
      expect(err).to.be.null;
      expect(dir).to.be.an('object');
      expect(dir.mode).to.equal(33152);
      expect(dir.mtime).to.be.a('date');
      expect(dir.atime).to.be.a('date');
      expect(dir.ctime).to.be.a('date');
      done();
    });
  });


});
