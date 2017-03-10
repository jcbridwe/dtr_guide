$(document).ready(function(){
  $('.dropdown a.test').on("click", function(e){
    $(this).next('ul').toggle();
    e.stopPropagation();
    e.preventDefault();
  });
});

var map = L.map("map", {drawControl: true}).setView([35.7787, -78.6397], 15);
map.setMaxBounds([[90.0, -180.0], [-90.0, 180.0]]);

var layer = L.esri.basemapLayer("Topographic", {
  maxZoom: 18,
  minZoom: 14,
}).addTo(map);

  var layerLabels;
  //Lets user chnage basemaps
  function setBasemap(basemap) {
    if (layer) {
      map.removeLayer(layer);
    }

    layer = L.esri.basemapLayer(basemap);


    map.addLayer(layer);

    if (layerLabels) {
      map.removeLayer(layerLabels);
    }

    if (basemap === 'ShadedRelief'
     || basemap === 'Oceans'
     || basemap === 'Gray'
     || basemap === 'DarkGray'
     || basemap === 'Imagery'
     || basemap === 'Terrain'
   ) {
      layerLabels = L.esri.basemapLayer(basemap + 'Labels');
      map.addLayer(layerLabels);
    }
  }

  function changeBasemap(basemaps){
                  var basemap = basemaps.value;
                  setBasemap(basemap);
  }
  var popup = L.popup();

var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();
//search controller
var searchControl = L.esri.Geocoding.geosearch({
    providers: [
      arcgisOnline,
      L.esri.Geocoding.mapServiceProvider({
        label: 'States and Counties',
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
        layers: [2, 3],
        searchFields: ['NAME', 'STATE_NAME']
        })
      ]
    }).addTo(map);

//Legend Stuff
var info = new L.Control.Legend({
    position: 'bottomright'
});

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Job Data</h4>' +  (props ? '<br>' + props.LAT  + ' :LAT' + '</b><br />' + props.LON + ' :LON' + '</b><br />' + props.CID + ': Cell ID'
        : 'Hover over a grid cell');
};

info.addTo(map);

var zoom = map.getZoom();
console.log("Starting zoom level is " + zoom);

//Used to highlight cells of grids on mouseover, zoom to cells when clicked

function highlightFeature(e) {
   var layer = e.target;
   layer.setStyle({
    weight: 0.25,
    fillColor: "#ffff00",
    dashArray: '',
    fillOpacity: 0.5
   });
   info.update(layer.feature.properties);
   if(!L.Browser.ie && !L.Browser.opera){
    layer.bringToFront();
   }
};

function resetHighlight(e) {
  var layer = e.target;
  layer.setStyle({
    weight: 0.25,
    dashArray: '',
    fillOpacity: 0
  });
  info.update();
};

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds(15));
};

//variable to highlightJob cells
var redJob = {
  fillColor: '#FF0000',
  fillOpacity: 0.5,
  weight: 0.25,
  dashArray: ''
};

var blueJob = {
  fillColor: '#038ef0',
  fillOpacity: 0.5,
  weight: 0.25,
  dashArray: ''
};

var greenJob = {
  fillColor: '#26b426',
  fillOpacity: 0.5,
  weight: 0.25,
  dashArray: ''
};

var purpleJob = {
  fillColor: '#b22ea3',
  fillOpacity: 0.5,
  weight: 0.25,
  dashArray: ''
};

var resetStyle = {
  color: "#000000",
  weight: 0.25,
  opacity: 0.5,
  fillOpacity: 0
};
var status = '';

//Global variables and arrays
var grid = L.geoJson();
var JobsArray = [];
var cidJArray = [];
var pos = [];

