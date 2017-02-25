var RtmMethod = require(__dirname + '/lib/RtmMethod.js');

module.exports = function(RED) {
  "use strict";
  
  function RtmAddTaskNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    
    var connection = RED.nodes.getNode(config.connection).getConnection();
    var method = new RtmMethod(connection);
    
    this.on('input', function(msg) {        
      var parse = (config.smart == 'yes') ? true : false;    
      method.addTask(msg.payload, parse, function(rsp, err){
        if(err) {
          node.error(err);
          return;
        }
        node.send({payload: rsp});
      });        
    });    
  }
  RED.nodes.registerType("RTM Add Task", RtmAddTaskNode);
};