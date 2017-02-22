var should = require('chai').should();
var RtmConnection = require(__dirname + '/../nodes/lib/RtmConnection.js');

describe('RTM Connetion: Init', function() {
  "use strict";

  it('should throw error if no options are provided', function() {
    should.throw(function() {
        var rtm = new RtmConnection();
        rtm.should.not.be.ok();
      }
    );      
  });
  it('should throw error if key is not provided', function() {
    should.throw(function() {
        var rtm = new RtmConnection({'secret': 'XXXXXXX'});
        rtm.should.not.be.ok();
      },
      /.*key.*/i
    );      
  });
  it('should throw error if secret is not provided', function() {
    should.throw(function() {
        var rtm = new RtmConnection({'key': 'XXXXXXX'});
        rtm.should.not.be.ok();
      },
      /.*secret.*/i
    );      
  });
});