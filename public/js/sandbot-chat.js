/**
 *      constants
 */

var TYPING_TIMER_LENGTH = 400; // ms

var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

var FADE_TIME = 150; // ms

/**
 *      variales
 */

var typing = false;
var lastTypingTime;

/**
 *      object references
 */
var $messages = $('.messages'); // Messages area
var $inputMessage = $('#chatMessage'); // Input message input box

/**
 *      socket.io functions defintions
 */

// Whenever the server emits 'login', log the login message
socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Hallo " + data.username + ", Willkommen im RoboChat";
    log(message, {
        prepend: true
    });
    addParticipantsMessage(data);

    if(data.username == "admin")
    {
        // Admin darf immer steuern
        // Dies wird auch vom Server kontrolliert
        $('#bJoinControl').prop('disabled', false);
    }

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


$('#chatMessage').on('input', function()
{
    updateTyping();
});

$('#chatForm').on('submit', function(e)
{
    e.preventDefault();
    sendMessage();
});

// Sends a chat message
function sendMessage ()
{
    var message = $inputMessage.val();

    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message) {
        $inputMessage.val('');
        addChatMessage({
            username: userName,
            message: message
        });
        // tell server to execute 'new message' and send along one parameter
        socket.emit('new message', message);
    }
}

function addParticipantsMessage (data)
{
    $('#chatUserCount').text(data.numUsers);
}

// Updates the typing event
function updateTyping ()
{

    if (!typing) {
        typing = true;
        socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();

    setTimeout(function ()
    {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing)
        {
            socket.emit('stop typing');
            typing = false;
        }
    }, TYPING_TIMER_LENGTH);
}

// Log a message
function log (message, options)
{
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
}

// Adds the visual chat message to the message list
function addChatMessage (data, options)
{
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
function getUsernameColor (username)
{
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
function getTypingMessages (data)
{
    return $('.typing.message').filter(function (i) {
        return $(this).data('username') === data.username;
    });
}

// Adds the visual chat typing message
function addChatTyping (data)
{
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
}

// Removes the visual chat typing message
function removeChatTyping (data)
{
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

    $("#chatAreaScroll").scrollTop($('#chatAreaScroll').get(0).scrollHeight);
}