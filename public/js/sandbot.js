var myCookieData = Cookies.getJSON('data');
var myQueueUpdateInterval = 1000;
var myInfoUpdateInterval = 10000;
var myUpdateQueueIntervalTimer;
var myKeyPressStartTime;
var myLastKeyPress;
var myUserObject;

var socket = io();

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

$(document).on("click", "#bJoin", function(event)
{
    JoinAndCloseModal();
});

$(document).on("click", "#bJoinAndControl", function(event)
{

    JoinAndCloseModal();

    socket.emit('newUser', $('#modalUserName').val(),
        function(theUserObject)
        {
            ProcessPostResult(theUserObject);
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


// Add user to queue
$('#myForm').submit(function (e) {

    e.preventDefault();

    var theUserName = $('#userName').val();

    socket.emit('newUser', $('#userName').val(),
        function(theUserObject)
        {
            ProcessPostResult(theUserObject);
        });

});

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
