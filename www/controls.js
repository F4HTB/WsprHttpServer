function bodyload()
{
	GetConf();
	GetGPSInfo();
	showTime();
	GetWsprInfo();
	UpdateInfoTicks();
	window.location="#STATUS";
}

function togle_M()
{
	var items = event.srcElement.parentNode.getElementsByTagName("a");
	for (var i = 0; i < items.length; ++i) {
		items[i].className = "a_deactivate";
	}
	event.srcElement.className = "a_activate";
}


// Accédez à l'élément form …
var Confform = document.getElementById("formsetconf");
var FD = new FormData(Confform);

function GetConf()
{
	var XHR = new XMLHttpRequest();
	
	XHR.addEventListener("load", function(event) {
		datas=(event.target.responseText).substring(1, event.target.responseText.length-1).split('+');
		for (var i = 0; i < datas.length; i++) {
			var data = datas[i].split('=');
			document.forms['formsetconf'][data[0]].value = data[1];
			if(data[0].search("BEACON")>-1){
				var elementExists = document.getElementById(data[0].replace("BEACON","stat"));
				if(elementExists != null){elementExists.innerHTML=data[1];}
			}
		}  
	});
	
	XHR.open("GET", "SGGetConf");
	XHR.send();
}

function sendConf() {
	var XHR = new XMLHttpRequest();
	var datas = "?";
	var x = document.forms['formsetconf'];
	for (i = 0; i < x.length; i++) {
		datas += x.elements[i].name+"="+x.elements[i].value+"+";
	} 
	XHR.addEventListener("load", function(event) {
	  alert(event.target.responseText);
	});
	XHR.open("GET", "SGSetConf"+datas.slice(0, -1));
	XHR.send();
}

document.getElementById("ButtonSendConf").addEventListener("click", function (event) {
	event.preventDefault();
	sendConf();
});
document.getElementById("ButtonSRestartServer").addEventListener("click", function (event) {
	event.preventDefault();
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
	  alert(event.target.responseText);
	});
	XHR.open("GET", "SGrestart");
	XHR.send();
	XHR.timeout = 4000;
	XHR.ontimeout = function (e) {
		alert("Redirect to new port");
		if(window.location.port.toString() != document.forms['formsetconf']["SERVER:port"].value){
			window.location=(window.location.toString().replace(window.location.port,document.forms['formsetconf']["SERVER:port"].value));
		}
	}
	
});

var WSPRmetadata = {};
function GetWsprInfo(){
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
		let datas=(event.target.responseText).replace(/['"]+/g, "").split(',');
		for (var i = 0; i < datas.length; i++) {
			var data = datas[i].split('=');
			WSPRmetadata[data[0]]=data[1];
		}  
		WSPRInfoDisplay();
	});
	XHR.open("GET", "SGWsprStatus");
	XHR.send();
}

function WSPRInfoDisplay(){
	document.getElementById("stat:PPM").innerHTML=WSPRmetadata["PPM"];
	document.getElementById("stat:WsprTX").innerHTML=WSPRmetadata["TRANSMITTING"];
	if(WSPRmetadata["TRANSMITTING"]!="False"){document.getElementById("LWSPROn").className = "wspron_activate";}
	document.getElementById("stat:WsprMode").innerHTML=WSPRmetadata["MODE"];
	document.getElementById("stat:CurFreq").innerHTML=WSPRmetadata["FREQUENCY"]+"hz";
	document.getElementById("wsprprocstdout").innerHTML=WSPRmetadata["LOGS"];
	if(WSPRmetadata["RUN"]=="True" && WSPRmetadata["MODE"]=="wspr"){document.getElementById("WSPROn").checked = true;cancolor="green";}
	else{document.getElementById("WSPROff").checked = true;cancolor="white";}
	
}



var GPSmetadata = {};
function GetGPSInfo(){
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
		let datas=(event.target.responseText).replace(/\s+/g, "");
		datas=datas.substring(5, event.target.responseText.length-3).replace(/['"]+/g, "");
		datas=datas.split(',');
		for (var i = 0; i < datas.length; i++) {
			var data = datas[i].split('=');
			GPSmetadata[data[0]]=data[1];
		}  
		GpsInfoDisplay();
	});
	XHR.open("GET", "SGgps");
	XHR.send();
}

const gps_qual = ['Fix not valid', 'GPS fix ', 'Differential GPS fix, OmniSTAR VBS', 'Real-Time Kinematic, fixed integers', 'Real-Time Kinematic, float integers, OmniSTAR XP/HP or Location RTK'];
function GpsInfoDisplay(){
	let GS = gridForLatLon(GPSmetadata.lat/100, GPSmetadata.lon/100);
	document.getElementById("GPS").innerHTML=
	"<br>Time: "+GPSmetadata.timestamp+"<br>"+
	"GPS Quality indicator: "+gps_qual[GPSmetadata.gps_qual]+"<br>"+
	"Number of Satellites in use: "+GPSmetadata.num_sats+"<br>"+
	"Latitude: "+GPSmetadata.lat/100+"<br>"+
	"Longitude: "+GPSmetadata.lon/100+"<br>"+
	"Altitude: "+GPSmetadata.altitude+"<br>"+
	"Grid Square: "+GS+"<br>";
	
	var statgps = document.getElementById("stat:locator");
	if(statgps.innerHTML!=GS && !(statgps.innerHTML.includes("Maybe"))){
		statgps.innerHTML=statgps.innerHTML + " Maybe need update?";
	}
		
	document.getElementById("stat:GPS").innerHTML=gps_qual[GPSmetadata.gps_qual];
	document.getElementById("stat:infotime").innerHTML=GPSmetadata.timestamp;
	Datadate=GPSmetadata.timestamp.split(":");
	date.setHours(Datadate[0]);
	date.setMinutes(Datadate[1]);
	date.setSeconds(Datadate[2]);
}


