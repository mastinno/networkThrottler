# NetworkThrottler
##Network Throttler

NetworkThrottler NodeJS application implements network traffic shaper/throttler functionality that allows to test applications behavior in various network conditions. 

NetworkThrottler provides web UI foronted to manage netowrk conditions (also contains list of pre-configured network conditions profiles).

NetworkThrottler uses [tc](http://www.lartc.org/manpages/tc.txt)/[netem](http://www.linuxfoundation.org/collaborate/workgroups/networking/netem) on Linux and [ipfw](http://www.manpages.info/macosx/ipfw.8.html) on MacOS

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
    - via ssh (if you know its IP).
    - via [serial cable](http://workshop.raspberrypiaustralia.com/usb/ttl/connecting/2014/08/31/01-connecting-to-raspberry-pi-via-usb/). You may need to check [this](http://www.adafruit.com/products/954?&main_page=product_info&products_id=954) to find out correct wire colors in serial cable. Its possible that you need to use this command: screen /dev/cu.usbserial 115200)  
* Configured WiFi access point. Follow guide [here](http://raspberrypihq.com/how-to-turn-a-raspberry-pi-into-a-wifi-router/) or [here](http://elinux.org/RPI-Wireless-Hotspot). NOTE: new version of hostapd can be found [here](https://github.com/jenssegers/RTL8188-hostapd/archive/v2.0.tar.gz). You may experience the issue with update-rc.d to solve it follow this [suggestion](https://groups.google.com/forum/#!topic/logstash-users/orpWBtElt0c). Also, to solve issue with WiFi authentication (device can't be authenticated with RPI WiFi access point and following log message _...IEEE 802.11: deauthenticated due to local deauth request_ will be found in /var/log/messages) you need to install [haveged](http://itsacleanmachine.blogspot.de/2013/02/wifi-access-point-with-raspberry-pi.htmli).

##Pre-installed software requirements

* The latest stable version of NodeJS. Follow guide [here](http://weworkweplay.com/play/raspberry-pi-nodejs/) or [here](https://blog.adafruit.com/2015/02/13/download-compiled-version-of-node-js-0-12-0-stable-for-raspberry-pi-here-piday-raspberrypi-raspberry_pi/).
* Installed NodeJs [forever](https://www.npmjs.com/package/forever) and [nodemon](https://www.npmjs.com/package/nodemon) modules in case you want to have auto-update and running application continuously. To install do:

		$ sudo npm install forever -g
		$ sudo npm install nodemon -g

##Running

Install Node.js packages required by application - go inside the sources root directory and run:

	$ node install 

To start Network Throtler just go inside the sources root directory and run:
	
	$ node app.js

To configure Network Throttler as service/daemon use `./scripts/networkThrottler` example script. For Debian (or Linux that supports init.d) put it inside init.d directory and run there:

	$ sudo update-rc.d networkThrottler defaults 

To start throttler service application run:
	
	$ /etc/init.d/networkThrottler start

To stop throttler service application run:
	
	$ /etc/init.d/networkThrottler stop

##Logging

Network Throttler will log everything to `./logs/node.log` file.

To rotate log files [logrotate](https://packages.debian.org/sid/logrotate) were used and configured with `./scripts/forever` example config file (need to be placed in `/etc/logrotate.d/`). Install logrotate in case your OS doesn't have it.


##LICENSE

Copyright 2015 Twilio.

Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in
compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is
distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing permissions and limitations under the
License.
