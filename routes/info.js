var exec = require('child_process').exec,
    repeat = require('repeat'),
    fs = require('fs');


module.exports = function Info(io)
{
    var self = this;
    var io = io;

    var myInfo = new function InfoData()
    {
        this.Voltage = 0;
        this.VoltageLimit = 12.5;
    }

    this.getInfo = function()
    {
        return myInfo;
    }

    // Get battery voltage
    this.getVoltage = function()
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
                    myInfo.Voltage = theVoltage;
                }
            }
        );
    }

    // Voltage to text file
    this._VoltageToFileTask = function()
    {
        var theDateString = new Date().toISOString().replace('T', ' ').substr(0, 19);

        fs.appendFile('voltage.txt', theDateString + ',' + myInfo.Voltage + '\r\n', function (err) {

        });

    }

    // Repeating info tasks
    this._InfoTask = function()
    {
        self.getVoltage();

        io.emit('info', myInfo);
    }

    repeat(this._InfoTask).every(5000, 'ms').start.now();
    repeat(this._VoltageToFileTask).every(60, 's').start.now();
}


