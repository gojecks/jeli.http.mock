/**
 * logger Instance
 */
var logger = {
        _log: function logger(mockOptions, args, level) {
            var loggerLevel = 2;
            var logLevelMethods = ['error', 'warn', 'info', 'log', 'debug'];
            if (mockOptions && typeof mockOptions.logging !== 'undefined') {
                loggerLevel = mockOptions.logging;
            }
            level = (level === 0) ? level : (level || logLevels.LOG);
            args = (args.splice) ? args : [args];

            // Is logging turned off for this mock or mockjax as a whole?
            // Or is this log message above the desired log level?
            if (loggerLevel === false || loggerLevel < level) {
                return;
            }

            if (mockOptions.log) {
                return mockOptions.log(args[1] || args[0]);
            } else if (mockOptions.logger && mockOptions.logger[logLevelMethods[level]]) {
                return mockOptions.logger[logLevelMethods[level]].apply(mockOptions.logger, args);
            }
        },
        /**
         * Convenience method for logging a DEBUG level message
         * @param  {Object} m  The mock handler in question
         * @param  {Array|String|Object} a  The items to log
         * @return {?}  Will return whatever the $.mockjaxSettings.logger method for this level would return (generally 'undefined')
         */
        debug: function(m, a) { return this._log(m, a, logLevels.DEBUG); },
        /**
         * @see logger.debug
         */
        log: function(m, a) { return this._log(m, a, logLevels.LOG); },
        /**
         * @see logger.debug
         */
        info: function(m, a) { return this._log(m, a, logLevels.INFO); },
        /**
         * @see logger.debug
         */
        warn: function(m, a) { return this._log(m, a, logLevels.WARN); },
        /**
         * @see logger.debug
         */
        error: function(m, a) { return this._log(m, a, logLevels.ERROR); }
    },
    logLevels = {
        DEBUG: 4,
        LOG: 3,
        INFO: 2,
        WARN: 1,
        ERROR: 0
    };