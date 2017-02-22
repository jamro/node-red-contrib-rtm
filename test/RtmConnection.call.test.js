var should = require('chai').should();
var RtmConnection = require(__dirname + '/../nodes/lib/RtmConnection.js');

describe('RTM Connetion: API Calls', function() {
  "use strict";  
  it('should pass parameters to RtmJs', function(done) {
    var rtmMock = {get: function(method, args, done) {
      method.should.equal('rtm.test.echo');
      args.should.have.property('foo', 'bar');
      done({rsp: {stat: 'ok'}});
    }};
    var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
    rtm.call('rtm.test.echo', {foo: 'bar'}, function(result, err) {
      should.not.exist(err);
      should.exist(result);
      done();
    });
  });
  it('should throttle requests to API', function(done) {
    var rtmMock = {get: function(method, args, done) {
      done({rsp: {stat: 'ok'}});
    }};
    var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
    rtm.setCallRateLimit(10);
    var resultCount = 0;
    var now = (new Date()).getTime();
    function onResult(result, err) {
      should.not.exist(err);
      should.exist(result);
      resultCount++;
      if(resultCount == 3) {
        var duration = (new Date()).getTime() - now;
        duration.should.be.within(180, 220);
        done();
      }      
    }    
    rtm.call('rtm.test.echo', {}, onResult);
    rtm.call('rtm.test.echo', {}, onResult);
    rtm.call('rtm.test.echo', {}, onResult);
  });
  it('should return error if API token is not set', function(done) {
    var rtmMock = {get: function(method, args, done) {
      done({rsp: {stat: 'ok'}});
    }};
    var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
    rtm.call('rtm.some.method', {}, function(result, err) {
      should.exist(err);
      err.should.match(/token/i);
      should.not.exist(result);
      done();
    });
  });
  it('should retrieve API timeline if there is NOT any', function(done) {
    function handleTimeline(method, args, done) {
      method.should.equal('rtm.timelines.create');
      done({rsp: {stat: 'ok', timeline: 1234}});
    }
    function handleCall(method, args, done) {
      method.should.equal('rtm.some.method');     
      done({rsp: {stat: 'ok'}});
    }
    var rtmMock = {
      callCount: 0,
      get: function(method, args, done) {
        this.callCount++;
        switch(this.callCount) {
          case 1: return handleTimeline(method, args, done);
          case 2: return handleCall(method, args, done);
        }
      }
    };
    var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
    rtm.setCallRateLimit(100);
    rtm.setToken('TOKEN09876');
    rtm.call('rtm.some.method', {}, function(result, err) {
      should.not.exist(err);
      should.exist(result);
      done();
    });
  });
  it('should NOT retrieve API timeline if there is any', function(done) {
    var rtmMock = {get: function(method, args, done) {
      method.should.equal('rtm.some.method');
      done({rsp: {stat: 'ok'}});
    }};
    var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
    rtm.setTimeline(123);
    rtm.setToken('TOKEN09876');
    rtm.call('rtm.some.method', {}, function(result, err) {
      should.not.exist(err);
      should.exist(result);
      done();
    });
  });
  it('should append API timeline and token to call arguments', function(done) {
    var rtmMock = {get: function(method, args, done) {
      args.should.have.property('timeline', 123);
      args.should.have.property('auth_token', 'TOKEN09876');
      done({rsp: {stat: 'ok'}});
    }};
    var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
    rtm.setTimeline(123);
    rtm.setToken('TOKEN09876');
    rtm.call('rtm.some.method', {}, function(result, err) {
      should.not.exist(err);
      should.exist(result);
      done();
    });
  });
});