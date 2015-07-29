var myCookieData = Cookies.getJSON('data');
var myQueueUpdateInterval = 1000;
var myInfoUpdateInterval = 10000;
var myUpdateQueueIntervalTimer;
var myKeyPressStartTime;
var myLastKeyPress;
var myUserObject;

var socket = io();

// Socket Event
socket.on('queue', function(msg)
{
    ProcessQueueData(msg);
});

socket.on('info', function(data)
{
    $('#voltage').text(data.Voltage);
});

socket.on('ControlStart', function(data)
{
    ControlStart(data);
});

socket.on('ControlStop', function()
{
    ControlStop();
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
    console.log('new message' + data);
    addChatMessage(data);
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data)
{
    log(data.username + ' joined');
    addParticipantsMessage(data);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function (data)
{
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', function (data) {
    addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', function (data) {
    removeChatTyping(data);
});

var $messages = $('.messages'); // Messages area

function addParticipantsMessage (data)
{
    $('#chatUserCount').text(data.numUsers);
}

$('#chatMessage').on('input', function() {
    updateTyping();
});

var typing = false;
var TYPING_TIMER_LENGTH = 400; // ms

// Updates the typing event
function updateTyping () {
    if (true) {
        if (!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();

        setTimeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }
}

// Log a message
function log (message, options)
{
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
}

var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

var FADE_TIME = 150; // ms

// Adds the visual chat message to the message list
function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
        .text(data.username)
        .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
}

// Gets the color of a username through our hash function
function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}

// Gets the 'X is typing' messages of a user
function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
        return $(this).data('username') === data.username;
    });
}

// Adds the visual chat typing message
function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
}

// Removes the visual chat typing message
function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
        $(this).remove();
    });
}

// Adds a message element to the messages and scrolls to the bottom
// el - The element to add as a message
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
//   all other messages (default = false)
function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
        options = {};
    }
    if (typeof options.fade === 'undefined') {
        options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
        options.prepend = false;
    }

    // Apply options
    if (options.fade) {
        $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
        $messages.prepend($el);
    } else {
        $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
}



$(document).ready(function()
{
    $('#myModal').on('shown.bs.modal', function () {
        $('#modalUserName').focus();
    })

    // show username modal
    $('#myModal').modal({
        backdrop: 'static',
        keyboard: false,
        show: true
    });

    $('#userName').focus();
    $('#showActiveUser').addClass('hidden');
    $('#control').addClass('hidden');
    $("#countdown").addClass('hidden');

    $('#modalUserName').keyup( function()
    {
        socket.emit('check user', $('#modalUserName').val(),function(res)
        {
            if(res == null)
            {
                $('#modalForm').removeClass('has-warning').addClass('has-success');
                $('#glyphUserName').removeClass('glyphicon-remove').addClass('glyphicon-ok');
                $('#helpUserName').text('');
            }
            else
            {
                $('#modalForm').removeClass('has-success').addClass('has-warning');
                $('#glyphUserName').removeClass('glyphicon-warning-sign').addClass('glyphicon-remove');
                $('#helpUserName').text(res);
            }
        });
    });

});

$(function(){
    $('#userForm').on('submit', function(e){
        e.preventDefault();
        JoinAndCloseModal();
    });
});

$(document).on("click", "#bJoin", function(event)
{
    JoinAndCloseModal();
});


$(document).on("click", "#bJoinAndControl", function(event)
{

    JoinAndCloseModal();

    socket.emit('add control user', $('#modalUserName').val(),
        function(theUserObject)
        {
            ProcessPostResult(theUserObject);
        });
});

$(document).on("click", "#bJoinControl", function(event)
{
    socket.emit('add control user', '',
        function(theUserObject)
        {
            ProcessPostResult(theUserObject);
        });
});



$(function(){
    $('#chatForm').on('submit', function(e){
        e.preventDefault();

        socket.emit('new message', $('#chatMessage').val());

    });
});

