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
  
  /**
   * Verifies if frob was received from Remember The Milk server
   * @return true if frob was received and can be used to authorize, otherwise false
   */
  this.hasFrob = function() {
    return (frob !== '');
  };
  
  /**
   * Handles authorization to Remember The Milk server. The authorization process consist of
   * two steps:
   * 1. Receiving Frob from Remember The Milk server and generating auth URL
   * 2. Generation of auth Token that will be used during furher communication with RTM server
   * 
   * After first call, message with field type set to "auth-url" will be returned (as callback parameter) 
   * Content field will be set to the URL. User must visit this URL to grant authorize and grant 
   * proper permissions.
   *
   * Further calls will return authorization Token that can be used when making API calls. 
   * IMPORTANT: user must visit Auth URL and grant permission before 2nd call. 
   * Otherwise an error will be returned 
   *
   * In case of error, JSON with type field set to "error" will be returned. Field content will
   * be set to message of the error.
   * 
   * @param done callback with one argument for JSON response that match following format {type: ..., content: ...}
   */
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