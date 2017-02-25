var should = require('chai').should();
var RtmMethod = require(__dirname + '/../nodes/lib/RtmMethod.js');

describe('RTM Method', function() {
  "use strict";
  
  var connection = null;  
  
  beforeEach(function() {    
    connection = {      
      addTaskResponse: {},
      addTaskError: undefined,
      lastCallArgs: {},
      call: function(method, args, done) {
        this.lastCallArgs = args;
        switch(method) {   
          case 'rtm.tasks.add': return done(this.addTaskResponse, this.addTaskError);
          default: throw new Error(method + " is not implemented");
        }
      }
    };
  });
  it('should throw error if connection is not provided', function() {
    should.throw(
      function() {
        var method = new RtmMethod();    
        method.should.be.ok();
      },
      /connection/i
    );
    
    
  });
  
  it('should add tasks', function(done) {
    var method = new RtmMethod(connection);    
    connection.addTaskResponse = {id: 7584};
    method.addTask("Some name of task", false, function(result, err) {
      should.exist(result);
      should.not.exist(err);
      result.should.have.property('id', 7584);
      connection.lastCallArgs.should.have.property('name', 'Some name of task');
      connection.lastCallArgs.should.have.property('parse', 0);
      done();
    });
  });
  
  it('should add smart tasks (parse)', function(done) {
    var method = new RtmMethod(connection);    
    connection.addTaskResponse = {id: 323};
    method.addTask("Do it !1 ^2001-01-01 #hashtag", true, function(result, err) {
      should.exist(result);
      should.not.exist(err);
      result.should.have.property('id', 323);
      connection.lastCallArgs.should.have.property('name', 'Do it !1 ^2001-01-01 #hashtag');
      connection.lastCallArgs.should.have.property('parse', 1);
      done();
    });
  });
  it('should forward API errors when adding tasks', function(done) {
    var method = new RtmMethod(connection);    
    connection.addTaskResponse = undefined;
    connection.addTaskError = "Ups! Error #9483";
    method.addTask("buy new sports car", false, function(result, err) {
      should.exist(err);
      should.not.exist(result);
      err.should.equal("Ups! Error #9483");
      done();
    });
  });
});