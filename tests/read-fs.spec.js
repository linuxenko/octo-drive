//var expect = require('chai').expect;
//var jsonData = require('./fixture/twodem');
//var MemFS = require('../lib/memory-fs');
//
//var memfs = new MemFS(jsonData);
//
//
//describe('Memory-FS read tests', function() {
//
//  it('should read /hello.txt', function(done) {
//    memfs.read('/hello.txt', function(err, data) {
//      expect(err).to.be.null;
//      expect(data).to.be.a('string');
//      expect(data.length).to.be.equal('hello world'.length);
//      expect(data).to.be.equal('hello world');
//      done();
//    });
//  });
//
//  it('should read /amadir/fileinside.txt', function(done) {
//    memfs.read('/amadir/fileinside.txt', function(err, data) {
//      expect(err).to.be.null;
//      expect(data).to.be.a('string');
//      expect(data).to.equal('test123');
//      done();
//    });
//  });
//
//  it('sould handle /doesnotexist.txt', function(done) {
//    memfs.read('/doesnotexist.txt', function(err, data) {
//      expect(data).to.be.an('undefined');
//      expect(err).to.contain('Not Found');
//      done();
//    });
//  });
//
//  it('sould handle /amadir/subdir/notexists.txt', function(done) {
//    memfs.read('/amadir/subdir/notexists.txt', function(err, data) {
//      expect(data).to.be.an('undefined');
//      expect(err).to.contain('Not Found');
//      done();
//    });
//  });

//});
