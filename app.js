"use strict";

var redis       = require('redis');
var parseArgs   = require('minimist');
var async       = require('async');
var generator   = require('./generator');
var handler     = require('./handler');
var getErrors   = require('./errors');
var log         = require('./log')(module);

/**
 * Переключение между режимами запуска
 */
var argv = parseArgs(process.argv.slice(2));
if (argv._[0] === 'getErrors') {
    getErrors();
}
else {
    main();
}
  
/**
 * Основной режим
 */
function main() {

    var clientID    = process.env.clientID;

    if (!clientID) {
        log.error('APP Environment variable (clientID) is not set.');
        process.exit(1);
    }

    log.info('APP Start client:', clientID);

    var publisher       = redis.createClient();
    var subscriber      = redis.createClient();
    var redisClient     = redis.createClient();

    var _generator      = generator(publisher, subscriber, redisClient);
    var _handler        = handler(publisher, subscriber, redisClient);
    
    var isGenerator     = false;
    var client;
    
    async.waterfall([

        function(callback) {          
            redisClient.get("generatorId", function(err, reply) {
                if (err) callback(err);
                
                if (!reply) {
                    redisClient.set("generatorId", clientID);
                    isGenerator = true;
                }
                callback(null);
            });
            
        }], function (err) {
            if (err) throw err;
            
            client = setClient(isGenerator, clientID);
            client.add();
            
            /**
            * Всех обработчиков подписываем на событие переключения в режим генератора. 
            * Обратное не рассматриваем. В рамках данной задачи не обзначено
            * событие, при котором действующий генератор становится обработчиком.
            */
           if (!isGenerator) {
               
               var setGenChannel = clientID + ':SET:GENERATOR';
               subscriber.subscribe(setGenChannel);  

               subscriber.on("message", function(channel, message) {
                    if (channel === setGenChannel) {
                       client = setClient(true, clientID);
                       client.restore();

                       log.info('APP Swith generator to:', message);
                    }
              });
           };
    });  



    /**
     * Устанавливает тип клиента: генератор или обработчик
     * 
     * @param {Boolean} isGen
     * @param {String} clientId
     * @return {Object} _client
     */
    function setClient(isGen, clientId) {
                
        var _client;

        if (isGen) {
            _client = _generator;
        }
        else {
            _client = _handler;
        }

        _client.setId(clientId);
        _client.unsubscribe();
        _client.subscribe();

        return _client;
    };
    
    /**
     * Закрывает соединение и завершает приложение
     */
    function shutdown() {
        client.close(function() {
           process.exit(1); 
        }); 
    };

    /**
     * События завершения приложения
     */
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', function(e){
        log.error('[uncaughtException] app will be terminated:', e.stack);
        shutdown();
    });

    process.stdin.resume();
    
};