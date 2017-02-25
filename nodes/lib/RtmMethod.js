module.exports = function(connection) {
  "use strict";
  
  if(!connection) {
    throw new Error("RTM connection is required");
  }
  
  this.addTask = function(name, smartParse, done) {
    smartParse = smartParse ? 1 : 0;
    connection.call('rtm.tasks.add', {name: name, parse: smartParse}, done);        
  };
};