$(document).keydown(function(e)
{
    if(myUserObject == undefined) return;

    var theTime = (new Date).getTime();

    if (theTime - myKeyPressStartTime > 1000 || myLastKeyPress != e.keyCode)
    {

        switch(e.keyCode)
        {
            case 65:    // a
            case 95:    // A
            case 37:    // ?
            {
                socket.emit('move', 'left', function(res){alert(res);});
                break;
            }
            case 68:    // d
            case 100:   // D
            case 39:    // ?
            {
                socket.emit('move', 'right',function(res){});
                break;
            }
            case 87:    // w
            case 119:   // W
            case 38:    // ?
            {
                socket.emit('move', 'forward',function(res){});
                break;
            }
            case 83:    // s
            case 115:   // S
            case 40:    // ?
            {
                socket.emit('move', 'backward',function(res){});
                break;
            }
        }
        myKeyPressStartTime = theTime;
        myLastKeyPress = e.keyCode;
    }
});

$(document).keyup(function(e)
{
    if(myUserObject == undefined) return;

    socket.emit('move', 'stop', function(res){});
});

function JoinAndCloseModal()
{
    socket.emit('add user', $('#modalUserName').val(),
        function(res)
        {
            if(res)
            {
                $('#myModal').modal('hide');
            }
        });
}

// ProcessQueueData
function ProcessQueueData(data)
{
    console.log('ProcessQueueData');

    if(data.length > 0)
    {
        $('#noActiveUser').addClass('hidden');
    }
    else
    {
        $('#noActiveUser').removeClass('hidden');
        $('#showActiveUser').addClass('hidden');
        $("#countdown").addClass('hidden');
    }

    $('#queueCount').text(data.length);

    // Load Queue table
    $('#queueTable').empty();

    for(var i=0;i<data.length;i++)
    {
        var item = data[i];

        var $tr = $('<tr>');
        $tr.append($('<td>').text(i+'.'));

        var $td = $('<td>').text(item.UserName);
        console.log(item.UserName);

        // Mark local user in queue
        if (myUserObject != undefined && myUserObject.SocketId == item.SocketId)
        {
            $td.addClass('user-row');
        }

        // Mark first user as online
        if (i==0)
        {
            $tr.append($td, $('<td>').text('ist online'));
            $tr.addClass('active-user-row');
        }
        else
        {
            $tr.append($td);
        }

        $('#queueTable').append($tr);
    }
}

function ProcessPostResult(data)
{
    console.log('ProcessPostResult');

    $('#bSubmit').prop('disabled', true);
    $('#userName').prop('disabled', true);
    $('#userName').val(data.UserName);

    myUserObject = data;
}

// Control of robot starts
function ControlStart(data)
{
    console.log('Control Start');


    if(myUserObject != null && myUserObject.SocketId == data.SocketId)
    {
        $('#noActiveUser').addClass('hidden');
        $('#showActiveUser').addClass('hidden');
        $("#control").removeClass('hidden');
        $("#control").focus();
    }
    else
    {
        $('#activeUserName').text(data.UserName);
        $('#showActiveUser').removeClass('hidden');
    }

    var theExpirationDate = new Date();
    theExpirationDate = theExpirationDate.setSeconds(theExpirationDate.getSeconds() + data.ControlDuration);

    // Start timer until control stopped
    $("#countdownUntilStop")
        .countdown(theExpirationDate)
        .on('update.countdown', function(event)
        {
            $(this).text(event.strftime('%S'));
        });

    $("#countdown").removeClass('hidden');

}

function ControlStop()
{
    console.log('Control Stop');

    $("#control").addClass('hidden');
    $('#bSubmit').prop('disabled', false);
    $('#userName').prop('disabled', false);
    $('#bSubmit').focus();

    Cookies.remove('data');
    myUserObject = null;

    // Readd user to Queue
    if($("#cbRoundRobin").is(':checked'))
    {
        setTimeout(function()
        {
            $('#myForm').submit();
        }
        , 1000);
    }
}
