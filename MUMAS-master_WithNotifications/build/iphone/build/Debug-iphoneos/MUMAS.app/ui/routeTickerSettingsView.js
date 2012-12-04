/*
 * 
 * View displaying the route radio buttons on the map settings window
 * These buttons are for the Route Tickers section
 * 
 */

var METRO_DB = "metro";
var FAV_DB = "favs";
var myLat = 0;
var myLon = 0;

var routeTickerSettingsView = function(width) {


	Ti.Geolocation.purpose = "Following user";
	Ti.Geolocation.addEventListener('location', function(e) {
		myLat = e.coords.latitude;
		myLon = e.coords.longitude;
	});

	var self = Ti.UI.createView({
		top: "10dp",
		layout : 'horizontal',
		height : "180dp",
		backgroundColor: "white",
		opacity: 1,
		width : width,
	})

	// ROUTE SWITCHES **********************************
	var RouteSwitch = require('ui/routeSwitch')

	// Red Switch
	var redSwitch = new RouteSwitch('Red'); 
	redSwitch.addEventListener('click', switch_onChange)
	self.add(redSwitch);

	// Blue Switch Switch
	var blueSwitch = new RouteSwitch('Blue'); 
	blueSwitch.addEventListener('click', switch_onChange);
	self.add(blueSwitch);

	// Green Switch
	var greenSwitch = new RouteSwitch('Green'); 
	greenSwitch.addEventListener('click', switch_onChange);
	self.add(greenSwitch);

	// Orange Switch
	var orangeSwitch = new RouteSwitch('Orange');
	orangeSwitch.addEventListener('click', switch_onChange);
	self.add(orangeSwitch);

	// Yellow Switch
	var yellowSwitch = new RouteSwitch('Yellow'); 
	yellowSwitch.addEventListener('click',switch_onChange);
   	self.add(yellowSwitch);

	// Purple Switch
	var purpleSwitch = new RouteSwitch('Purple'); 
	purpleSwitch.addEventListener('click', switch_onChange)
	self.add(purpleSwitch);

	return self;
}

function switch_onChange(e) {
	var nextStopTime;
	this.setEnabled(false);
	var color = this.getBackgroundColor();
	if (color === "gray") {
		this.setBackgroundColor(this.getTitle());
		var closestStop;
		var minDistance = -1;
		var db = Ti.Database.open(METRO_DB);
		var rows = db.execute("SELECT S.stopName, S.latitude, S.longitude FROM STOP S, ROUTE R, ROUTE_PATH RP"
								+" WHERE R.rowid=RP.routeid AND RP.stopid=S.rowid AND R.color LIKE '%"+this.getTitle()+"%';");
		while (rows.isValidRow()) {
			var dist = distance(myLat, myLon, rows.fieldByName("latitude"), rows.fieldByName("longitude"));
			if (dist < minDistance || minDistance == -1) {
				minDistance = dist;
				closestStop = rows.fieldByName("stopName");
			}
			rows.next();
		}
		db.close();
		var routeColor = this.getTitle();
		getTimes(this.getTitle(), closestStop, function(stopTime) {
			alert(routeColor + " Route: " + closestStop + "\n" + new Date(stopTime - new Date()).getMinutes() + " minutes");
	
			//Tests to ensure we don't crash and burn when running this an Android Device
						var ANDROID = "android";
						var IPHONE = "iphone";
						var OS = Ti.Platform.getOsname();
						var colors = "RGBYOP";
			if (OS === IPHONE) {
				//Needed to pass to the background service so it can properly display the information.
				var alertInformation = JSON.stringify({
					"route" : routeColor,
					"closeststop" : closestStop,
					"stoptime" : new Date(stopTime - new Date()).getMinutes()
				})
				Ti.App.Properties.setString("alertInformation", alertInformation);
				
				
				notification = Ti.App.iOS.registerBackgroundService({url : 'ui/notifications.js'});
			}
			//Ensures we do not crash when running an iOS device
			else{
				alarmTimeIntent = Ti.Android.createIntent({
					className : 'org.appcelerator.titanium.TiActivity',
					packageName : 'edu.muohio.cse383.f12.mumas',
					flags : Titanium.Android.FLAG_ACTIVITY_CLEAR_TOP | Titanium.Android.FLAG_ACTIVITY_SINGLE_TOP
				});

				var alarmTimePendingIntent = Ti.Android.createPendingIntent({
					activity : Ti.Android.currentActivity,
					intent : alarmTimeIntent,
					type : Ti.Android.PENDING_INTENT_FOR_ACTIVITY,
					flags : Titanium.Android.FLAG_CANCEL_CURRENT
				});
					
				var alarmTimeNotification = Titanium.Android.createNotification({
					alertBody : "ALERT",
					contentIntent : alarmTimePendingIntent,
					contentTitle : routeColor + " Bus incoming at: " + closestStop + " - " + new Date(stopTime - new Date()).getMinutes() + "Minutes",
					tickerText : routeColor + " Route Ticker",
					defaults : Titanium.Android.NotificationManager.DEFAULT_SOUND,
					when : new Date(),
				});
				Ti.Android.NotificationManager.notify(colors.indexOf(routeColor[0]), alarmTimeNotification);

			}

		});
	} else {
		this.setBackgroundColor("gray");
	}
	this.setEnabled(true);
}

