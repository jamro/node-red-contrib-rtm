var RememberTheMilk = require('rtm-js');
var md5 = require('md5');

module.exports = function(options) {
  "use strict";
  if(!options) {
    throw new Error("Options are required");
  }
  if(!options.key) {
    throw new Error("API Key is required");
  }
  if(!options.secret) {
    throw new Error("API Secret is required");
  }
  var self = this;
  
  var token = null;
  var rtm = options.rtm || new RememberTheMilk(options.key, options.secret, 'write');
  
  var timeline = null;
  var lastCallTime = 0;
  var callRateLimit = 1; //rps
  var callTimeout = null;
  var callQueue = [];
    
  var noTokenMethods = ["rtm.auth.getFrob", "rtm.auth.getToken", "rtm.test.echo"];
  var noTimelineMethods = ["rtm.auth.getFrob", "rtm.auth.getToken", "rtm.test.echo", "rtm.timelines.create", "rtm.auth.checkToken"];
  /**
   * Sets maximum rate of RTM API calls. According to RTM docs, API cannot be called 
   * more often than once per second and this is the recommended value
   * @param value - limit of API calls rate provided in requests per second
   */
  this.setCallRateLimit = function(value) {
    callRateLimit = value; //rps
  };
  
  /**
   * Set authorization token required for most of API calls. 
   * @param value - authorization token given as a String
   * @see RtmAuthService.js
   */
  this.setToken = function(value) {
    token = value;
  };
  
  /**
   * All RTM calls are assigned to specific timeline what allows to undo them.
   * Timeline is required for most of API calls. Read RTM API docs for more information.
   *
   * In most cases there is no need to set Timeline manualy since this library will do it
   * automatically. However, for more advanced scenarios there is such possibility.
   * 
   * @param value - timeline of RTM API
   */
  this.setTimeline = function(value) {
    timeline = value;
  };
  
  /**
   * Genrates authorization URL basing on provided frob
   * 
   * @param frob - authorization Frob received from RTM API
   * @return URL where user can authorize the application to access his RTM account
   */
  this.getAuthUrl = function(frob) {  
    if(!frob) {
      throw new Error('frob is required');
    }
    var signature = md5(options.secret + 'api_key' + options.key + 'frob' + frob + 'permswrite');    
    return 'https://www.rememberthemilk.com/services/auth/?api_key=' + options.key + '&perms=write&frob=' + frob + '&api_sig=' + signature;
  };
  
  /**
   * Returns name of currently authorized user (assigned to current auth token)
   * @param done - callback executed to return async response. It has two arguments: done(result, error)
   * @see setToken()
   */
  this.getUserName = function(done) {
    this.call('rtm.auth.checkToken', {}, function(rsp, err){  
      if(err) {
        return done(null, err);
      }
      if(!rsp.auth || !rsp.auth.user || !rsp.auth.user.username) {
        return done(null, "User info not found");
      }
      return done(rsp.auth.user.username);
    });
  };
  
  /**
   * Check if current token is valid and thus the user is authorized
   * @param done - callback executed to return async response. It has two arguments: done(result, error)
   * @see setToken()
   */
  this.hasValidToken = function(done) {
    if(!token) {
      return done(false);
    }
    this.call('rtm.auth.checkToken', {}, function(rsp, err){  
      if(err) {
        return done(false);
      }
      return done(rsp.auth !== undefined);
    });
  };
  
  /**
   * @return true if token was set (without verifying its validity), otherwise returns false
   * @see setToken()
   */  
  this.hasToken = function() {
    return token ? true : false;
  };
  
  /**
   * Call RTM API. See RTM docs for more information
   *
   * @param method - RTM method to be called
   * @param args - Array of arguments that will be passed to RTM API call. Token and timeline arguments will be added automatically
   * @param done - callback executed to return async response. It has two arguments: done(result, error)  
   */
  this.call = function(method, args, done) {
    if(typeof(args) != 'object') {
      return done(null, "args parameter must be an object!");
    }
    callQueue.unshift({
      method: method,
      args: args,
      done: done
    });
    if(callTimeout) {      
      return;
    }
    var timeLimit = 1000 / callRateLimit;
    var now = (new Date()).getTime();
    if(now - lastCallTime > timeLimit) {
      executeQueue();
    } else {
      scheduleQueueExecution();
    }
  };
  
  function scheduleQueueExecution() {
    var timeLimit = 1000 / callRateLimit;
    var now = (new Date()).getTime();
    callTimeout = setTimeout(executeQueue, timeLimit - (now - lastCallTime));
  }
  function executeQueue() {    
    clearTimeout(callTimeout);
    callTimeout = null;
    if(callQueue.length === 0) {
      return;
    }
    lastCallTime = (new Date()).getTime();
    var callData = callQueue.pop();
    var method = callData.method;
    var args = callData.args;
    var done = callData.done;
    if(!rtm) {
      return done(null, "RTM API was not initialized. See logs previous logs for more details");
    }
    if(!token && noTokenMethods.indexOf(method) == -1) {
      return done(null, "Token was not configured for RTM connection. Cannot make " + method + " call without proper authorization!");
    }      
    
    if(!timeline && noTimelineMethods.indexOf(method) == -1) {
      self.call('rtm.timelines.create', {}, function(rsp, err){
        if(err) {
          done(null, err);
          return;
        }
        if(!rsp.timeline) {
          done(null, "No timeline found. Received response " + JSON.stringify(rsp));
          return;
        }
        timeline = rsp.timeline;
        self.call(method, args, done);
        return;
      });
    } else {
      args.auth_token = token;              
      args.timeline = timeline;              
      rtm.get(method, args, function(rsp){
        if(!rsp || !rsp.rsp || rsp.rsp.stat != 'ok') {
          var msg = (rsp && rsp.rsp && rsp.rsp.err && rsp.rsp.err.msg) ? rsp.rsp.err.msg : 'Received response ' + JSON.stringify(rsp);
          return done(null, "Cannot make " + method + " call. " + msg);
        }        
        done(rsp.rsp);
        scheduleQueueExecution();
      });
    }
  } 
  
};