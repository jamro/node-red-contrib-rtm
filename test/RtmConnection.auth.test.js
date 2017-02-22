var md5 = require('md5');
var should = require('chai').should();
var RtmConnection = require(__dirname + '/../nodes/lib/RtmConnection.js');

describe('RTM Connetion: Auth', function() {
  "use strict";
  describe('Get Auth URL', function() {
    it('should throw an error if frob is not provided', function() {
      should.throw(function() {
        var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH'});
        rtm.getAuthUrl();        
      });
    });    
    it('should generate Auth URL', function() {
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH'});
      var url = rtm.getAuthUrl('frobABC');   
      url.should.match(/^https:\/\/www\.rememberthemilk\.com\/services\/auth.*$/);
    });
    it('should Auth URL with provided frob', function() {
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH'});
      var url = rtm.getAuthUrl('frobABC');   
      url.should.match(/frob=frobABC/);
    });
    it('should Auth URL with provided API Key', function() {
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH'});
      var url = rtm.getAuthUrl('frobABC');   
      url.should.match(/api_key=key123456/);
    });    
    it('should Auth URL without API secret', function() {
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH'});
      var url = rtm.getAuthUrl('frobABC');   
      url.should.not.match(/secretABCDEFGH/);
    });    
    it('should sign Auth URL properly', function() {
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH'});
      var url = rtm.getAuthUrl('frobABC');   
      var parameters = url.replace(/.*\?(.*)/, '$1').split('&');
      parameters = parameters.sort();
      parameters = parameters.filter(function(value) {
        return value.substr(0, 7) != 'api_sig';
      });
      var signatureInput = parameters.reduce(function(signatureInput, row) {
        return signatureInput + row.replace('=', '');
      }, 'secretABCDEFGH');
      var signature = md5(signatureInput);
      url.should.match(new RegExp('api_sig='+signature));
    });
  });
  describe('Get User Name', function() {
    it('should return user name', function(done) {
      var rtmMock = {get: function(method, args, done) {
        done({rsp: {stat: 'ok', auth: {user: {username: 'monica'}}}});
      }};
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
      rtm.setToken("XYZ");
      rtm.getUserName(function(name, err) {
        should.not.exist(err);
        should.exist(name);
        name.should.equal("monica");
        done();
      });      
    }); 
    it('should return error if token not set', function(done) {
      var rtmMock = {get: function(method, args, done) {
        done({rsp: {stat: 'ok', auth: {user: {username: 'monica'}}}});
      }};
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
      rtm.getUserName(function(name, err) {
        should.not.exist(name);
        should.exist(err);
        err.should.match(/token/i);
        done();
      });
      
    }); 
    it('should return error if wrong response received', function(done) {
      var rtmMock = {get: function(method, args, done) {
        done({rsp: {stat: 'ok'}});
      }};
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
      rtm.setToken("XYZ");
      rtm.getUserName(function(name, err) {
        should.not.exist(name);
        should.exist(err);
        done();
      });
    }); 
  }); 
  describe('Token', function() {    
    it('should return false if no token is set', function(done) {
      var rtmMock = {};
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
      rtm.hasValidToken(function(isValid, err) {
        should.exist(isValid);
        should.not.exist(err);
        isValid.should.equal(false);
        done();
      });
    });      
    it('should return false if token is invalid', function(done) {
      var rtmMock = {
        get: function(method, args, done) {
          done({rsp: {stat: 'ok'}});
        }
      };
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
      rtm.setToken("XYZ");
      rtm.hasValidToken(function(isValid, err) {
        should.exist(isValid);
        should.not.exist(err);
        isValid.should.equal(false);
        done();
      });
    });      
    it('should return true if token is valid', function(done) {
      var rtmMock = {
        get: function(method, args, done) {
          done({rsp: {stat: 'ok', auth: {}}});
        }
      };
      var rtm = new RtmConnection({key: 'key123456', secret: 'secretABCDEFGH', rtm: rtmMock});
      rtm.setToken("XYZ");
      rtm.hasValidToken(function(isValid, err) {
        should.exist(isValid);
        should.not.exist(err);
        isValid.should.equal(true);
        done();
      });
    });      
  });
});