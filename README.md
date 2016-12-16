README.md

CIS 550
Fall 2016
Team 12

The following modules are required for the NodeJS file included to work; the modules have been included with our submission. However, if you would like to install everything from scratch, you can simply run "npm install" for each module:

http
url
fs
mysql
mongodb
assert
q
@google/maps

You will also need to attain a Google Maps API key for the project: one can be attained by following the instructions included in the README.md of the @google/maps NodeJS module on Github, found at https://github.com/googlemaps/google-maps-services-js

Once you have your API key, place it as the value to the "key" key passed to the createClient method in line 8 of server.js; this will authenticate the Google Maps API with your account's key.

Warning: Sending too many requests to Google Maps through their API at one time may cause your key to be temporarily or permanently deactivated.  Should you do this, you could experience either errors or forced timeouts, depending on whether Google responsds to your requests with errors or simply ignores them entirely.

You will also need to configure your connections for MongoDB and MySQL.
The connection for MongoDB can be configured by replacing the arguments supplied in lines 10-11 with those appropriate for your instance.  Note that the URL must include the database name; the other argument is only for the collection name.
The connection for MySQL can be configured by replacing the arguments supplied in lines 13-16 with those appropriate for your instance.