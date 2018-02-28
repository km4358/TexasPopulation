/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var geomap = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/kmcalister/cjdrsecns00yg2rs4awoet3c8/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoia21jYWxpc3RlciIsImEiOiJjaXNkbW9lM20wMDZ1Mm52b3p3cDJ0NjE0In0.KyQ5znmrXLsxaPk6y-fn0A', 
    {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(geomap);

    //call getData function
    getData(geomap);
};

//function to retrieve the data and place it on the map
function getData(geomap){
    //load the data
    $.ajax("data/MSA.geojson", {
        dataType: "json",
        success: function(response){

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(response).addTo(geomap);
        }
    });
};

$(document).ready(createMap);