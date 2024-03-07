const { createLogger, transports, format } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const responseLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const elapsedTime = Date.now() - start;
    const { statusCode, statusMessage } = res;
    const { method, originalUrl } = req;
    const timestamp = new Date().toISOString();

    const logData = {
      method,
      path: originalUrl,
      statusCode,
      statusMessage,
      elapsedTime,
      timestamp,
    };

    const logger = createLogger({
      transports: [
        new DailyRotateFile({
          filename: "logs/app-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "4d", 
        }),
      ],
      format: format.combine(format.timestamp(), format.json()),
    });

    logger.info(logData);
  });

  next();
};

module.exports = responseLogger;
