var exec = require('child_process').exec;

exports.moveRobot = function(theAction, fn)
{
    var theReturnValue = false;
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
        exec('python /var/www/client.py ' + thePythonArgument,{cwd: '/var/www'},
            function (error, stdout, stderr)
            {
                if(error)
                {
                    console.log('error' + error);
                    console.log('stderr' + stderr);
                }
                else
                {
                    console.log('stdout' + stdout);
                    theReturnValue = true;
                }

                fn(theReturnValue);
            }
        );
    }
};