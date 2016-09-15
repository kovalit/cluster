"use strict";

var log             = require('./log')(module);
var generator       = require('./generator');
var handler         = require('./handler');
var redis           = require('redis');

var publisher       = redis.createClient();
var subscriber      = redis.createClient();
var redisClient     = redis.createClient();


module.exports = {
    
        /**
        * Создает клиента: генератор или обработчик
        * 
        * @param {Boolean} isGenerator
        * @param {String} clientId
        * @return {Object} client
        */
        create: function(isGenerator, clientId) {
      
            var client;

            if (isGenerator) {
                client = generator(publisher, subscriber, redisClient);
            }
            else {
                client = handler(publisher, subscriber, redisClient);
            }

            client.setId(clientId);
            client.unsubscribe();
            client.subscribe();
            
            if (!isGenerator) {
                client.add(); // add to handler list
            }

            return client;
        },
        
        
        /**
         * Выбирает тип клиента
         * 
         * @param {String} clientId
         * @param {Function} callback
         */
        getType: function (clientId, callback) {
            redisClient.get("generatorId", function(err, reply) {
                if (err) callback(err);
                
                var isGenerator = false;
                
                if (!reply) {
                    redisClient.set("generatorId", clientId);
                    isGenerator = true;
                }
                callback(null, isGenerator);
            });
        },
        
        
        /**
         * Подписка на событие, которое меняет обработчик на генератор
         * 
         * @param {Boolean} isGenerator
         * @param {String} clientId
         * @param {Function} callback
         */
        switchEvent: function (isGenerator, clientId, callback) {
            if (!isGenerator) {

                   var setGenChannel = clientId + ':SET:GENERATOR';
                   subscriber.subscribe(setGenChannel);  

                   subscriber.on("message", function(channel, message) {
                        if (channel === setGenChannel) {
                           callback();
                           log.info('APP Swith generator to:', message);
                        }
                  });
               };
       }
     
};


