/**
 * 
 * @param {*} server
 */
function JHttpSocket(server) {
    var socketId = "sock_" + hashCode(+new Date);
    /**
     * 
     * @param {*} definition 
     * @param {*} handler 
     */
    this.connect = function(definition, handler) {
        var mainSocket = new _socket();
        server.listen(definition, mainSocket._trigger);
        handler(mainSocket);
    };

    /**
     * 
     * @param {*} eventId 
     * @param {*} data 
     * 
     * broadcast the event to the server
     */
    function _emit(eventId, data) {
        server.send({
            _eventId: eventId,
            _data: data
        });
    }

    this.disconnect = function() {
        server.send({
            _eventId: 'user.disconnected',
            _data: {
                id: socketId
            }
        });
        server.disconnect();
    };

    /**
     * socket class
     */
    function _socket() {
        var socket_events = {};
        this.id = socketId;
        /**
         * private API
         * @param {*} eData 
         */
        this._trigger = function(eData) {
            if (socket_events.hasOwnProperty(eData._eventId)) {
                socket_events[eData._eventId](eData);
            }
        };

        /**
         * 
         * @param {*} eventId 
         * @param {*} handler 
         */
        this.on = function(eventId, handler) {
            socket_events[eventId] = handler;
            return this;
        };

        /**
         * 
         * @param {*} eventId 
         */
        this.off = function(eventId) {
            if (socket_events.hasOwnProperty(eventId)) {
                delete socket_events[eventId];
            }

            return this;
        };
    }

    /**
     * 
     * @param {*} eventId 
     * @param {*} data 
     */
    _socket.prototype.emit = function(eventId, data) {
        _emit(eventId, data);
        return this;
    };


    /**
     * 
     * @param {*} eventId 
     * @param {*} data 
     */
    _socket.prototype.broadcast = function(eventId, data) {
        _emit(eventId, data);
        return this;
    };
}