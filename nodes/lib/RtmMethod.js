module.exports = function(connection) {
  "use strict";
  
  if(!connection) {
    throw new Error("RTM connection is required");
  }
  
  this.addTask = function(name, smartParse, done) {
    smartParse = smartParse ? 1 : 0;
    connection.call('rtm.tasks.add', {name: name, parse: smartParse}, done);        
  };
  
  this.search = function(query, done) {
    connection.call('rtm.tasks.getList', {filter: query}, function(rsp, err) {
      if(err) {
        return done(null, err);
      }
      if(!rsp.tasks || !rsp.tasks.list || !Array.isArray(rsp.tasks.list)) {
        return done(null, "Invalid rtm.tasks.getlist response");
      }
      var tasks = [];
      tasks = rsp.tasks.list.reduce(function(a, b) {
        if(Array.isArray(b.taskseries)) {
          a = a.concat(b.taskseries);
          return a;
        }
        return a;
      }, tasks);      
      tasks = tasks.map(function(v){        
        return {
          name: v.name,
          location: v.location_id,
          due: v.task ? v.task.due : "",
          priority: v.task ? v.task.priority : ""
        };
      });
      // map locations
      connection.call('rtm.locations.getList', {}, function(rsp, err) {
        if(err) {
          return done(null, err);
        }
        if(!rsp.locations || !rsp.locations.location || !Array.isArray(rsp.locations.location)) {
          return done(null, "Invalid rtm.locations.getList response");
        }
		var locationMap = [];
		rsp.locations.location.forEach(function(v) {
          locationMap[v.id] = v.name;
        });
        tasks = tasks.map(function(v){
          v.location = locationMap[v.location] ? locationMap[v.location] : v.location;
          return v;
        });

        done({tasks: tasks});        
      });      

	});        
  };
};
