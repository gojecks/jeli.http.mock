(function() {
    'use strict';
    /**
     * LocalStorage Server
     */
    function _localStorageServer(isServerInstance) {
        var CORE_SOCKET_NAME = "[[_:lss:]]",
            CORE_MESSAGE_NAME,
            _hashId = null;

        /**
         * Creates the server instance if not exists
         * @param {*} definition
         * {
         *      domain: String,
         *      port: number
         * }
         */
        function createServerIfNotExists(definition) {
            _hashId = hashCode(definition.domain);
            /**
             * set CORE_MESSAGE_NAME
             * by concating hashId and port
             */
            CORE_MESSAGE_NAME = ['[[:jsm:message', _hashId, definition.port, ']]'].join(':');

            if (isServerInstance) {
                var openedSockets = JSON.parse(localStorage[CORE_SOCKET_NAME] || '{}');
                if (!openedSockets[_hashId]) {
                    openedSockets[_hashId] = {
                        ports: []
                    };
                }

                if (0 > openedSockets[_hashId].ports.indexOf(definition.port)) {
                    openedSockets[_hashId].ports.push(definition.port);
                    localStorage.setItem(CORE_SOCKET_NAME, JSON.stringify(openedSockets));
                }
            }
        }

        /**
         * 
         * @param {*} data 
         */
        function _send(data) {
            if (isDestroyed()) { return; }
            localStorage.setItem(CORE_MESSAGE_NAME, JSON.stringify(data));
            localStorage.removeItem(CORE_MESSAGE_NAME);
        }

        /**
         * startListener sets a listener for storgeEvent
         */
        function startListener(eventListener) {
            window.addEventListener('storage', function(e) {
                switch (e.key) {
                    case (CORE_MESSAGE_NAME):
                        var eData;
                        try {
                            eData = JSON.parse(e.newValue);
                        } catch (e) {} finally {
                            if (eData) {
                                eData = extend({
                                    type: "socket",
                                    time: +new Date
                                }, eData);
                                eventListener(eData);
                            }
                        }
                        break;
                    default:

                        break;
                }
            }, false);

        }

        /**
         * check if storage is destroyed
         */
        function isDestroyed() {
            return !localStorage[CORE_SOCKET_NAME];
        }


        /**
         * 
         * @param {*} ip
         */
        function validateDomain(ip) {
            if (-1 < ['localhost'].indexOf(ip)) {
                return true;
            }

            return isValidIpv4Addr(ip);
        }

        /**
         * 
         * @param {*} definition 
         * @param {*} eventListener 
         */
        function _listen(definition, eventListener) {
            if (definition.port && definition.domain) {
                if (isNaN(parseInt(definition.port))) {
                    throw new Error('Invalid Port Entered');
                }

                if (!validateDomain(definition.domain)) {
                    throw new Error('Invalid IP Address or domain');
                }

                /**
                 * create serve if not exists and start listening for changes
                 */
                createServerIfNotExists(definition);
                startListener(eventListener);
            } else {
                throw new Error('Failed to initialize socket and port are required');
            }
        }

        function _onDestroy(cb) {
            window.addEventListener('beforeunload', function(e) {
                (cb || function() {})(e);
                if (isServerInstance) {
                    localStorage.removeItem(CORE_SOCKET_NAME);
                }
            });
        }

        /**
         * disconnect from listeners
         */
        function _disconnect() {
            window.removeEventListener('beforeunload');
            window.removeEventListener('storage');
        }

        /**
         * public API
         */
        var ret = Object.create({
            listen: _listen
        });

        ret.send = _send;
        ret.onDestroy = _onDestroy;
        ret.disconnect = _disconnect;

        return ret;
    }
    /**
     * reference the localStorage Server
     */
    window.localServer = _localStorageServer;
})();