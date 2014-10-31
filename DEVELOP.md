*******************
To Run Test
*******************
To run the tests you need to install protractor and configure it as described in below link:
http://angular.github.io/protractor/#/tutorial

After installation of protractor,
copy the file "<path to extension dir>/tests/protractor.config.js.txt" to "<path to extension dir>/tests/protractor.config.js"
and do require changes in file like setting baseUrl/username/password etc.

The commands to run the tests are as follows:

  1.Start your Selenium server.

  2.Move to extension path:
    cd </path/to/extension/dir>   (ex: $civiroot/tools/extensions/extensionName)

  3.Run Protractor config file
    $ protractor tests/protractor.config.js
