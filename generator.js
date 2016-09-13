"use strict";

var log = require('./log')(module);

module.exports = function (publisher, subscriber) {
    
    var _pool = [];
    
    return {
        
        clientId:  null,
        generatorId: null,
        
        setClient: function(id) {
            this.clientId = id;
            log.info('Set client ID:', id);
        },
        
        setId: function(id) {
            this.generatorId = id;
            log.info('Set generator ID:', id);
        },

        
        addPool: function(clientId) {
            _pool.push(clientId);
            if (_pool.length === 1) {
                this.send();
            }
            log.info('Connect a new handler:', clientId);
        },
        
        
        restorePool: function(pool) {
            _pool = JSON.parse(pool);
            for (var i = 0, length = _pool.length; i< length; i++) {
                if  (_pool[i] === this.generatorId) {
                    _pool.splice(i, 1);
                }
            }
            
            log.info('Restore pool:', _pool);
        },


        deletePool: function(clientId) {
            for (var i = _pool.length; i--;) {
                if(_pool[i] === clientId) {
                    _pool.splice(i, 1);
                }
            }
            log.info('Disconnect a handler:', clientId);
        },

        subscribe: function() {

            if (this.clientId !== this.generatorId) {
                return;
            }

            subscriber.subscribe('ADD:HANDLER');
            subscriber.subscribe('REMOVE:HANDLER');

            subscriber.on("message", function(channel, message) {
                if (channel === 'ADD:HANDLER') {
                    this.addPool(message);
                } else if (channel === 'REMOVE:HANDLER') {
                    this.deletePool(message);
                }
            }.bind(this));
        },
        
        
        getMessage: function(){
            this.cnt = this.cnt || 0;
            return this.cnt++;
        },

        send: function() {
            if (this.clientId !== this.generatorId) {
                return;
            }
            setTimeout(function() {
                if (_pool.length > 0) {
                    var rand = Math.floor(Math.random() * _pool.length);
                    publisher.publish(_pool[rand]+':MESSAGE', 'Hello');
                    log.info('Send message:', _pool[rand], 'Hello'); 
                    this.send();
                }
            }.bind(this), 2000);
        },
        
        dump: function() {
            if (this.clientId !== this.generatorId) {
                return;
            }
            subscriber.unsubscribe();
            publisher.publish('SET:GENERATOR', 'client2'); 
            publisher.publish('client2:SET:POOL', JSON.stringify(_pool)); 
        }
    };  
};
