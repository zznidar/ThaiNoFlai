x = 12.3845;
y = 100.5300;

const NM2m = (NM) => NM * 1852;

// https://stackoverflow.com/a/23196488
function insert(str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
}

const BARVE = {
    "P": "#ef5350",
    "R": "#ffab00",
    "D": "#a1887f",
    "droncek": "#bdbdbd",
    "loc": "#78909c"
}
const BARVE_border = {
    "P": "#b61827",
    "R": "#c67c00",
    "D": "#725b53",
    "droncek": "#8d8d8d",
    "loc": "#4b636e"
}

/* IKONE */
var myIconlocation = L.icon({
    iconUrl: 'lokacija.png',
	iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [-3, -76]
});

/* ZEMLJEVID */
var mymap = L.map('mapid', {
    attributionControl: false
}).setView([x, y], 4);
L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png ', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, data from <a href="https://www.caat.or.th/wp-content/uploads/2020/03/%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A8-%E0%B8%81%E0%B8%9E%E0%B8%97.-%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87-%E0%B8%81%E0%B8%B3%E0%B8%AB%E0%B8%99%E0%B8%94%E0%B8%9E%E0%B8%B7%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%AB%E0%B8%A7%E0%B8%87%E0%B8%AB%E0%B9%89%E0%B8%B2%E0%B8%A1%E0%B9%80%E0%B8%94%E0%B9%87%E0%B8%94%E0%B8%82%E0%B8%B2%E0%B8%94%E0%B8%AF-%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B8%88%E0%B8%B2.pdf">CAAT</a>, hand labour done by Marko, typo fixes done by Zan',
    maxZoom: 18,
}).addTo(mymap);
L.control.attribution({
    position: 'topright'
}).addTo(mymap);

// https://wiki.openstreetmap.org/wiki/Tile_servers



function parsajKoordinati(koordinati) {
    let latlng = koordinati.trim();
    let preS = latlng.includes("N") ? 1 : -1;
    let preD = latlng.includes("E") ? 1 : -1;
    //latlng = latlng.replace("N", "ž").replace("S", "ž").replace("E", "").replace("W", "").replaceAll(".", "");
    latlng = latlng.replace("N", "ž").replace("S", "ž").replace("E", "").replace("W", "");
    latlng = latlng.split("ž");
    đ = latlng[0];
    //console.log(latlng);
    //lat = preS * parseFloat(insert(latlng[0], 2, "."));
    //lng = preD * parseFloat(insert(latlng[1], 3, "."));

    lat = preS * parseFloat(latlng[0])/1e4;
    lng = preD * parseFloat(latlng[1])/1e4;

    if(Math.round(lat) < 4 || Math.round(lat) > 24) lat = preS * parseFloat(insert(latlng[0], 2, "."));
    if(Math.round(lng) < 85 || Math.round(lng) > 110) lng = preD * parseFloat(insert(latlng[1], 3, "."));

    if(Math.round(lng) > 900) lng = lng/10;

    //console.log(lat, lng);
    return([lat, lng]);
}

function narisi(data) {
    for(let d of data) {   
        if(d.RADIJ) {
            // Krog.
            let latlng = parsajKoordinati(d.KOORDINATE);
            let r = NM2m(d.RADIJ);
            //console.log(lat, lng);
            shape = L.circle(latlng, r, {"color": BARVE_border[d.TIP], "fillColor": BARVE[d.TIP]}).addTo(mymap);
        } else {
            // Poligon.
            let latlngs = d.KOORDINATE.split(",");
            let policoord = [];
            for(let ll of latlngs) {
                let latlng = parsajKoordinati(ll);
                //console.log(latlng);
                policoord.push(latlng);
            }

            shape = L.polygon(policoord, {"color": BARVE_border[d.TIP], "fillColor": BARVE[d.TIP]}).addTo(mymap);
            //console.log(d.IME, policoord);
        }
        shape.bindPopup(`<b>${d.IME}</b><br>${d.INFORMACIJE}`);
    }
}

