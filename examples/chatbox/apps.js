(function() {
    'use strict';
    jeli('chat.service', {
            requiredModules: ['jeli']
        })
        .service('server', serverFn)
        .element({
            selector: 'chat-app',
            template: '<j-place #chatTemplate></j-place>',
            DI: ['$sessionStorage', 'server']
        }, chatAppFn);

    //chatAppFn
    function chatAppFn($sessionStorage, server) {
        var $chatUser = "_chat_rec_",
            $db = null,
            $syncService = {},
            $interVal = null,
            $timer = 2000,
            _socket = null,
            _this = this;
        var req = new jdb('jChatService', 1)
            .isClientMode()
            .open({
                logService: console.log,
                live: true,
                $ajax: server.request
            })
            .onUpgrade(function(res) {
                $db = res.result;
                createTable();
            })
            .onSuccess(function(e) {
                //set DB
                $db = e.result;
                $syncService = $db
                    .synchronize()
                    .Entity()
                    .configSync({});
            })
            .onError(console.log);

        function queryHandler() {
            this.onSuccess = function(ret) {
                switch (ret.state) {
                    case ("insert"):
                    case ("sync"):

                        break;
                    case ('select'):

                        break;
                }
            };

            this.onError = function(ret) {
                console.log(ret);
            };
        }

        /**
         * create our chat table
         */
        function createTable() {
            $db
                .createTbl('chat')
                .onSuccess(function(e) {
                    var tbl = e.result;
                    tbl
                        .Alter
                        .add
                        .column('id', { AUTO_INCREMENT: 1, type: 'INT' })
                        .column("message", { type: "TEXT" })
                        .column("time", { type: "DATETIME" })
                        .column("user", { type: "VARCHAR" });
                })
                .onError(console.log);
        }

        function checkActiveUser() {
            if ($sessionStorage.getItem($chatUser)) {
                _this.chat.username = $sessionStorage.getItem($chatUser);
                _this.chat.userConnected = true;
                $db.jQl('select -* -chat', {
                    onSuccess: function(ret) {
                        _this.chat.chatList = ret.getResult();
                    },
                    onError: function(ret) {
                        console.log(ret);
                    }
                });

                function poll() {
                    //set interval
                    if (_this.chat.userConnected) {
                        var list = _this.chat.chatList;
                        var ls = localServer();
                        (new server.socket(ls))
                        .connect({
                            domain: 'localhost',
                            port: 3000
                        }, function(socket) {
                            _socket = socket;
                            ls.onDestroy(function() {
                                socket.emit('user.disconnected', {
                                    user: _this.chat.username
                                });
                            });

                            console.log(socket)

                            socket
                                .emit('user.connected', {
                                    user: _this.chat.username
                                })
                                .on('new.message', function(e) {
                                    _this.chat.chatList.push(e._data);
                                    _this.$consume();
                                })
                                .on('user.typing', function(e) {
                                    _this.chat.typing = e._data;
                                    _this.$consume();
                                });


                            socket.on('server.destroyed', function(eData) {
                                alert('Server Instance is destroyed');
                            });

                            socket.on('server.reconnected', function() {
                                socket.emit('user.reconnected', {
                                    user: _this.chat.username
                                })
                            });
                        });
                    }
                }

                poll();

            }
        }

        function connectUser() {
            $sessionStorage.setItem($chatUser, _this.chat.username);
            checkActiveUser();
        }

        this.chat = {
            username: "",
            userConnected: false,
            chatList: []
        };

        //create function
        this.$create = function() {
            if (this.chat.username) {
                var users = $db._users();
                users.isExists({ key: this.chat.username })
                    .then(function(res) {
                        if (!res.isExists) {
                            users
                                .add({ key: _this.chat.username, password: '_null' })
                                .onSuccess(function(res) {
                                    if (res.ok) {
                                        connectUser();
                                    }
                                })
                                .onError(function(res) {

                                })
                        } else {
                            connectUser();
                        }
                    }, connectUser);
            }
        };


        this.$postChat = function($ev) {
            var chatBox = $ev.currentTarget;
            if ($ev.keyCode === 13) {
                if (chatBox && chatBox.value) {
                    var postData = [{
                        message: chatBox.value,
                        time: +new Date,
                        user: _this.chat.username
                    }];

                    $db.jQl('insert -%data% -chat', new queryHandler(), {
                        data: postData
                    });

                    _this.chat.chatList.push(postData[0]);
                    chatBox.value = "";
                    _socket.broadcast('user.typing', {
                        user: false
                    });
                    _socket.broadcast('new.message', postData[0]);

                }
            } else {
                _socket.broadcast('user.typing', {
                    user: _this.chat.username
                });
            }
        };

        this.$disconnect = function() {
            $sessionStorage.removeItem($chatUser);
            this.chat.userConnected = false;
        };

        checkActiveUser();
    }

    /**
     * server fn
     */
    function serverFn() {
        var server = new jHttp({});
        var app = new server.app();

        server.interceptor
            .set({
                type: 'response',
                handler: function(request) {}
            });
        /**
         * register request
         */
        app.get('/user/exists', function(instance) {
            instance.res.status(200).responseText({ isExists: true }).exit();
        });

        app.get('/query', function(instance) {
            instance.res.status(200).responseText({ _rec: [] }).exit();
        })

        app.put('/state/push', function(instance) {
            instance.res.status(200).responseText({ ok: true }).exit();
        });

        return server;
    }

    jeli.app
        .bootstrapWith('chat.service', 'chat-app');
})();