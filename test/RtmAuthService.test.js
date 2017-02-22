var should = require('chai').should();
var RtmAuthService = require(__dirname + '/../nodes/lib/RtmAuthService.js');

describe('RTM Auth', function() {
  "use strict";
  
  var connection = null;  
  
  beforeEach(function() {    
    connection = {
      hasValidTokenValue: false,
      hasValidToken: function(done) {
        done(this.hasValidTokenValue);
      },
      frobResponse: {
        frob: '1234567890abcdef'
      },
      tokenResponse: {
        auth: { token: '1234567890abcdef1234567890abcdef' }        
      },
      call: function(method, args, done) {
        switch(method) {   
          case 'rtm.auth.getFrob': return done(this.frobResponse);
          case 'rtm.auth.getToken': return done(this.tokenResponse);
          default: throw new Error(method + " is not implemented");
        }
      },
      getAuthUrl: function(frob) {
        return 'https://www.rememberthemilk.com/services/auth/?api_key=abc123&perms=delete&api_sig=zxy987&frob' + frob;
      }
    };
  });
  
  it('should throw error if connection was not provided', function () {
    should.throw(
      function() {
        var service = new RtmAuthService({});
        service.should.not.be.ok();
      }, 
      /connection/i
    );
  });
  it('should return auth url after 1st call', function (done) {
    var service = new RtmAuthService({connection: connection});
    service.call(function (result) {
      should.exist(result);
      result.should.have.property('type', 'auth-url');
      result.should.have.property('content');
      result.content.should.match(/^(http|https):\/\//);
      done();
    });
  });
  it('should have frob after 1st call', function (done) {
    var service = new RtmAuthService({connection: connection});
    service.hasFrob().should.equal(false);
    service.call(function (result) {
      should.exist(result);
      service.hasFrob().should.equal(true);
      done();
    });
  });
  it('should return API token after 2nd call', function (done) {
    var service = new RtmAuthService({connection: connection});
    service.call(function () {
      service.call(function (result) {
        should.exist(result);        
        result.should.have.property('type', 'token');
        result.should.have.property('content');
        result.content.should.match(/^[0-9A-Fa-f]+$/);
        done();
      });            
    });
  });
  it('should return error if connection has valid token', function (done) {
    connection.hasValidTokenValue = true;
    var service = new RtmAuthService({connection: connection});
    service.call(function (result) {
      should.exist(result);
      result.should.have.property('type', 'error');
      result.should.have.property('content');
      result.content.should.match(/token/i);
      done();           
    });
  });
});