Papa.parse("ThailandNoFly_4.csv", {
	download: true,
    delimiter: ";",
    header: true,
	complete: function(results) {
		console.log(results);
        narisi(results.data);
	}
});


/* LOKACIJA */
var radius, myLocation, myAccuracy, myDrone, droneRadius = 2000;
mymap.locate({
    setView: false,
    maxZoom: 16,
    watch: true
});
function onLocationFound(e) {
    var radius = e.accuracy / 2;
    if (!myLocation) {
        myLocation = L.marker(e.latlng, {
            icon: myIconlocation
        }).addTo(mymap);
        myAccuracy = L.circle(e.latlng, radius, {
            color: BARVE_border["loc"],
            fillColor: BARVE["loc"]
        }).addTo(mymap);
        myDrone = L.circle(e.latlng, droneRadius, {
            color: BARVE_border["droncek"],
            fillColor: BARVE["droncek"]
        }).addTo(mymap);
        mymap.flyTo(e.latlng, 10);
    } else {
        animiraj(myLocation, e.latlng.lat, e.latlng.lng);
        animiraj(myAccuracy, e.latlng.lat, e.latlng.lng);
        animiraj(myDrone, e.latlng.lat, e.latlng.lng);
        myAccuracy.setRadius(radius);
    }
    xy = e.latlng;
}
mymap.on('locationfound', onLocationFound);
function onLocationError(e) {
    //alert(e.message);
}
mymap.on('locationerror', onLocationError);


document.getElementById("rDrone").addEventListener("change", (e) => {
    console.log(e.target.value)
    myDrone.setRadius(droneRadius = e.target.value);
})




/* ANIMACIJE */
animiraj = function(enMarker, newx, newy) {
    var p = 0; // potek interpolacije

    var x = enMarker.getLatLng().lat;
    var y = enMarker.getLatLng().lng;

    var pr = setInterval(function() {
        if (p < 1) {
            enMarker.setLatLng(new L.LatLng(cosp(x, newx, p), cosp(y, newy, p)));
            p += 0.01;
        } else {
            x = newx;
            y = newy;
            clearInterval(pr);
        }
    }, 0);
}

rotirajPopup = function() {
    if (document.getElementsByClassName("leaflet-popup  leaflet-zoom-animated")[0].style.top == "50px") {
        document.getElementsByClassName("leaflet-popup-tip-container")[0].style.top = "";
        document.getElementsByClassName("leaflet-popup-tip-container")[0].style.transform = "";
        document.getElementsByClassName("leaflet-popup  leaflet-zoom-animated")[0].style.top = "";
    } else {
        document.getElementsByClassName("leaflet-popup-tip-container")[0].style.top = "-20px";
        document.getElementsByClassName("leaflet-popup-tip-container")[0].style.transform = "rotate(180deg)";
        document.getElementsByClassName("leaflet-popup  leaflet-zoom-animated")[0].style.top = "50px";
    }
}

/* CASOVNIK */
function starost(tstamp, vid) {
	//console.log(tstamp, vid);
	let d = new Date();
	let output = "";
	let razmak = (d - new Date(tstamp));
	//console.log(razmak);
	
	if(razmak >= 1000*3600*24) {
		output += (Math.floor(razmak/1000/3600/24) + "d ");
		razmak %= (1000*3600*24);
	}

	if(razmak >= 1000*3600) {
		output += (Math.floor(razmak/1000/3600) + "h ");
		razmak %= (1000*3600);
	}

	if(razmak >= 1000*60) {
		output += (Math.floor(razmak/1000/60) + "min ");
		razmak %= (1000*60);
	}

	output += (Math.floor(razmak/1000) + "s");
	razmak %= (1000);

	document.getElementById("stamp_" + vid).innerText = output;
	return output;
}
