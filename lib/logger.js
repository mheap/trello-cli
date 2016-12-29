var winston = require("winston");

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            "level": "warning",
            "colorize": true
        }),
    ]
});

syslogColors = {
    debug: 'rainbow',
    info: 'cyan',
    notice: 'white',
    warning: 'yellow',
    error: 'bold red',
    crit: 'inverse yellow',
    alert: 'bold inverse red',
    emerg: 'bold inverse magenta'
};
winston.addColors(syslogColors);
logger.setLevels(winston.config.syslog.levels);

module.exports = logger;