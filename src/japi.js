/**
 * HTTP MOCK
 * @class HTTPMOCK
 */

function JHTTPAPI(logger) {
    var _api = [];

    /**
     * @method generateRegExp
     * @param {*} url 
     * 
     * this method generates a regExp based on user defined API
     * eg /api/users/:userID
     */
    function generateRegExp(url) {
        var replacer = "\/(\\w+)",
            paramsMapping = [];
        url = url.replace(/([\/]|)([:]|)+(\w+)/g, function(match) {
            if (match.indexOf(":") > -1) {
                paramsMapping.push(match.split(":")[1]);
                return replacer;
            }
            return match;
        });

        return ({
            params: {},
            paramsMapping: paramsMapping,
            regexp: new RegExp("(?:" + url.split("?")[0] + ")$")
        });
    }

    /**
     * 
     * @param {*} str 
     * @return str
     */
    function lower(str) {
        return (str || '').toLocaleLowerCase();
    }

    /**
     * 
     * @param {*} options
     */
    function removeByURL(options) {
        if (options && (!options.url || !options.method)) {
            return;
        }

        _api = _api.filter(function(item) {
            return (item.url !== options.url && lower(options.method) !== lower(item.method));
        });
    }

    /**
     * 
     * @param {*} options 
     * {
     *  url: STRING,
     *  method: STRING,
     *  response: {
     *      headers:Object,
     *      text:String,
     *      status: Number 
     *  },
     *  controller: Function
     */
    this.set = function(options) {
        var _error = [],
            self = this;
        /**
         * check if option is an ARRAY
         */
        if (typeof options === "object" && options.length) {
            [].forEach.call(options, function(element) {
                validateAndRegister(element);
            });
        } else {
            validateAndRegister(options)
        }

        function validateAndRegister(settings) {
            var error = [];
            /**
             * validate options
             */
            if (!settings.url || !settings.method) {
                error.push("Invalid Api. url and method are required");
            }

            if (self.isExists(settings)) {
                error.push('Api already exists');
            }

            if (!error.length) {
                /**
                 * register the api
                 */
                settings._ = generateRegExp(settings.url);
                /**
                 * if no response was defined
                 * set default response
                 */
                if (!settings.response) {
                    settings.response = {
                        headers: {},
                        text: null,
                        status: 200
                    };
                }

                _api.push(settings);
            }

            _error.push.apply(_error, error);
        }

        if (_error.length) {
            logger.error(null, _error);
        }


        return this;
    }

    /**
     * 
     * @param {*} api 
     * Match the requested Api against stored APIS
     * using regExp
     */
    this.get = function(api) {
        var found = _api.filter(function(item) {
            return item._.regexp.test(api.url.split('?')[0]) && lower(item.method) == lower(api.method);
        })[0];

        if (found) {
            return extend(true, found);
        }

        return found;
    };

    /**
     * Check if an API already exists
     * @param {*} api
     */
    this.isExists = function(api) {
        return _api.some(function(item) {
            return item.url === api.url.split('?')[0] && lower(api.method) === lower(item.method);
        });
    };

    /**
     * Remove an Ajax mock from those held in memory. This will prevent any
     * future Ajax request mocking for matched requests.
     * NOTE: Clearing a mock will not prevent the resolution of in progress requests
     * 
     * @param {*} option optional
     * {
     *     url: String,
     *     method: String
     * }
     */
    this.clear = function(option) {
        if (option && typeof option === 'object') {
            removeByURL(option);
        } else {
            _api.length = 0;
        }
    };
}