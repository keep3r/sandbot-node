var exec = require('child_process').exec;

// GET queue with all users
exports.getInfo = function(req, res)
{

    exec('python /home/pi/spi-test.py',{cwd: '/home/pi/'},
        function (error, stdout, stderr)
        {
            var theVoltage = 0;

            if(error)
            {
                console.log('error' + error);
                console.log('stderr' + stderr);
            }
            else
            {
                console.log('stdout' + stdout);
                theVoltage = stdout.replace(/\n$/, "");
            }

            res.send(JSON.stringify({Voltage: theVoltage}));
        }
    );

};
