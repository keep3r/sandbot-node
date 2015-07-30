var express = require('express'),
    path = require('path'),
    http = require('http'),
    queue = require('./routes/queue'),
    move = require('./routes/move'),
    info = require('./routes/info'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    static = require('serve-static');


global.ControllingSocketId = null;
global.ControlDuration = 10;// [s]

var app = express();


app.set('port', process.env.PORT || 80);

app.use(logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
app.use(bodyParser.json());
app.use(static(path.join(__dirname, 'public')));


var theServer = http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(theServer);

var theQueue = new queue(io);
var theInfo = new info(io);

var numUsers = 0;

io.on('connection', function(socket)
{

    /*
    console.log(io.sockets.sockets.map(function(e) {
        return e.username;
    }));
    */

    var addedUser = false;

    console.log('user connected: ' + socket.id);

    socket.emit('queue', theQueue.getQueue());
    socket.emit('info', theInfo.getInfo());

    var theControlUser = theQueue.getControlUser()
    if(theControlUser) socket.emit('ControlStart', theControlUser);

    socket.on('check user', function (username, fn)
    {
        console.log('check user');

        if(username.length < 2)
        {
            fn('Name ist zu kurz');
            return;
        }

        for(var i=0;i<io.sockets.sockets.length;i++)
        {
            if(io.sockets.sockets[i].id != socket.id && io.sockets.sockets[i].username == username)
            {
                fn('Dieser Name ist bereits vergeben');
                return;
            }
        }

        fn(null);
    });

    socket.on('add user', function (username, fn)
    {
        for(var i=0;i<io.sockets.sockets.length;i++)
        {
            if(io.sockets.sockets[i].id != socket.id && io.sockets.sockets[i].username == username)
            {
                console.log(username);
                username = username + (Math.floor(Math.random() * 100) + 1);
            }
        }

        // we store the username in the socket session for this client
        socket.username = username;

        if(!addedUser)
        {
            ++numUsers;
            addedUser = true;
        }

        socket.emit('login', {
            numUsers: numUsers,
            username: socket.username
        });

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });

        fn(username);
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data)
    {
        console.log('new message' + data);
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });


    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    socket.on('add control user', function(fn)
    {
        theQueue.addUserToQueue(socket.username, socket.id, fn);
        io.emit('queue', theQueue.getQueue());
    });

    socket.on('move', function(data, fn)
    {
        if(socket.id == global.ControllingSocketId)
        {
            move.moveRobot(data, fn);
        }
        else
        {
            fn(false);
        }
    });

    socket.on('disconnect', function()
    {
        console.log('user disconnected: ' + socket.id);

        // remove user from control queue
        if(theQueue.removeUserFromQueue(socket.id))
        {
            io.emit('queue', theQueue.getQueue());
        }

        // remove the username from global usernames list
        if (addedUser)
        {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});