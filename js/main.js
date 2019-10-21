$(function (){
  var map = L.map('map').setView([-0.4897352768929488,36.98878027211687],12);

  function onEachFeature(feature,layer){
    var popupString = "<div class='popup-title bg-danger'><h6 class='text-center'>"+feature.properties.F_NAME+"</h6></div><div class='row'> <div class='col-md-6'>"
            +" <p>Agency</p><p>District</p><p>Location</p><p>Sub Location</p></div>"
            +"<div class='col-md-6'><p>"
            + feature.properties.AGENCY+"</p><p>"
            + feature.properties.DIST+"</p><p>"
            + feature.properties.LOCATION+"</p><p>"
            + feature.properties.SUB_LOCATI+"</p></div></div>";

    layer.bindPopup(popupString);
  }

  var hospital_data = L.geoJson(null,{
    onEachFeature:onEachFeature,
    pointToLayer:function(geojsonOpt, latlng){
      return L.marker(latlng,{
        icon: new L.AwesomeMarkers.Icon({
          prefix:'fa',
          icon:'plus',
          markerColor:"red"
        })
      })
    }
  }).addTo(map);

  $.getJSON('./data/hospital.geojson').
    done(function(data){
      hospital_data.addData(data);
    }).
    fail(function(xhr, sta, errmsg){
      console.log("Failed to load the data");
    });

    // Map controls
    var search_control = new L.Control.Search({
      layer:hospital_data,
      propertyName:'F_NAME',
    }).addTo(map);

    let baselayers = {
      'Subcounty':hospital_data
    };

    let overlays = {
      'Hospital':hospital_data
    };


    var layer_control = L.control.layers(baselayers,overlays).addTo(map);

    // Form control: for query and routing
    var form_control = L.control({position:'topright'});

    form_control.onAdd = function(map){
      var div = L.DomUtil.create('div','analysis-tab');

      let btn = L.DomUtil.create('button','btn btn-sm bt-tog');
      btn.innerHTML += "F";

      div.appendChild(btn);

      let content = L.DomUtil.create('div', 'content col-md-12');
      let dt = document.getElementById('analysis');
      // content.appendChild(dt);
      div.appendChild(content);
      // console.log(dt);
      // content.innerHTML += dt.textContent
      btn.addEventListener('click', function(e){
          e.preventDefault();
         let tab =   $('.analysis').css('display');

          if (tab == "none") {
            // responsive: for mobile device: look at modals
            $('.leaflet-control.leaflet-control-layers, .analysis-tab').css({"right":"26vw"});
            $('.analysis').show();

          }
          else{
            $('.analysis').hide();
            $('.leaflet-control.leaflet-control-layers, .analysis-tab').css({"right":"0"});
          }

        e.stopPropagation();
      });


      return div;
    }

    map.addControl(form_control);


    $('#route').on('submit', function(e){
      e.preventDefault();
      let data = $(this).serializeArray();

      console.log(data);
      // routing(waypoints);
    });

    $('#search').on('submit', function(e){
      e.preventDefault();
      let data = $(this).serializeArray();

      // console.log(data);
      search_nearest([map.getCenter().lng, map.getCenter().lat]);
    });

    $('#buffer').on('submit', function(e){
      e.preventDefault();
      let data = $(this).serializeArray();

      console.log(data[0].value);
      buffer_select([map.getCenter().lng, map.getCenter().lat], data[0].value);
    });

    $('#locate, #locate_buffer, #locate_search').on('click', function(e){
      e.preventDefault();
      geolocate()
      // buffer_select(distance, latLng);
    });

    function geolocate(){

      var location = map.getCenter();
      map.on('locationfound', function(e){
        var date = new Date(e.timestamp);

        location = e.latlng;
        L.marker(e.latlng).addTo(map).bindPopup('Your Location is: <br> '+e.latlng + date.toString()).openPopup();
      });

      map.on('locationerror', function(e){
        alert("Enable location in your gadget");
        location = map.getCenter();
      });

  	  map.locate({setView:true,zoom:10});

      console.log(location);
    }

    function routing( waypoints ){

      var router = L.Routing.control({
        waypoints:[
           L.latLng(-0.42, 37.13),
           L.latLng(-0.58243, 37.006306)
          ],
        routeWhileDragging:true,
        // geocoder: L.Control.Geocoder.nominatim(),
        showAlternatives:true,
        altLineOptions:true,
        router: L.Routing.mapbox('pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA')
       });

      map.addControl(router);
    }

    function buffer_select(coords,radius){
      // Add a blue circle for the selected points and a
      let point = turf.point(coords)
      let buffer = turf.buffer(point, radius,{units:'kilometers'});

      let feature_buffer = L.geoJSON(buffer,{
          style:function(feature){
            return {
              fillColor:'blue',
              opacity:0.6,
              weight:0
            }
          }
        }).addTo(map);

      // check the features that intersect with the buffer
      let pnts = hospital_data.toGeoJSON().features.map(k => [k.properties.LONG,k.properties.LAT]);

      let feature_intersect = turf.pointsWithinPolygon(turf.points(pnts), buffer);
      let layer_selected = L.geoJSON(feature_intersect,{
          style:function(feature){
            return {
              fillColor:'green',
              opacity:0.6,
              color:'green'
            }
          },
          pointToLayer:function(geojsonOpt, latLng){
            return L.circleMarker(latLng,{radius:8})
          }
        }).addTo(map);

        map.fitBounds(layer_selected.getBounds());
      // console.log(feature_intersect);
    }



    function search_nearest(current_location){
      // check the features that intersect with the buffer
      console.log(current_location);
      let pnts = hospital_data.toGeoJSON().features.map(k => [k.properties.LONG,k.properties.LAT]);

      // var interpolate = turf.interpolate(turf.points(pnts), 30, {units:'metres',property:'',gridType:'square'});

      // console.log(interpolate);
      let nearest = turf.nearestPoint(turf.point(current_location), turf.points(pnts));

      console.log(nearest);
      let closest_facility = L.geoJSON(nearest,{
          style:function(feature){
            return {
              fillColor:'green',
              opacity:0.6,
              color:'green'
            }
          },
          pointToLayer:function(geojsonOpt, latLng){
            return L.circleMarker(latLng,{radius:8})
          }
        }).addTo(map);

        map.setView(nearest.geometry.coordinates.reverse());
    }

    map.on('click', (e) => console.log(e));
});
