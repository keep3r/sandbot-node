var myControlTime = 15; //[s]
var myUserObject = Cookies.getJSON('data');
var myQueueUpdateInterval = 2000;
var myUpdateQueueIntervalTimer;
var myKeyPressStartTime;
var myLastKeyPress;

$(document).ready(function()
{
    if(myUserObject != undefined)
    {
        var theEndDate = new Date(myUserObject.StartDate);
        theEndDate.setSeconds(theEndDate.getSeconds() + myControlTime);

        if(new Date() < theEndDate)
        {
            // User already in Queue at page load and not expired. Restart Counters
            ProcessPostResult(myUserObject);
        }
        else{
            console.log('cookie is expired')
        }
    }

    $('#userName').focus();


    $('#showActiveUser').hide();
    $('#preControl').hide();
    $('#control').hide();

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

        var theActiveUser = data[0];

        if(myUserObject == undefined || myUserObject.rowid != theActiveUser.rowid)
        {
            $('#showActiveUser').show();
            console.log('showactiveuser');
            $('#activeUserName').text(theActiveUser.UserName);

            var theEndDate = new Date(theActiveUser.StartDate);
            theEndDate.setSeconds(theEndDate.getSeconds() + myControlTime);

            $("#activeUserCountdown")
                .countdown(theEndDate)
                .on('update.countdown', function(event)
                {
                    $(this).text(event.strftime('%H:%M:%S'));
                })
                .on('finish.countdown', function()
                {
                    GetQueue();
                });
        }
        else
        {
            $('#showActiveUser').hide();
        }
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
        var theStartDate = new Date(item.StartDate);

        var $tr = $('<tr>');

        if(theStartDate <= new Date())
        {
            $tr.addClass('active-user-row');
        }

        var $td = $('<td>').text(item.UserName);

        if(myUserObject != undefined && myUserObject.rowid == item.rowid)
        {
            $td.addClass('user-row');
        }

        $tr.append($td, $('<td>').text(moment(item.StartDate).format('DD.MM.YYYY HH:mm:ss')));

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

    var theExpirationDate = new Date(data.StartDate);
    theExpirationDate.setSeconds(theExpirationDate.getSeconds()+myControlTime);

    myUserObject = data;
    Cookies.set('data', data,{ expires: theExpirationDate });

    $("#preControl").show();

    // Start timer until control allowed
    $("#countdownUntilStart")
        .countdown(new Date(data.StartDate))
        .on('update.countdown', function(event)
        {
            $(this).text(event.strftime('%H:%M:%S'));
        })
        .on('finish.countdown', ControlStart);

    GetQueue();
}

// Control of robot starts
function ControlStart(event)
{
    $('#showActiveUser').hide();
    $("#preControl").hide();
    $("#control").show();

    var theEndDate = new Date(myUserObject.StartDate);
    theEndDate.setSeconds(theEndDate.getSeconds() + myControlTime + 1);

    // Start timer until control allowed
    $("#countdownUntilStop")
        .countdown(theEndDate)
        .on('update.countdown', function(event)
        {
            $(this).text(event.strftime('%H:%M:%S'));
        })
        .on('finish.countdown', ControlStop);
}

function ControlStop(event)
{
    $("#control").hide();
    $('#bSubmit').prop('disabled', false);

    Cookies.remove('data');
    myUserObject = null;
    GetQueue();
}