function gridForLatLon(latitude, longitude) {
	var UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWX'
	var LOWERCASE = UPPERCASE.toLowerCase();
	var adjLat, adjLon, 
		fieldLat, fieldLon, 
		squareLat, squareLon, 
		subLat, subLon, 
		rLat, rLon;

	// Parameter Validataion
	var lat = parseFloat(latitude);
	if (isNaN(lat)) {
		throw "latitude is NaN";
	}

	if (Math.abs(lat) === 90.0) {
		throw "grid squares invalid at N/S poles";
	}

	if (Math.abs(lat) > 90) {
		throw "invalid latitude: " + lat;
	}

	var lon = parseFloat(longitude);
	if (isNaN(lon)) {
		throw "longitude is NaN";
	}

  	if (Math.abs(lon) > 180) {
		throw "invalid longitude: " + lon;
	}

	// Latitude
	var adjLat = lat + 90;
	fieldLat = UPPERCASE[Math.trunc(adjLat / 10)];
	squareLat = '' + Math.trunc(adjLat % 10);
	rLat = (adjLat - Math.trunc(adjLat)) * 60;
	subLat = LOWERCASE[Math.trunc(rLat / 2.5)];
	  
	// Logitude
  	var adjLon = lon + 180;
  	fieldLon = UPPERCASE[Math.trunc(adjLon / 20)];
  	squareLon = ''+Math.trunc((adjLon / 2) % 10);
  	rLon = (adjLon - 2*Math.trunc(adjLon / 2)) * 60;
	subLon = LOWERCASE[Math.trunc(rLon / 5)];
	  
  	return fieldLon + fieldLat + squareLon + squareLat + subLon + subLat;
}

var date = new Date();
function showTime(){
    
	date.setSeconds(date.getSeconds() + 1);
    var h = date.getHours(); // 0 - 23
    var m = date.getMinutes(); // 0 - 59
    var s = date.getSeconds(); // 0 - 59
    
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;
    
    var time = h + ":" + m + ":" + s ;
    document.getElementById("stat:actualtime").innerText = time;
    setTimeout(showTime, 1000);
    
}


document.getElementById("WSPRStartTestTone").addEventListener("click", function (event) {
	event.preventDefault();
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
	  alert("WSPR Started");
	  GetWsprInfo();
	});
	XHR.open("GET", "SGWsprGoTone?"+document.getElementById("WSPR:TESTTONE").value);
	XHR.send();
});

document.getElementById("WSPRSStopTestTone").addEventListener("click", function (event) {
	event.preventDefault();
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
	  alert("WSPR Stoped");
	  GetWsprInfo();
	});
	XHR.open("GET", "SGWsprEnd");
	XHR.send();
});

document.getElementById("WSPROff").addEventListener("change", function (event) {
	event.preventDefault();
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
	  alert("WSPR Stoped");
	  GetWsprInfo();
	});
	XHR.open("GET", "SGWsprEnd");
	XHR.send();
	if(event.srcElement.checked){document.getElementById("LWSPROn").className = "wspron_deactivate";}
});

document.getElementById("WSPROn").addEventListener("change", function (event) {
	event.preventDefault();
	var XHR = new XMLHttpRequest();
	XHR.addEventListener("load", function(event) {
	  alert("WSPR Started");
	  GetWsprInfo();
	});
	XHR.open("GET", "SGWsprGo");
	XHR.send();
	
	if(event.srcElement.checked){document.getElementById("LWSPROn").className = "wspron_activate";}
});

function showTime(){
    
	date.setSeconds(date.getSeconds() + 1);
    var h = date.getHours(); // 0 - 23
    var m = date.getMinutes(); // 0 - 59
    var s = date.getSeconds(); // 0 - 59
    
	let percent = (m % 2) ? 50 : 0;
	percent += s*50/60;
	
	percent =  percent.toFixed(1) ;
	
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;
    
    var time = h + ":" + m + ":" + s ;
    document.getElementById("stat:actualtime").innerText = time + " " + percent + "%";
    setTimeout(showTime, 1000);
	drawCanPercent(percent);
    
}

function UpdateInfoTicks(){
    var m = date.getMinutes(); // 0 - 59
    var s = date.getSeconds(); // 0 - 59
    
	if((s == 5) || (s == 55)){
		GetWsprInfo();
	}
    setTimeout(UpdateInfoTicks, 1000);
    
}


var canvas = document.getElementById("percentcan");
var ctx = canvas.getContext("2d");
var centerX = canvas.width / 2;
var centerY = canvas.height / 2;
ctx.clearRect(0, 0, canvas.width, canvas.height);
var cancolor="white"
function drawCanPercent(percent) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.arc(centerX, centerY, 25/2,  1.5 * Math.PI, ((1.5+((2*percent)/100)) * Math.PI), false);
	ctx.strokeStyle = cancolor;
	ctx.lineWidth = 25;
	ctx.stroke();
	ctx.closePath();
}