var winston = require('winston');

module.exports = function(module) {
    return makeLogger(module.filename);
};

function makeLogger(path) {
    
    var options = {     
        colorize: true,
        level: 'info'
    };

    if (path.match(/generator.js$/)) {
        options.timestamp = true;
    } 
    
    var transports = [
        new winston.transports.Console(options)
    ];
    
    return new winston.Logger({
        transports: transports 
    }); 
}

