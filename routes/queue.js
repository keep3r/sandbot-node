
var repeat = require('repeat'),
    request = require('request');

module.exports = function Queue(io)
{
    var self = this;
    var io = io;

    var myQueue = new Array();


    // Queue object with user information
    function QueueEntry(theSocketId, theUserName)
    {
        this.SocketId = theSocketId;
        this.UserName = theUserName;
        this.StartDate = null;
    }

    // Get list of all queued users
    this.getQueue =  function()
    {
        return myQueue;
    }

    // Add new user to Queue
    this.addUserToQueue = function(theUserName, theSocketId, fn)
    {
        var theEntry = new QueueEntry(theSocketId, theUserName);

        myQueue.push(theEntry);

        fn(theEntry);
    }

    //Remove a user after disconnect
    this.removeUserFromQueue = function(theSocketId)
    {
        var theUserInQueue = false;
        for (var i = 0; i < myQueue.length; i++) {
            if (myQueue[i].SocketId == theSocketId)
            {
                myQueue.splice(i, 1);
                theUserInQueue = true;
                break;
            }
        }

        return theUserInQueue;
    }

    // Get current control user including seconds left
    this.getControlUser = function()
    {
        if(myQueue.length == 0) return null;

        if(myQueue[0].StartDate != null)
        {
            var theDiff = Math.round((new Date().getTime() - new Date(myQueue[0].StartDate).getTime())/1000);
            var theControlUser = myQueue[0];
            theControlUser.ControlDuration = global.ControlDuration - theDiff;

            return theControlUser;
        }
        else
        {
            return null;
        }
    }

    // Repeating Queue tasks
    this._QueueTask = function()
    {
        if(myQueue.length == 0) return;

        var theEndDate = new Date();
        theEndDate.setSeconds(theEndDate.getSeconds() - global.ControlDuration);

        // Give top user control of robot
        if(myQueue[0].StartDate == null)
        {
            myQueue[0].StartDate = new Date();

            var theControlUser = myQueue[0];
            theControlUser.ControlDuration = global.ControlDuration;

            global.ControllingSocketId = myQueue[0].SocketId;

            io.emit('ControlStart', theControlUser);

            SetText(myQueue[0].UserName+' steuert');
        }
        // Remove user from queue and stop control
        else if(myQueue[0].StartDate < theEndDate)
        {
            global.ControllingSocketId = null;
            io.to(myQueue[0].SocketId).emit('ControlStop');

            myQueue.splice(0, 1);

            io.emit('queue', self.getQueue());
	    SetText('niemand steuert');	
        }
    }

    repeat(this._QueueTask).every(500, 'ms').start.now();

}

// SetText on SparkNode via HTTPS POST
function SetText(theName)
{
   
    request({
        url: 'https://api.spark.io/v1/devices/54ff6d066672524853261267/SetText',
        method: 'POST',
        form: {
            access_token: 'f6334659f4068fabeee17165caa85892e6fc5959',
            args: '2'+theName
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
}
