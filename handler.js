"use strict";

var log = require('./log')(module);

module.exports = function (publisher, subscriber, errorCollector) {
    
    return {
        
        /**
         * Идентификатор обработчика
         */
        id: null,
        
        /**
         * Идентификатор генератора
         */
        generatorId: null,
    
    
        /**
         * Устанавливает идентификатор обработчика 
         * 
         * @param {String} id
         */
        setId: function(id) {
            this.id = id;
            log.info('HANDLER: Set ID:', id);
        },
        
        
        /**
         * Устанавливает идентификатор генератора
         * 
         * @param {String} id
         */
        setGeneratorId: function(id) {
            this.generatorId = id;
        },


        /**
         * Публикует событие добавления нового обработчика сообщений
         */
        add: function() {
            if (this.id !== this.generatorId) {
                publisher.publish('ADD:HANDLER', this.id); 
            }  
        },
        
        
        /**
         * Публикует событие удаления обработчика сообщений
         */
        remove: function() { 
            
            if (this.id !== this.generatorId) {
                subscriber.unsubscribe();
                publisher.publish('REMOVE:HANDLER', this.id); 
            }

        },


        /**
         * Подписка на события от генератора
         */
        subscribe: function() {

            if (this.id === this.generatorId) {
                return;
            }
            
            var getMessageChannel = this.id + ':MESSAGE';

            subscriber.subscribe(getMessageChannel);

            subscriber.on("message", function(channel, message) {  
                
                if (channel === getMessageChannel) {
                    
                    this.read(message, this.save);
                    
                    log.info('Get a message:', message, 'to', channel);
                    
                }   
                
            }.bind(this));

        },
        
        
        /**
         * Обработка сообщения (eventHandler)
         * 
         * @param {String} msg
         * @param {Function} callback
         */
        read: function(msg, callback) {
            function onComplete(){
                var error = Math.random() > 0.85;
                callback(error, msg);
            }
            // processing takes time...
            setTimeout(onComplete, Math.floor(Math.random()*1000));
        },
        
        
        /**
         * Сохранение сообщения
         * 
         * @param {Boolean} error
         * @param {Function} msg
         */
        save: function(error, msg) {
            errorCollector.sadd('errors', msg);
            log.info('Error:', error, 'msg', msg);
        }  
        
    };
};