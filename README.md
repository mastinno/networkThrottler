# NetworkThrottler
##Network Throttler

NetworkThrottler NodeJS application implements network traffic shaper/throttler functionality that allows to test applications behavior in various network conditions. 

NetworkThrottler provides web UI foronted to manage netowrk conditions (also contains list of pre-configured network conditions profiles).

NetworkThrottler uses [tc](http://www.lartc.org/manpages/tc.txt)/[netem](http://www.linuxfoundation.org/collaborate/workgroups/networking/netem)on Linux and [ipfw](http://www.manpages.info/macosx/ipfw.8.html) on MacOS

##Contents
Sources contents:
* ./conf - folder contains confiugration file 
* ./scripts - folder contains bash scripts to configure app as service (networkTHrottler) and config for logrotate (forever)    
* ./throttler - core implementation for network shaper/throttler
* ./web - frontend core implementation
* ./app.js - main app

##Raspberri Pi

To run throttler on Raspberry PI you need to have following:
* Raspberry Pi board with installed OS. Application funcitonality were tested on [Rasbian](http://www.raspbian.org/) but should work out of the box on the most of Linux distributions.
* WiFi adapter attached to board. As of now application supports traffic throttling only on WiFi adapter that will be changed soon to allow throttling on any network interface. 
* Connect to Raspberry Pi: 
** via ssh (if you know its IP).
** via [serial cable](http://workshop.raspberrypiaustralia.com/usb/ttl/connecting/2014/08/31/01-connecting-to-raspberry-pi-via-usb/). You may need to check [this](http://www.adafruit.com/products/954?&main_page=product_info&products_id=954) to find out correct wire colors in serial cable. Its possible that you need to use this command: screen /dev/cu.usbserial 115200)  
* Configured WiFi access point. Follow guide [here](http://raspberrypihq.com/how-to-turn-a-raspberry-pi-into-a-wifi-router/)

##Installed software requirements

* The latest stable version of NodeJS. Follow guide [here](http://weworkweplay.com/play/raspberry-pi-nodejs/) or [here](https://blog.adafruit.com/2015/02/13/download-compiled-version-of-node-js-0-12-0-stable-for-raspberry-pi-here-piday-raspberrypi-raspberry_pi/)
* Installed NodeJs [forever](https://www.npmjs.com/package/forever) and [nodemon](https://www.npmjs.com/package/nodemon) modules in case you want to have auto-update and running application continuously.
	$ [sudo] npm install forever -g
	$ [sudo] npm install nodemon -g

##Running

To start Network Throtler just go inside the sources root directory and run:
	$ node app.js

To configure Network Throttler as service/daemon use ./scripts/networkThrottler example script (for Debian like systems put it inside init.d directory and run there `$ sudo update-rc.d networkThrottler defaults`). 
To start throttler service application run:
	$ /etc/init.d/networkThrottler start
To stop throttler service application run:
	$ /etc/init.d/networkThrottler stop

##Logging

Network Throttler will log everything to ./logs/node.log file.

For Debian the [logrotate](https://packages.debian.org/sid/logrotate) were used and configured via ./scripts/forever config file (need to place it to /etc/logrotate.d/ directory and thats it).



