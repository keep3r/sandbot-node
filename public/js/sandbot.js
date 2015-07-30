var myKeyPressStartTime;
var myLastKeyPress;
var myUserObject;
var userName = Cookies.get('userName');

var socket = io();

// Socket Event

/**
 *      socket.io functions definitions
 */

socket.on('connect', function(number)
{
    // user in cookie?
    if(userName)
    {
        JoinAndCloseModal();
    }
});

socket.on('reconnect', function(number)
{
    JoinAndCloseModal();
});

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


$(document).ready(function()
{

    $('#myModal').on('shown.bs.modal', function ()
    {
        var $modalUserName = $('#modalUserName');
        $modalUserName.focus();

        if($modalUserName.val().length > 0)
        {
            checkModalUserName();
        }
    });


    $('#userName').focus();
    $('#showActiveUser').addClass('hidden');
    $('.control').addClass('hidden');
    $("#countdown").addClass('hidden');

    $('#modalUserName').keyup( function()
    {
        checkModalUserName();
    });

    if(!isMobile())
    {
        console.log('hiding mobile controls');
        $('.mobile-only').addClass('hidden');
    }

    if(userName)
    {
        $('#modalUserName').val(userName);

    }
    else
    {
        // show username modal
        $('#myModal').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
    }

});

$(function(){
    $('#userForm').on('submit', function(e)
    {
        e.preventDefault();
        userName = cleanInput($('#modalUserName').val());
        JoinAndCloseModal();
    });
});

$(document).on("click", "#bJoin", function(event)
{
    userName = cleanInput($('#modalUserName').val());
    JoinAndCloseModal();
});

$("#bJoinControl").click(function(event)
{
    socket.emit('add control user',
        function(theUserObject)
            {
            ProcessPostResult(theUserObject);
        });
});

$("#bLogout").click(function(e)
{
    logout();
});


$("#bForward").click(function(e)
{
    var $btn = $(this);
    if(myUserObject == undefined) return;
    console.log('control forward');
    socket.emit('move', 'forward', function(res) {moveButtonEffect($btn, res);});
});
$("#bRight").click(function(e)
{
    var $btn = $(this);
    if(myUserObject == undefined) return;
    console.log('control Right');
    socket.emit('move', 'right', function(res) {moveButtonEffect($btn, res);});
});
$("#bLeft").click(function(e)
{
    var $btn = $(this);
    if(myUserObject == undefined) return;
    console.log('control Left');
    socket.emit('move', 'left', function(res) {moveButtonEffect($btn, res);});
});
$("#bBackward").click(function(e)
{
    var $btn = $(this);
    if(myUserObject == undefined) return;
    console.log('control Backward');
    socket.emit('move', 'backward', function(res) {moveButtonEffect($btn, res);});
});
$("#bStop").click(function(e)
{
    var $btn = $(this);
    if(myUserObject == undefined) return;
    console.log('control Stop');
    socket.emit('move', 'stop', function(res) {moveButtonEffect($btn, res);});
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


function moveButtonEffect(button, res)
{
    // Robot moved
    if(res)
    {
        button.effect( "highlight", {color: '#5cb85c'}, 'fast');
    }
    else
    {
        button.effect( "highlight", {color: '#d9534f'}, 'slow');
    }
}

function checkModalUserName()
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
}

function logout()
{
    userName = null;
    Cookies.remove('userName');
    location.reload();
}

function JoinAndCloseModal()
{
    socket.emit('add user', userName,
        function(res)
        {
            if(res)
            {
                Cookies.set('userName', res);
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

    $('#bJoinControl').prop('disabled', true);
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
        $(".control").removeClass('hidden');
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

    $(".control").addClass('hidden');
    $('#bJoinControl').prop('disabled', false);
    $('#userName').prop('disabled', false);
    $('#bJoinControl').focus();

    myUserObject = null;

    // Readd user to Queue
    if($("#cbRoundRobin").is(':checked'))
    {
        setTimeout(function()
        {
            $('#bJoinControl').click();
        }
        , 1000);
    }
}
