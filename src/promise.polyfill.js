    /**
     * 
     * @param {*} resolver 
     */
    function _Promise(resolver) {
        var _succ = [],
            _err = [],
            state = -1,
            _cachedValue = null;
        var PROMISE_STATUS = "[[PromiseStaus]]";
        var PROMISE_VALUE = "[[PromiseValue]]";

        /**
         * error handler
         */
        function fail() {
            while (_err.length) {
                fn = _err.shift();
                fn.apply(fn, arguments);
            }
        }

        /**
         * success handler
         */
        function success() {
            while (_succ.length) {
                fn = _succ.shift();
                fn.apply(fn, arguments);
            }
        }

        /**
         * trigger the state only when changed
         */
        function triggerIfStatusChanged() {
            if (state > -1) {
                if (state) {
                    success.apply(null, _cachedValue);
                } else {
                    fail.apply(null, _cachedValue);
                }
            }
        }

        /**
         * core promise instance
         */
        function _promise() {
            this[PROMISE_STATUS] = "pending";
            this[PROMISE_VALUE] = null;

            var self = this;
            /**
             * @param {*} success
             * @param {*} error
             */
            resolver(function() {
                state = 1;
                resolve.apply(null, arguments);
                success.apply(null, arguments);
            }, function() {
                state = 0;
                resolve.apply(null, arguments);
                fail.apply(null, arguments);
            });

            /**
             * change the static state
             */
            function resolve() {
                self[PROMISE_VALUE] = _cachedValue = [].slice.call(arguments);
                self[PROMISE_STATUS] = "resolved";
            }
        }
        /**
         * 
         * @param {*} suc 
         * @param {*} err 
         */
        _promise.prototype.then = function(suc, err) {
            if (suc) {
                _succ.push(suc);
            }

            if (err) {
                _err.push(err);
            }

            triggerIfStatusChanged();
            return this;
        };

        /**
         * 
         * @param {*} fn 
         */
        _promise.prototype.catch = function(fn) {
            _err.push(fn);
            triggerIfStatusChanged();
            return this;
        };

        /**
         * 
         * @param {*} fn 
         */
        _promise.prototype.subscribe = function(fn) {
            _succ.push(fn);
            triggerIfStatusChanged();
        };

        /**
         * trigger user callback
         */
        if (!resolver) {
            throw new Error('Promise resolver undefined is not a function');
        }

        return (new _promise);
    };