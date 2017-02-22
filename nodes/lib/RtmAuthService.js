module.exports = function(options) {
  "use strict";
  
  function createServiceError(msg) {
    return {
      type: 'error',
      content: msg
    };
  }
  
  if(!options) {
    options = {};
  }
  if(!options.connection) {
    throw new Error("options.connection is required");
  }
  var connection = options.connection;
  var frob = '';
  var token = '';
  
  this.hasFrob = function() {
    return (frob !== '');
  };
  
  this.call = function(done) {
    if(!frob) {
      handleAuth(done);
    } else {
      handleToken(done);
    }
  };
  
  function handleAuth(done) {
    connection.hasValidToken(function(isValid, err) { 
      if(err) {
        return done(createServiceError(err));
      }
      if(isValid) {
        return done(createServiceError("This connection has a token assigned already. No need to authorize!"));
      }  
      connection.call('rtm.auth.getFrob', {}, function(rsp, err){
        if(err) {
          return done(createServiceError(err));
        }
        if(!rsp.frob) {          
          return done(createServiceError("No Frob value found. Raw response: " + JSON.stringify(rsp)));
        }
        frob = rsp.frob;        
        var authUrl = connection.getAuthUrl(frob);
        done({
          type: 'auth-url',
          content: authUrl          
        });
      });
    });
  }
  
  function handleToken(done) {
    connection.hasValidToken(function(isValid, err) { 
      if(err) {
        return done(createServiceError(err));
      }
      if(isValid) {
        return done(createServiceError("This connection has a token assigned already. No need to authorize!"));
      }
      if(token) {
        return done({
          type: 'token',
          content: token
        });
      }
      if(!frob) {
        return done(createServiceError("No frob was found. Authorize at first!"));
      }
      connection.call('rtm.auth.getToken', {frob: frob}, function(rsp, err){  
        if(err) {
          frob = null;
          return done(createServiceError(err));
        }      
        if(!rsp.auth || !rsp.auth.token) {
          frob = null;
          return done(createServiceError("No Token value found. Raw response: " + JSON.stringify(rsp)));
        }    
        token = rsp.auth.token;       
        done({
          type: 'token',
          content: token
        });
      });           
    });           
  }
};