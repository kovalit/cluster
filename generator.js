"use strict";

module.exports = function (publisher, subscriber) {
    
    var _pool = [];
    
    return {
        
        clientId:  null,
        
        init: function(clientId) {
            this.clientId = clientId;
        },
        
        addPool: function(clientId) {
            _pool.push(clientId);
        },


        deletePool: function(clientId) {
            for(var i = _pool.length; i--;) {
                if(_pool[i] === clientId) {
                    _pool.splice(i, 1);
                }
            }
        },

        subscribe: function() {

            if (this.clientId !== 'client1') {
                return;
            }

            subscriber.subscribe('addClient');
            subscriber.subscribe('deleteClient');

            subscriber.on("message", function(channel, message) {
                if (channel === 'addClient') {
                    this.addPool(message);
                }
                if (channel === 'deleteClient') {
                    this.deletePool(message);
                }
                console.log(_pool);
            }.bind(this));
        },


        send: function() {
            if (this.clientId !== 'client1') {
                return;
            }
            setInterval(function() {
                if (_pool.length > 0) {
                    var rand = Math.floor(Math.random() * _pool.length);
                    publisher.publish(_pool[rand], 'Hello'); 
                    console.log(_pool[rand]);
                }
            }.bind(this), 2000);
        }
    }
    
}

//function getMessage(){
//    this.cnt = this.cnt || 0;
//    return this.cnt++;
//}


