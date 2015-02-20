# NetworkThrottler
##Network Throttler

NetworkThrottler NodeJS application implements network traffic shaper/throttler functionality that allows to test applications behavior in various network conditions. 

NetworkThrottler provides web UI foronted to manage netowrk conditions (also contains list of pre-configured network conditions profiles).

NetworkThrottler uses [tc](http://www.lartc.org/manpages/tc.txt)/[netem](http://www.linuxfoundation.org/collaborate/workgroups/networking/netem)on Linux and [ipfw](http://www.manpages.info/macosx/ipfw.8.html) on MacOS

##Contents

	./conf - folder contains confiugration file 
	./scripts - folder contains bash scripts to configure app as service (networkTHrottler) and config for logrotate (forever)    
	./throttler - core implementation for network shaper/throttler
	./web - frontend core implementation
	./app.js - main app



