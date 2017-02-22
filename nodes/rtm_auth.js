var RtmAuthService = require(__dirname + '/lib/RtmAuthService.js');

module.exports = function(RED) {
  "use strict";
  function RtmAuthNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;    
    var connection = RED.nodes.getNode(config.connection).getConnection();
    var authService = new RtmAuthService({connection: connection});
    
    node.status({});    
    connection.getUserName(function(username, err) { 
      if(!err) {
        node.status({fill:"green",shape:"dot",text:"user: " + username});
      } else {
        node.status({});
      }
    });
    
    this.callAuthService = function(done) {
      authService.call(done);
    };
  }
  RED.nodes.registerType("RTM Auth", RtmAuthNode);
  
  RED.httpAdmin.post("/rtm/auth/:id", RED.auth.needsPermission("inject.write"), function(req,res) {
    var node = RED.nodes.getNode(req.params.id);
    if (node !== null) {  
      try {
        node.callAuthService(function(result) {
          res.end(JSON.stringify(result));
        });
      } catch(err) {
        res.sendStatus(500);        
        node.error("Operation failed", "error");
        node.error(err, "error");
      }
    } else {
      res.sendStatus(404);
    }
  });
};