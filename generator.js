"use strict";

var log = require('./log')(module);

module.exports = function (publisher, subscriber) {
    
    var _pool = [];
    
    return {
        
        id: null,
        clientId:  null,
        

        /**
         * Устанавливает идентификатор генератора
         * 
         * @param {String} id
         */
        setId: function(id) {
            this.id = id;
            log.info('GENERATOR: Set ID:', id);
        },


        /**
         * Устанавливает идентификатор текущего экземпляра
         * 
         * @param {String} id
         */
        setClientId: function(id) {
            this.clientId = id;
            log.info('GENERATOR: Set client ID:', id);
        },
        
        
        /**
         * Добавляет идентификатор обработчика событий в пул генератора
         * 
         * @param {String} id
         */
        addHandlerId: function(id) {
            _pool.push(id);
            if (_pool.length === 1) {
                this.send();
            }
            log.info('GENERATOR: Connect a new handler:', id);
        },
        
        
        /**
         * Удаляет идентификатор обработчика событий из пула генератора
         * 
         * @param {String} id
         */
        removeHandlerId: function(id) {
            for (var i = 0, length = _pool.length; i< length; i++) {
                if  (_pool[i] === id) {
                    _pool.splice(i, 1);
                }
            }
            log.info('GENERATOR: Disconnect a handler:', id);
        },
        
        
        /**
         * Восстанавливает пул генератора из списка обработчиков
         * 
         * @param {String} handlerList
         */
        restorePool: function(handlerList) {
            
            _pool = JSON.parse(handlerList);
            
            this.deleteHandlerId(this.id);
            
            log.info('GENERATOR: Restore pool:', _pool);
        },


        /**
         * Подписка на события от обработчиков сообщений
         */
        subscribe: function() {

            if (this.clientId !== this.id) {
                return;
            }

            subscriber.subscribe('ADD:HANDLER');
            subscriber.subscribe('REMOVE:HANDLER');

            subscriber.on("message", function(channel, message) {
                
                if (channel === 'ADD:HANDLER') {
                    
                    this.addHandlerId(message);
                    
                } else if (channel === 'REMOVE:HANDLER') {
                    
                    this.removeHandlerId(message);
                    
                }
            }.bind(this));
        },
        
        
        /**
         * Генерирует сообщение для обработчиков
         */
        getMessage: function(){
            this.cnt = this.cnt || 0;
            return this.cnt++;
        },


        /**
         * Отправляет сообщения обработчикам
         */
        send: function() {
            
            if (this.clientId !== this.id) {
                return;
            }
            
            setTimeout(function() {
                
                if (_pool.length > 0) {
                    
                    var rand = Math.floor(Math.random() * _pool.length);
                    var message = this.getMessage();
                    
                    publisher.publish(_pool[rand] + ':MESSAGE', 'Hello ' + message);
                    
                    log.info('Send message:', _pool[rand], 'Hello ' + message); 
                    
                    this.send();
                }
                
            }.bind(this), 2000);
            
        },
        
        /**
         * Остановка текущего генератора. 
         * Публикует сообщение всем обработчикам о назначении нового генератора.
         * Передает новому генератору пул обработчиков 
         */
        stop: function() {
            
            if (this.clientId === this.id) {
                
                subscriber.unsubscribe();
                
                publisher.publish('SET:GENERATOR', 'client2'); 
                publisher.publish('client2:SET:POOL', JSON.stringify(_pool)); 
                
            }
          
        }
        
    };  
};