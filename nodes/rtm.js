var RtmConnection = require(__dirname + '/lib/RtmConnection.js');

module.exports = function(RED) {
  "use strict";
  function RTMNode(n) {
    RED.nodes.createNode(this,n);
    
    this.key = n.key;    
    var connection = null;
    
    try {
      connection = new RtmConnection({key: n.key, secret: n.secret});
      connection.setToken(n.token);
    } catch (err) {
      this.error(err);
    }
    
    this.getConnection = function() {
      return connection;
    };    
  }
  RED.nodes.registerType("RTM", RTMNode,{
    credentials: {
      frob: {type:"text"}
    }
 });
};