var myCookieData = Cookies.getJSON('data');
var myQueueUpdateInterval = 1000;
var myUpdateQueueIntervalTimer;
var myKeyPressStartTime;
var myLastKeyPress;
var myUserObject;

$(document).ready(function()
{
    $('#userName').focus();
    $('#showActiveUser').hide();
    $('#control').hide();

    if(myCookieData != undefined)
    {
        $.ajax({
            type: "POST",
            url: "/api/queue",
            data: JSON.stringify({UserId: myCookieData.UserId}),
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            dataType: "json",
            success: ProcessPostResult,

            error: function (data)
            {
                console.log(data);
            }
        });
    }

    // Start everything
    GetQueue();
    myUpdateQueueIntervalTimer = setInterval(GetQueue, myQueueUpdateInterval);
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
                $.get('/api/move/left/' + myUserObject.UserId);
                break;
            }
            case 68:    // d
            case 100:   // D
            case 39:    // ?
            {
                $.get('/api/move/right/' + myUserObject.UserId);
                break;
            }
            case 87:    // w
            case 119:   // W
            case 38:    // ?
            {
                $.get('/api/move/forward/' + myUserObject.UserId);
                break;
            }
            case 83:    // s
            case 115:   // S
            case 40:    // ?
            {
                $.get('/api/move/backward/' + myUserObject.UserId);
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

    $.get("/api/move/stop/" + myUserObject.UserId);
});



// Get Queue
function GetQueue()
{
    $.ajax({
        type: "GET",
        url: "/api/queue",
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        dataType: "json",
        cache: false,
        success: function (data)
        {
            ProcessQueueData(data);
        },

        error: function (data)
        {
        }
    });
}

// ProcessQueueData
function ProcessQueueData(data)
{
    // Show the current user controlling the robot including countdown
    if(data.length > 0)
    {
        $('#noActiveUser').hide();
    }
    else
    {
        $('#noActiveUser').show();
        $('#showActiveUser').hide();
    }

    // Load Queue table
    $('#queueTable').empty();
    $.each(data, function(i, item)
    {
        var $tr = $('<tr>');
        var $td = $('<td>').text(item.UserName);

        // Mark myself
        if(myUserObject != undefined && myUserObject.rowid == item.rowid)
        {
            $td.addClass('user-row');
        }

        // User Online?
        if(item.Seconds < 0)
        {
            $tr.append($td, $('<td>').text('ist online'));

            $tr.addClass('active-user-row');

            // Online User is someone else?
            if(myUserObject == undefined || (myUserObject != undefined &&  myUserObject.rowid != item.rowid))
            {
                $('#activeUserName').text(item.UserName);
                $('#showActiveUser').show();
            }
            else
            {
                $('#showActiveUser').hide();
            }
        }
        else
        {
            $tr.append($td, $('<td>').text('in ' + item.Seconds + ' Sekunden'));
        }

        $('#queueTable').append($tr);
    });
}


// POST to Queue
$('#myForm').submit(function (e) {

    e.preventDefault();

    var theUserName = $('#userName').val();

    $.ajax({
        type: "POST",
        url: "/api/queue",
        data: JSON.stringify({UserName: theUserName}),
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        dataType: "json",
        success: ProcessPostResult,

        error: function (data)
        {
            console.log(data);
        }
    });
});

function ProcessPostResult(data)
{
    $('#bSubmit').prop('disabled', true);
    $('#userName').prop('disabled', true);
    $('#userName').val(data.UserName);

    var theStartDate = new Date();
    theStartDate.setSeconds(theStartDate.getSeconds() + data.Seconds);

    var theExpirationDate = new Date();
    theExpirationDate = theExpirationDate.setSeconds(theExpirationDate.getSeconds() + data.SecondsEnd);

    myUserObject =
    {
        'rowid': data.rowid,
        'UserId': data.UserId,
        'StartDate': theStartDate,
        'ExpirationDate': theExpirationDate
    }

    Cookies.set('data', myUserObject,{ expires: theExpirationDate });

    setTimeout(ControlStart(theExpirationDate), data.Seconds*1000);
}

// Control of robot starts
function ControlStart(theExpirationDate)
{
    console.log('Control Start');

    $('#noActiveUser').hide();
    $('#showActiveUser').hide();
    $("#control").show();
    $("#control").focus();

    // Start timer until control allowed
    $("#countdownUntilStop")
        .countdown(theExpirationDate)
        .on('update.countdown', function(event)
        {
            $(this).text(event.strftime('%S'));
        });

        //.on('finish.countdown', ControlStop);

    setTimeout(ControlStop, (new Date(theExpirationDate).getTime()) - (new Date()).getTime());
}

function ControlStop()
{
    console.log('Control Stop');

    $("#control").hide();
    $('#bSubmit').prop('disabled', false);
    $('#userName').prop('disabled', false);
    $('#bSubmit').focus();

    Cookies.remove('data');
    myUserObject = null;

    // Readd user to queue
    if($("#cbRoundRobin").is(':checked'))
    {
        setTimeout(function()
        {
            $('#myForm').submit();
        }
        , 1000);
    }
}
