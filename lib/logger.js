var winston = require("winston");

const syslogColors = {
  debug: "rainbow",
  info: "cyan",
  notice: "white",
  warning: "yellow",
  error: "bold red",
  crit: "inverse yellow",
  alert: "bold inverse red",
  emerg: "bold inverse magenta",
};

let alignColorsAndTime = winston.format.combine(
  winston.format.colorize({
    all: true,
    colors: syslogColors,
  }),
  winston.format.simple()
);

var logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.TRELLO_LOG || "warning",
      format: alignColorsAndTime,
    }),
  ],
  levels: winston.config.syslog.levels,
});

module.exports = logger;
