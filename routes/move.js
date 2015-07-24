
var exec = require('child_process').exec;
    //PythonShell = require('python-shell');

exports.moveRobot = function(req, res)
{
    var theUserId = req.params.id;
    var theAction = req.params.action;

    console.log('id: ' + theUserId);
    console.log('action: ' + theAction);

    var theReturnValue = false;
    if(theUserId > 0 && theUserId == global.CurrentUserId)
    {
        theReturnValue = true;

        var thePythonArgument = '';

        switch(theAction)
        {
            case 'forward':
            {
                console.log('move forward');
                thePythonArgument = 'f'
                break;
            }
            case 'backward':
            {
                console.log('move backward');
                thePythonArgument = 'b'
                break;
            }
            case 'left':
            {
                console.log('move left');
                thePythonArgument = 'l'
                break;
            }
            case 'right':
            {
                console.log('move right');
                thePythonArgument = 'r'
                break;
            }
            case 'stop':
            {
                console.log('move stop');
                thePythonArgument = 's'
                break;
            }
        }

        if(thePythonArgument != '')
        {
            console.log('exec');
            exec('python /var/www/client.py ' + thePythonArgument,
            //exec('python /var/www/client.py f',
                function (error, stdout, stderr)
                {
                    console.log('error' + error);
                    console.log('stdout' + stdout);
                    console.log('stderr' + stderr);

                    if(error)
                    {

                    }
                    else
                    {
                        theReturnValue = true;

                    }
                }
            );
        }

        // Code zum Bewegen des Motors hier einfügen

/*
        var options = {
            mode: 'text',
            //pythonPath: 'path/to/python',
            //pythonOptions: ['-u'],
            //scriptPath: '/var/www/client.py',
            args: [thePythonArgument]
        };

        PythonShell.run('/var/www/client.py', options, function (err, results) {
            if (!err) theReturnValue = true;
            // results is an array consisting of messages collected during execution
            console.log('results: %j', results);
        });
*/

    }

    res.send(JSON.stringify({success: theReturnValue}));
};