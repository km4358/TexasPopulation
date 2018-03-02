/* Main JS by Kerry C. McAlister, 2018 */
//Part 1: Create Leaflet base map
function createMap(){

    var mymap = L.map('map').setView([31.296, -98.926],6);

    var tileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/kmcalister/cjdrsecns00yg2rs4awoet3c8/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoia21jYWxpc3RlciIsImEiOiJjaXNkbW9lM20wMDZ1Mm52b3p3cDJ0NjE0In0.KyQ5znmrXLsxaPk6y-fn0A', {
        attribution: 'Data: <a href="https://www.dshs.texas.gov/chs/popdat/downloads.shtm">Texas Department of State Health Services</a>, Site Design © Kerry C. McAlister, 2018; Imagery: <a href="mapbox://styles/kmcalister/cjdrsecns00yg2rs4awoet3c8">Mapbox</a>'
        });

    tileLayer.addTo(mymap);   
    
    getData(mymap);
};

//Create marker and load attributes into popup window
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0];

    //console.log(attribute);

    //Marker options below...
    var geoJsonMarkerOptions = {
        //radius: 8,
        fillColor: "#bf5700",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        
    };

    var attValue = Number(feature.properties[attribute]);

    //console.log(feature.properties, attValue);

    geoJsonMarkerOptions.radius = calcPropRadius(attValue);

    var layer = L.circleMarker(latlng, geoJsonMarkerOptions);

    var popup = new Popup(feature.properties, attribute, layer, geoJsonMarkerOptions.radius);

    popup.bindToLayer();

    layer.on({
        mouseover:function(){
            this.openPopup();
        },

        mouseout: function(){
            this.closePopup();
        }
    });

    

    return layer;

};

//Calculate symbol radius size
function calcPropRadius(attValue) {

    var scaleFactor = 0.0010;

    var area = attValue * scaleFactor;

    var radius = Math.sqrt(area/Math.PI);

    return radius
};

//Create proportional symbols
function createPropSymbols(data, mymap, attributes){

    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(mymap);


};

//Create sequence controls
function createSequenceControls(mymap, attributes){

    var SequenceControl = L.Control.extend({
        geoJsonMarkerOptions: {
            positions: 'topright'
        },



        onAdd: function(mymap) {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            $(container).append('<input class="range-slider" type="range">');

            $(container).append('<button class="skip" id="reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward">Forward</button>');

            $(container).on('mousedown dblclick pointerdown', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container
        }
    });

    mymap.addControl(new SequenceControl());


    //$('#panel').append('<input class="range-slider" type="range">');

    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });

    createLegend(mymap, attributes[1]);
    updateLegend(mymap, attributes[0]);


    
    $('#reverse').html('<img src="img/if_arrow-left.png">');
    $('#forward').html('<img src="img/if_arrow-right.png">');

    $('.skip').click(function(){

        var index = $('.range-slider').val();

        if ($(this).attr('id') == 'forward'){
            index++;

            index = index > 6 ? 0: index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;

            index = index < 0? 6: index;
        };

        $('.range-slider').val(index);

        updatePropSymbols(mymap, attributes[index]);
        updateLegend(mymap, attributes[index]);
        

    });

    

    

    $('.range-slider').on('input', function(){

        var index = $(this).val();

        updatePropSymbols(mymap, attributes[index]);
        updateLegend(mymap, attributes);
        

    });

    

    
};             

//Process geoJson data
function processData(data){
    var attributes = [];

    var properties = data.features[0].properties;

    for (var attribute in properties){

        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };

    //console.log(attributes);

    return attributes;
};

//Update proportional symbology
function updatePropSymbols(mymap, attribute, updateLegend){
    mymap.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){

            var props = layer.feature.properties;

            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            var popup = new Popup(props, attribute, layer, radius);

            

            popup.bindToLayer();
            
            
 
        };


    });

    
};

//Create popup function for points
function Popup(properties, attribute, layer, radius){
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.year = attribute.split("_")[1];
    this.population = this.properties[attribute];
    this.content = "<p><b>MSA:</b> " + this.properties.NAME + "</p><p><b>Population in " + this.year + ": </b>" + this.population + "</p>";

    this.bindToLayer = function(){
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0, -radius)
        });
    };
};

//Activate popups 
function createPopup(properties, attribute, layer, radius){

    var popupContent = "<p><b>MSA:</b> " + properties.NAME + "</p>";

    var year = attribute.split("_")[1];
    popupContent += "<p><b>Population in " + year + ":</b> " + properties[attribute];

    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -radius),
        
    });

    

    

};

//Create temporal legend ON HOLD
function createLegend(mymap, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (mymap) {

            var legendContainer = L.DomUtil.create('div', 'legend-control-container');
            var svg = '<svg id="attribute-legend" width="250px" height="125px">';
            var circles = {
                max: 50,
                mean: 80,
                min: 110
            };

            for (var circle in circles){

                svg += svg += '<circle class="legend-circle" id="' + circle +
                '" fill="#bf5700" fill-opacity="0.8" stroke="#000000" cx="60"/>';

                svg += '<text id="' + circle + '-text" x="120" y="' + circles[circle] + '"></text>';
            };

            svg += "</svg>"

            $(legendContainer).append('<div id="temporal-legend">');
            $(legendContainer).append(svg);

            return legendContainer;
        }
    });

    mymap.addControl(new LegendControl());
    updateLegend(mymap, attributes);


    
};

function updateLegend(mymap, attributes){
    
    var year = attributes.split("_")[1];

    var content = "<p><b>Population in " + year + "</b> ";

    $('#temporal-legend').html(content);

    var circleValues = getCircleValues(mymap, attributes)

    for(var key in circleValues){
        var radius = calcPropRadius(circleValues[key]);

        $('#'+key).attr({
            
            cy: 120 - radius,

            r: radius
        });

        $('#'+key+'-text').text(Math.round(circleValues[key]) + " People");
    };


};

function getCircleValues(mymap, attributes){
    var min = Infinity,
        max = -Infinity;

    mymap.eachLayer(function(layer){
        if(layer.feature){
            var attributeValue = Number(layer.feature.properties[attributes]);

            if (attributeValue < min){
                min = attributeValue;
            };

            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    var mean = (max + min)/2;

    return {
        max: max,
        mean: mean,
        min: min
    };

};

function processPolyData(data){
    var polyAttributes = [];

    var polyProperties = data.features[0].polyProperties;

    for (var polyAttribute in polyProperties){
        if (polyAttribute.indexOf("Perc")> -1){
            polyAttributes.push(polyAttribute);
        };
    };

    return polyAttributes
};

function createPolySymbols(data, mymap, polyAttributes){
    L.geoJson(data, {
        });

    var counties = L.geoJson(data, {
        fillColor: "#bf5700",
        color: "#000",
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.2

    
        
    });

    var overlay = {
        "MSA Boundaries": counties
    };

    L.control.layers(null, overlay,{collapsed:false}).addTo(mymap);

    counties.bringToBack(mymap);
    
    return mymap

};

//Collect data from geoJSON
function getData(mymap){

    

    $.ajax("data/MSA_Poly.geojson", {
        dataType: "json",
        success: function(response){

            var polyAttributes = processPolyData(response);
            createPolySymbols(response, mymap, polyAttributes);
            
        }
    });

    $.ajax("data/MSA.geojson", {
        dataType: "json",
        success: function(response){

            var attributes = processData(response);

            createPropSymbols(response, mymap, attributes);
            createSequenceControls(mymap, attributes);
            
        }        
    });
};

$(document).ready(createMap);