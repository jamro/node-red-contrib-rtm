var RtmMethod = require(__dirname + '/lib/RtmMethod.js');

module.exports = function(RED) {
  "use strict";
  
  function RtmSearchNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    
    var connection = RED.nodes.getNode(config.connection).getConnection();
    var method = new RtmMethod(connection);
    
    this.on('input', function(msg) {        
      method.search(config.query, function(rsp, err){
        if(err) {
          node.error(err);
          return;
        }
		msg.payload = rsp;
        node.send(msg);
      });
    });
  }
  RED.nodes.registerType("RTM Search", RtmSearchNode);
};
