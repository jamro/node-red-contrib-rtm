module.exports = function(RED) {
  "use strict";
  
  function RtmAddTaskNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    
    var connection = RED.nodes.getNode(config.connection).getConnection();
    
    this.on('input', function(msg) {        
      var parse = (config.smart == 'yes') ? 1 : 0;    
      connection.call('rtm.tasks.add', {name: msg.payload, parse: parse}, function(rsp, err){
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