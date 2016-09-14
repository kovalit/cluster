"use strict";

var errors      = require('./errors');
var redis       = require('redis');
var generator   = require('./generator');
var handler     = require('./handler');
var parseArgs   = require('minimist')
var log         = require('./log')(module);

/**
 * Проверка режима запуска
 */
var argv = parseArgs(process.argv.slice(2));
if (argv._[0] === 'getErrors') {
    errors();
}
else {
    init();
}
  
/**
 * 
 */
function init() {

    var clientID    = process.env.clientID;

    if (!clientID) {
        log.error('Environment variable (clientID) is not set.');
        process.exit(1);
    }

    log.info('APP. Start client:', clientID);

    var subscriber      = redis.createClient();
    var publisher       = redis.createClient();
    var errorCollector  = redis.createClient();

    var _generator      = generator(publisher, subscriber);
    var _handler        = handler(publisher, subscriber, errorCollector);
    
    var isGenerator = 'client1' === clientID;
    var client = setClient(isGenerator, clientID);

    client.add();

    /**
     * Всех обработчиков подписывает на событие назначения генератором. 
     * Обратное не рассматриваем. В рамках данной задачи и ее реализации,
     * нет условий, при которых генератор становится обработчиком.
     */
    if (!isGenerator) {

        var setPoolChannel  =  clientID + ':SET:POOL';
        var setGenChannel   =  clientID + ':SET:GENERATOR';

        subscriber.subscribe(setPoolChannel);
        subscriber.subscribe(setGenChannel);  

        subscriber.on("message", function(channel, message) {
            if (channel === setGenChannel) {
                console.log(clientID);
                client = setClient(true, clientID);

                log.info('APP: Swith generator to:', message);

          } else if (channel === setPoolChannel) {

                log.info('APP: Set pool:', message);

                _generator.restorePool(message);
                _generator.send();

          }

       });
    };

    /**
     * Устанавливает тип клиента: генератор или обработчик
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
        client.close();
        process.exit(1);
    };

    /**
     * События завершения приложения
     */
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', function(e){
        console.log('[uncaughtException] app will be terminated: ', e.stack);
        shutdown();
    });

    process.stdin.resume();
    
};