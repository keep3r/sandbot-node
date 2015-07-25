
var sqlite3 = require('sqlite3').verbose(),
    repeat = require('repeat'),
    spark = require('sparknode'),
    request = require('request');

//var db = new sqlite3.Database('./db/queue.db');
var db = new sqlite3.Database(':memory:');


/* sparknode API, not working
var core = new spark.Core({
    accessToken: 'f6334659f4068fabeee17165caa85892e6fc5959',
    id: '54ff6d066672524853261267'
});
*/

// Database init
db.serialize(function() {

    db.run('CREATE TABLE IF NOT EXISTS Queue (UserId INT, UserName TEXT, StartDate INTEGER)');
    //db.run('INSERT INTO Queue (UserId, UserName, StartDate) VALUES (23,"Nico","2015-07-19 15:23:23")');

    // db.run("INSERT INTO Queue (UserId, UserName, StartDate) VALUES (?,?,?)", [23, 'Nico', new Date()]);

    db.each('SELECT rowid AS id, UserName,StartDate FROM Queue', function(err, row) {
        console.log(row.id + ': ' + row.UserName + ': ' + row.StartDate);
    });
});

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

function QueueTask()
{
    var theDate = new Date();
    theDate.setSeconds(theDate.getSeconds() - global.ControlTime);

    // Delete expired entries
    db.run("DELETE FROM Queue WHERE StartDate < ?", [GetTimeStamp(theDate)], function(err)
    {
        // Fetch all remaining entries
        db.all("SELECT rowid, * FROM Queue ORDER BY StartDate ASC", function(err, rows)
        {
            if(rows.length > 0)
            {
                // New controlling user, change text on sparknode
                if(global.CurrentUserId != rows[0].UserId)
                {
                    SetText(rows[0].UserName.substring(0,20) + ' ist online');
                }

                global.CurrentUserId = rows[0].UserId;
            }
            else
            {
                if(global.CurrentUserId!=0)
                {
                    SetText('');
                    global.CurrentUserId=0;
                }
            }
        });
    });
}

repeat(QueueTask).every(1000, 'ms').start.now();

// GET queue with all users
exports.getAll = function(req, res)
{
    // Fetch all entries strftime('%s',StartDate) -
    db.all("SELECT rowid, UserName, StartDate, StartDate - strftime('%s',CURRENT_TIMESTAMP)  AS Seconds FROM Queue ORDER BY StartDate ASC", function(err, rows)
    {
        console.log(err);
        res.send(JSON.stringify(rows));
    });

};

// random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Add user to queue
exports.addQueue = function(req, res)
{
    var data = req.body;

    db.get("SELECT rowid, StartDate FROM Queue ORDER BY StartDate DESC", [],
        function (err, row)
        {
            var theDate = new Date();

            if (!err && row != undefined)
            {
                theDate = new Date(row.StartDate * 1000);
                theDate.setSeconds(theDate.getSeconds() + global.ControlTime);
            }

            var theUserId = getRandomInt(429491, 4294967295);

            db.run("INSERT INTO Queue (UserId, UserName, StartDate) VALUES (?,?,?)",
                [theUserId, data.UserName, GetTimeStamp(theDate)],
                function (err) {
                    if (err) {
                        res.send({'error': 'An error has occurred'});
                    } else {
                        console.log('Success: ' + this.lastID + ':' + theUserId);
                        console.log('Date: ' + theDate);
                        //res.send('{"userId":'+theUserId+'}');
                        var theSeconds = GetTimeStamp(theDate) - GetTimeStamp(new Date());

                        res.send(JSON.stringify({rowid: this.lastID, UserId: theUserId, Seconds: theSeconds}));
                    }
                }
            );

        }
    );
}

// ProcessQueueData user in queue
exports.refreshReservation = function(req, res)
{
    res.send(JSON.stringify({success: true}));
};

function GetTimeStamp(theDate)
{
    return Math.round(theDate.getTime() / 1000);
}
