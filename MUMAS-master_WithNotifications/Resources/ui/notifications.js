var nextStop;

var notificationInformation = JSON.parse(Ti.App.Properties.getString("alertInformation"))
var colors = "RGBYOP";
var routeColor= notificationInformation.route
Ti.API.info(colors.indexOf(routeColor[0]));
Ti.API.info(routeColor);
var notification = [6];


notification[colors.indexOf(routeColor[0])] = Ti.App.iOS.scheduleLocalNotification({
		alertBody: routeColor+ " is arriving at: " +  notificationInformation.closeststop + " in " + notificationInformation.stoptime  +" minutes.",
		alertAction:"Show Me!",
		userInfo:{"hello":"world"},
		sound:"pop.caf",
		date:new Date(new Date().getTime())
	});