// This is the ajax request for the jobs data
$.ajax({
    type: 'GET',
    url: "http://ec2-54-172-145-108.compute-1.amazonaws.com:8888/jobs",
    timeout: 8000,
    crossDomain: true,
    dataType: 'json',
    data: JobsArray,
    headers: {
        "VMUser": "hmoreno"
    },

    //Renders data to view
    success: function (data) {
      //JobsArray = data;
      for(i=0; i<data.length; i++){
        console.log('hey');
        JobsArray.push(data[i]);
      }

      //console.log(JobsArray);
      JobsArray.forEach(function (value) {
        //console.log (pos);
        var jobName = value.name;
        var createdBy = value.createdby;
        var cidJ = value.cid;
        var id = value.jobid;
        var status = value.status;
        var provider = value.provider;
        //Adds a marker for the job
        var marker = L.marker([value.latitude, value.longitude]).addTo(map);
        //Adds circle on map
        var circle = L.circle([value.latitude, value.longitude], 500, {
         color: 'red',
         fillColor: '#f03',
         fillOpacity: 1.5 }).addTo(map);

        $(".remove").on("click", function(){
          console.log("it worked");
          if(map.hasLayer(circle)){
            map.removeLayer(circle);
          } else {
            map.addLayer(circle);
          };

          if(map.hasLayer(marker)){
            map.removeLayer(marker);
          } else {
            map.addLayer(marker);
          };  
        });
      }); 
     // Fetch the file data making the grid       
      $.getJSON('./grid.geojson', function (data) {
         // Assign the results to the geojsonData variable
        //console.log(JobsArray);
        grid = L.geoJson(data, {
          //inital css style of grid
          style: function(feature){
            return {
              color: "#000000",
              weight: 0.25,
              opacity: 0.5,
              fillOpacity: 0
            };
          },

          
          //looks through each feature in the grid.
          onEachFeature: function( feature, layer ){
              var id = feature.properties.CID;
              var lat = feature.properties.LAT;
              var lon = feature.properties.LON;
              var popupContent = "";
              
              JobsArray.forEach(function (item) {
                $(".checkedin").on("click", function() {
                  grid.resetStyle(this);
                  if (item.status === "CHECKEDIN" && item.cid === id) {
                    console.log("Victory");
                    layer.setStyle(greenJob);
                  };
                });
                $(".exported").on("click", function() {
                  layer.setStyle(resetStyle);
                  if (item.status === "EXPORTED" && item.cid === id) {
                    console.log("Victory");
                    layer.setStyle(blueJob);
                  };
                });
                
                $(".new").on("click", function() {
                  grid.resetStyle(this);
                  // if (item.status === "NEW") {
                  //   layer.setStyle(resetStyle);
                  // };
                  if (item.status === "NEW" && item.cid === id) {
                    console.log("NEW");
                    layer.setStyle(redJob);
                  // } else {
                  //   layer.setStyle(resetStyle);
                   };
                });
                
                $(".posted").on("click", function() {
                  layer.setStyle(resetStyle);
                  if (item.status === "POSTED" && item.cid === id) {
                    console.log("Victory");
                    layer.setStyle(purpleJob);
                  };
                });
                
                $(".tds").on("click", function() {
                  if (item.specification === "TDS") {
                    layer.setStyle(resetStyle);
                  };
                  if (item.specification === "TDS" && item.cid === id) {
                    console.log("TDS");
                    layer.setStyle(purpleJob);
                  };
                });

                $(".mgcp").on("click", function() {
                  if (item.specification === "MGCP") {
                    layer.setStyle(resetStyle);
                  };
                  if (item.specification === "MGCP" && item.cid === id) {
                    console.log("MGCP");
                    layer.setStyle(purpleJob);
                  };
                });
                
              });
              //Looks through each Job item in the Job array and if the CID's match, adds the popup content for that job.
              JobsArray.forEach(function (item) {
                //console.log(status);
                if(item.cid === id) { 
                  popupContent = "<h5><b>Job Data</b></h5>" + "<b>Job Name: </b>" + item.name + "</br>" + "<b>Status: </b>" + item.status + "<br/>" + "<b>CID: </b>" + item.cid + "<br/>" + "<b>Created by: </b>" + item.createdby + "</br>" + "<b>Creation Date: </b>" + item.creationdate + "<br/>" + "<b>Provider: </b>" + item.provider + "<br/>" + "<b>Job ID: </b>" + item.jobid + "<br/>" + "<b>Latitude: </b>" + item.latitude + "<br/>" + "<b>Longitude: </b>" + item.longitude + "<br/>" + "<b>Export Date: </b>" + item.exportdate + "<br/>" + "<b>Exported By: </b>" + item.exportedby + "<br/>" + "<b>Features Checked In: </b>" + item.numfeaturescheckedin + "<br/>" + "<b>Features Exported: </b>" + item.numfeaturesexported + "<br/>" + "<b>Feature Classes Checked In: </b>" + item.numfeatureclassescheckedin + "<br/>" + "<b>Feature Classes Exported: </b>" + item.numfeatureclassesexported + "<br/>" + "<b>Posted to Gold By: </b>" + item.postedtogoldby + "<br/>" + "<b>Posted to Gold Date: </b>" + item.posttogolddate + "<br/>";
                }
              });
              
              if (popupContent) {    
                layer.bindPopup(popupContent);
                layer.on('mouseover', function (e) {
                  this.openPopup();
                  });
                  layer.on('mouseout', function (e) {
                  this.closePopup();
                  });
              }

            layer.on({
              mouseover: highlightFeature,
              mouseout: resetHighlight,
              click: zoomToFeature
            });
            
            function coord (e) {
              document.getElementById('latitude').value = feature.properties.LAT, 
              document.getElementById('longitude').value = feature.properties.LON,
              document.getElementById('cid').value = feature.properties.CID
            };
            layer.on("mouseover", coord);
            layer.on("click", highlightFeature);


          },
        });
        //Controls when the grid is added to the map based on the zoom level
        map.on('zoomend ', function(e) {
          var zoom = map.getZoom();
          console.log("Starting zoom level is " + zoom);
          if ( zoom < 4 || zoom > 11){
            console.log("Zoom Level is less than 6. Current Level is " + zoom);
            document.getElementById('latitude').value = null;
            document.getElementById('longitude').value = null;
            grid.removeFrom(map) 
          } else if ( zoom >= 4 || zoom <= 11){
            var tom = map.getZoom();
            console.log("Zoom level is greater or equal to 6");
            console.log("Current level is " + zoom);
            grid.addTo(map) 
          }
        });         
//end of second get request for the grid
    });
  },
//end of first ajax request for the jobs
});