/* Main JS by Kerry C. McAlister, 2018 */

// Create Leaflet base map
function createMap(){
    //set map variable and view
    var mymap = L.map('map').setView([31.296, -98.926],6);
    //set tile layer source and attributes
    var tileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/kmcalister/cjdrsecns00yg2rs4awoet3c8/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoia21jYWxpc3RlciIsImEiOiJjaXNkbW9lM20wMDZ1Mm52b3p3cDJ0NjE0In0.KyQ5znmrXLsxaPk6y-fn0A', {
        attribution: 'Data: <a href="https://www.dshs.texas.gov/chs/popdat/downloads.shtm">Texas Department of State Health Services</a>, Site Design © Kerry C. McAlister, 2018; Imagery: <a href="mapbox://styles/kmcalister/cjdrsecns00yg2rs4awoet3c8">Mapbox</a>'
        });
    //add tile layer to map    
    tileLayer.addTo(mymap);   
    //call for geoJSON data to be added - function is later in code
    getData(mymap);
    $(document).click(function(){
        $(".welcomeWin").hide();
    });
};

//Create marker and load attributes into popup window
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0];

    //Marker options below...
    var geoJsonMarkerOptions = {
        fillColor: "#006FFF",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.5
               
    };
    //set attribute value variable
    var attValue = Number(feature.properties[attribute]);
    //create marker from attribute value and radius
    geoJsonMarkerOptions.radius = calcPropRadius(attValue);
    //set the layer where markers will be added
    var layer = L.circleMarker(latlng, geoJsonMarkerOptions);
    //set popup attributes to be added to marker
    var popup = new Popup(feature.properties, attribute, layer, geoJsonMarkerOptions.radius);
    //attach popups to corresponding layer
    popup.bindToLayer();
    //user can click circle marker to open popup
    layer.on({
        click:function(){
            this.openPopup();
        },
        //user can hover over circle to open popup as well
        mouseover:function(){
            this.openPopup();
        },
        //user will close the popup when their mouse moves off the circle
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
    //extend sequence controls to circle markers
    var SequenceControl = L.Control.extend({
        geoJsonMarkerOptions: {
            positions: 'topright'
        },


        //create the div for sequence controls and buttons
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
    //add sequnce controls to map
    mymap.addControl(new SequenceControl());
    //assign intervals to range slider
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });

    $('.range-slider').on

    createLegend(mymap, attributes[1]);
    updateLegend(mymap, attributes[0]);


    //assign image files to range slider buttons
    $('#reverse').html('<img src="img/if_arrow-left.png">');
    $('#forward').html('<img src="img/if_arrow-right.png">');

    

    //determine the action taken when slider buttons clicked
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
    //update symbols and legend when buttons clicked
    $('.range-slider').on('input', function(){

        var index = $(this).val();

        updatePropSymbols(mymap, attributes[index]);
        updateLegend(mymap, attributes[index]);
        
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
    //determine popup content
    var popupContent = "<p><b>MSA:</b> " + properties.NAME + "</p>";
    //derive attribute from data and add to popup
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Population in " + year + ":</b> " + properties[attribute];
    //bind popup to layer
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -radius),
        
    });
};

//Create temporal legend
function createLegend(mymap, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (mymap) {
            //create temporal legend div 
            var legendContainer = L.DomUtil.create('div', 'legend-control-container');
            var svg = '<svg id="attribute-legend" width="250px" height="125px">';
            var circles = {
                max: 50,
                mean: 80,
                min: 110
            };
            //determine circle marker size for temporal legend
            for (var circle in circles){

                svg += svg += '<circle class="legend-circle" id="' + circle +
                '" fill="#006FFF" fill-opacity="0.5" stroke="#000000" cx="60"/>';

                svg += '<text id="' + circle + '-text" x="120" y="' + circles[circle] + '"></text>';
            };

            svg += "</svg>"
            //append temporal legend to container div
            $(legendContainer).append('<div id="temporal-legend">');
            $(legendContainer).append(svg);

            return legendContainer;
        }
    });
    //add legend to map
    mymap.addControl(new LegendControl());
    updateLegend(mymap, attributes);    
};

//update legend
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
        //calculate amount shown on legend
        $('#'+key+'-text').text(Math.round(circleValues[key]) + " People");
    };


};

//Calculate circle values to be passed into updateLegend
function getCircleValues(mymap, attributes){
    var min = Infinity,
        max = -Infinity;
    //help determine min and max values
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
    //calculate mean
    var mean = (max + min)/2;

    return {
        max: max,
        mean: mean,
        min: min
    };

};

//process polygon data from geoJSON
function processPolyData(data){
    var polyAttributes = [];

    var polyProperties = data.features[0].polyProperties;
    //check polygon attributes to determine validity
    for (var polyAttribute in polyProperties){
        if (polyAttribute.indexOf("Perc")> -1){
            polyAttributes.push(polyAttribute);
        };
    };

    return polyAttributes
};

//create symbology for polygon symbols
function createPolySymbols(data, mymap, polyAttributes){
    L.geoJson(data, {
        });
    //assign symbology values for polygons 
    var counties = L.geoJson(data, {
        fillColor: "#bf5700",
        color: "#000",
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.2,
        interactive: false        
    });
    //assign polygon layer to overlay variable
    var overlay = {
        "MSA Boundaries": counties
    };
    //assign control to overlay with the county layer closed when loading the map
    L.control.layers(null, overlay,{collapsed:false}).addTo(mymap);

    return mymap
};

//Collect data from geoJSON
function getData(mymap){
    //load polygon geoJSON
    $.ajax("data/MSA_Poly.geojson", {
        dataType: "json",
        success: function(response){

            var polyAttributes = processPolyData(response);
            createPolySymbols(response, mymap, polyAttributes);
        }
    });
    //load point geoJSON
    $.ajax("data/MSA.geojson", {
        dataType: "json",
        success: function(response){

            var attributes = processData(response);

            createPropSymbols(response, mymap, attributes);
            createSequenceControls(mymap, attributes);
            
        }        
    });
};
//create map
$(document).ready(createMap);