function distance( lat1, lon1, lat2, lon2 ) {
   	var lats = 0;
   	var lons = 0;
   	lats = lat2 - lat1;
   	lats = lats * lats;
   	lons = lon2 - lon1;
   	lons = lons * lons;
   	return Math.sqrt( lats + lons );
}


function getTimes( routeColor, stop, callback ) {
	var asynch = false;
	var stopTimes = [];
	var nextStopTime;
	//var baseurl = 	"http://capstone-bus-f10.csi.muohio.edu:8080/onebusaway-api-webapp/api/where/schedule-for-stop/";
	//var jsonFile = 	"1_" + stop + ".json" ;
	//var params = 	"?key=TEST&app_uid=admin&app_ver=9";
	var baseurl = 	"http://capstone-bus-f10.csi.muohio.edu:8080/onebusaway-api-webapp/api/where/arrivals-and-departures-for-stop/";
	var jsonFile = 	"1_" + stop + ".json" ;
	var params = 	"?key=TEST&app_uid=admin&app_ver=9";
	url = baseurl+jsonFile+params;


	var client = Ti.Network.createHTTPClient({

		// function called when the response data is available
		onload : function(e) {
			var pois  = JSON.parse(client.responseText);
			var times = pois.data.arrivalsAndDepartures;
			for(var i = 0; i < times.length; i++) {
				if(times[i].routeId == ("1_" + routeColor )) {
					stopTimes.push(new Date(times[i].scheduledDepartureTime))
				}
				
			}


			nextStopTime = stopTimes[0];
			for(var i = 1; i < stopTimes.length; i++) {
				if(stopTimes[i] < nextStopTime) {
					nextStopTime = stopTimes[i];
				}
			}
			callback(nextStopTime);

			/*
			var pois = JSON.parse(client.responseText);
			//alert("POIS: " + pois.length); //**ALERT**
			var routes = pois.data.entry.stopRouteSchedules;
			alert("Routes: " + JSON.stringiffy(routes)); //***ALERT***
			for(var i = 0; i < routes.length; i++) {
				var routeName = "1_" + routeColor;
				if(routes[i].routeId == routeName) {
					var stops = routes[i].stopRouteDirectionSchedules;
					//alert("Stops: " + stops.length); //***ALERT***
					for(var j = 0; j < stops.length; j++) {
						for(var k = 0; k < stops[j].scheduleStopTimes.length; k++) {
							if (stops[j].scheduleStopTimes[k].departureTime > time) {
								//alert(convertTime(stops[j].scheduleStopTimes[k].departureTime));
							}
						}
					}
				}
			}
			*/
		},

		// function called when an error occurs, including a timeout
		onerror : function(e) {
			callback(null);
			Ti.API.debug(e.error);
			//alert("ERROR HERE");
		},
		timeout : 5000  // in milliseconds
	});
	// Prepare the connection.
	client.open("GET", url, asynch);
	// Send the request.
	client.send(); 

}

var convertTime = function(ms) {
	var milliSecs = ms;
	var msSecs = (1000);
	var msMins = (msSecs * 60);
	var msHours = (msMins * 60);
	var numHours = Math.floor(milliSecs/msHours);
	var numMins = Math.floor((milliSecs - (numHours * msHours)) / msMins);
	//var numSecs = Math.floor((milliSecs - (numHours * msHours) - (numMins * msMins))/ msSecs);
	return numMins;
}


module.exports = routeTickerSettingsView;