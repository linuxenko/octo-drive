var expect = require('chai').expect;
//var jsonData = require('./fixture/twodem');
var jsonData = require('./fixture/flat');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(jsonData);

describe('Memory-FS readdir tests', function() {
  it('should readdir of /', function(done) {
    expect(memfs.readdir).to.exists;

    memfs.readdir('/', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.an('array');
      expect(data.length).to.equal(4);
      expect(data.indexOf('hello.txt')).not.equal(-1);
      done();
    });
  });

  it('should readdir of /amadir', function(done) {
    memfs.readdir('/amadir', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.an('array');
      expect(data.indexOf('fileinside.txt')).not.equal(-1);
      done();
    });
  });

  it('should reddir of /amadir/subdir', function(done) {
    memfs.readdir('/amadir/subdir', function(err, data) {
      expect(err).to.be.null;
      expect(data.length).to.equal(0);
      done();
    });
  });

  it('should handle of /amadir/notexist', function(done) {
    memfs.readdir('/amadir/notexist', function(err, data) {
      expect(err).not.be.null;
      expect(data).to.be.an('undefined');
      done();
    });
  });

  it('should handle of /notexist', function(done) {
    memfs.readdir('/notexist', function(err, data) {
      expect(err).not.be.null;
      expect(data).to.be.an('undefined');
      done();
    });
  });

});

