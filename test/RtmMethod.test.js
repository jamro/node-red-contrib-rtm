var should = require('chai').should();
var RtmMethod = require(__dirname + '/../nodes/lib/RtmMethod.js');

describe('RTM Method', function() {
  "use strict";
  
  var connection = null;  
  
  beforeEach(function() {    
    connection = {      
      addTaskResponse: {},
      getTaskListError: undefined,
      getTaskListResponse: {tasks: {list: []}},
      addTaskError: undefined,
      getLocationsListError: undefined,
      getLocationsListResponse: {locations: {location: []}},
      lastCallArgs: {},
      call: function(method, args, done) {
        this.lastCallArgs = args;
        switch(method) {   
          case 'rtm.tasks.add': return done(this.addTaskResponse, this.addTaskError);
          case 'rtm.tasks.getList': return done(this.getTaskListResponse, this.getTaskListError);
          case 'rtm.locations.getList': return done(this.getLocationsListResponse, this.getLocationsListError);
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
  
  it('should search for tasks', function(done) {
    var method = new RtmMethod(connection);    
    connection.getLocationsListResponse = {locations: {location: [{id: 4, name: "Loc23" }]}};    
    connection.getTaskListResponse = {id: 82513, tasks: {list: [
      {taskseries: [
        {name: "task 1"},
        {name: "task 2", location_id: 4}
      ]},
      {taskseries: [
        {name: "task 3"}
      ]}
    ]}};
    method.search("my query", function(result, err) {
      should.exist(result);
      should.not.exist(err);
      result.should.have.property('tasks');
      result.tasks.should.have.length(3);
      result.tasks[0].should.have.property('name', 'task 1');
      result.tasks[1].should.have.property('name', 'task 2');
      result.tasks[1].should.have.property('location', 'Loc23');
      result.tasks[2].should.have.property('name', 'task 3');
      done();
    });
  });

  it('should search for a single task', function(done) {
    var method = new RtmMethod(connection);    
    connection.getLocationsListResponse = {locations: {location: [{id: 4, name: "Loc23" }]}};    
    connection.getTaskListResponse = {id: 82513, tasks: {list: [
      {
	    taskseries: {name: "task FFF"}
      }
    ]}};
    method.search("my query", function(result, err) {
      should.exist(result);
      should.not.exist(err);
      result.should.have.property('tasks');
      result.tasks.should.have.length(1);
      result.tasks[0].should.have.property('name', 'task FFF');
      done();
    });
  });

  
  it('should search for no tasks', function(done) {
    var method = new RtmMethod(connection);    
    connection.getLocationsListResponse = {locations: {location: [{id: 4, name: "Loc23" }]}};    
    connection.getTaskListResponse = {id: 82513, tasks: {}};
    method.search("my query", function(result, err) {
      should.exist(result);
      should.not.exist(err);
      result.should.have.property('tasks');
      result.tasks.should.have.length(0);
      done();
    });
  });
  
  it('should throw error if search response is incomplete', function(done) {
    var method = new RtmMethod(connection);    
    connection.getTaskListResponse = {tasks: null};
    method.search("my query", function(result, err) {
      should.not.exist(result);
      should.exist(err);
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
  
  it('should forward API errors when searching', function(done) {
    var method = new RtmMethod(connection);    
    connection.getTaskListResponse = undefined;
    connection.getTaskListError = "Ups! Error #5342";
    method.search("some query", function(result, err) {
      should.exist(err);
      should.not.exist(result);
      err.should.equal("Ups! Error #5342");
      done();
    });
  });
});
