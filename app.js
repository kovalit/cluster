"use strict";

var parseArgs   = require('minimist');
var async       = require('async');
var client      = require('./client');
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
    var worker;

    if (!clientID) {
        log.error('APP Environment variable (clientID) is not set.');
        process.exit(1);
    }

    log.info('APP Start client:', clientID);
    
    async.waterfall([
        
        function (callback) {
            
            client.getType(clientID, callback);
            
        }], function (err, isGenerator) {
        
            if (err) throw err;
            
            worker = client.create(isGenerator, clientID);
            
            /**
            * Всех обработчиков подписываем на событие переключения в режим генератора. 
            * Обратное не рассматриваем. В рамках данной задачи не обозначено
            * событие, при котором действующий генератор становится обработчиком.
            */
           client.switchEvent(isGenerator, clientID, function() {
                worker = client.create(true, clientID);
                worker.restore();
           });
    });  
    
    /**
     * Закрывает соединение и завершает приложение
     */
    function shutdown() {
        worker.close(function() {
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