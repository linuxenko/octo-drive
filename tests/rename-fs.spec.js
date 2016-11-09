var expect = require('chai').expect;
var _ = require('lodash');
var jsonData = require('./fixture/flat');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(_.cloneDeep(jsonData));


describe('Memory-FS rename tests', function() {
  it('should rename /hello.txt into h.txt',  function(done) {
    memfs.rename('/hello.txt', '/tt.txt', function(err) {
      expect(err).to.be.null;
      memfs.getattr('/tt.txt', function(err, data) {
        expect(err).to.be.null;
        expect(data).to.be.an('object');
        done();
      });
    });
  });

  it('should handle /notexist into /notexist.txt',  function(done) {
    memfs.rename('/notexist', '/notexist.txt', function(err) {
      expect(err).not.be.null;
      done();
    });
  });

  it('should handle /hello.txt into /hello.txt',  function(done) {
    memfs.rename('/hello.txt', '/hello.txt', function(err) {
      expect(err).not.be.null;
      done();
    });
  });

  it('should rename /amadir into /subdir',  function(done) {
    memfs.rename('/amadir', '/subdir', function(err) {
      expect(err).to.be.null;

      memfs.getattr('/subdir', function(err, data) {
        expect(err).to.be.null;

        expect(data).to.be.an('object');

        memfs.readdir('/subdir', function(err, data) {
          expect(data.length).not.equal(0);
          expect(data.indexOf('anotherfile.txt')).not.equal(-1);
          done();
        });
      });
    });
  });


});
