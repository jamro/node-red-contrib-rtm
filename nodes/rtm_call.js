module.exports = function(RED) {
  "use strict";
  
  function RtmCallNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    
    var connection = RED.nodes.getNode(config.connection).getConnection();
    
    this.on('input', function(msg) {        
      connection.call(config.method, msg.payload, function(rsp, err){
        if(err) {
          node.error(err);
          return;
        }
        node.send({payload: rsp});
      });     
    });    
  }
  RED.nodes.registerType("RTM Call", RtmCallNode);
};