$(function(){
  // 36.96062,-0.40244,36.96062,-0.40244
    var map = L.map('map_dash').setView([-0.40244,36.96062],10);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA'
  }).addTo(map);

    var data_pnt;
    var const_data;
    // var data_out = [];

    $.getJSON('data/subcounty.geojson').
      done(function(data){
        loadData(data);
        const_data = data;
        // loadData(const_data);
      }).fail(function(){
        console.log();
    });

    $.getJSON('data/hospital.geojson').
        done(function(data){
          let info = getData(data);
          data_pnt = data;
          filterData(data, "all");
        }).fail(function(){
          console.log();
    });


    function getData(data){
      let total = data.features.length;
      let moh = data.features.filter(k => k.properties.AGENCY == 'MOH').length;
      let mss = data.features.filter(k => k.properties.AGENCY == 'MISS').length;

      let descriptive_count = [total, moh, mss];
      let element = $.find('.h2');

      for (var i in element) {
        $(element[i]).text(descriptive_count[i]);
      }
    }

    function loadData(data){
      let coord = data.features.map(k=> k.geometry.coordinates)[0].map(k => k[0]).map(m=> m[0]);

      console.log(coord);
    }

// Filter data according to facility type
    function filterData(data, type_facility){
      var data_out = [];
      var result;
      if (type_facility != "all") {
        result = data.features.filter((el)=> el.properties.F_TYPE == type_facility );
      }else{
        result = data.features;
      }

      let sub = ["Mathira", "Mukurwe-ini", "Kieni", "Tetu", "Nyeri Town", "Othaya"];

      for (let el of sub) {
        data_out.push({
          name:el,
          value:result.filter((element) => element.properties.DIVISION == el).length,
          colorValue:result.filter((element) => element.properties.DIVISION == el).length,
        });
      }

      updateMap(data_out);
      plot(data_out);

    }

    function updateMap(data_out){
      map.eachLayer(layer=>{
        if (layer instanceof L.LayerGroup) {
          map.removeLayer(layer);
        }
      });
      // autoscale depending on the values
      function scale(){
        let dataset = data_out.map(k=> k.value).sort((a,b)=> a-b);;
        let min = dataset[0], max = dataset[dataset.length-1];
        let step = (max - min)/ (dataset.length);

        let scale = [];
        for (var i = min; i < max; i += step) {
          scale.push(i);
        }

        return scale
      }

      let scale_value = scale();

      let color = ['#f1eef6','#d0d1e6','#a6bddb','#74a9cf','#2b8cbe','#045a8d'];

      for (let  i in data_out) {
        let name = data_out[i]['value'];
        data_out[i]['colors'] = (name <= scale_value[0])?'#f1eef6':name <= scale_value[1]?'#d0d1e6':name <= scale_value[2]?'#a6bddb':name <= scale_value[3]?'#74a9cf':name <= scale_value[4]?'#045a8d':'#2b8cbe';
      }

      let sub = L.geoJson(const_data,{
        style:mystyle,
        onEachFeature:function (feature,layer) {
          layer.bindPopup(feature.properties.const_nam);
        }
      }).addTo(map);

      if (map.hasLayer(sub)) {
        // map.fitBounds(sub.getBounds());
      }


      function setColor(name){
        return data_out.filter(k=> k.name == name )[0].colors;
      }

      function mystyle(feature){
        return{
          fillColor:setColor(feature.properties.const_nam),
          color:'black',
          weight:0.5,
          opacity:1,
        }
      }

      // console.log(const_data);
      data_out = [];
    }

    $('#type').on('change', function(e){
      let value = $(this).val();
      filterData(data_pnt, value);
      e.stopPropagation();
    });

  function plot(data){
    // console.log(data);
      Highcharts.chart('tree-map', {
        colorAxis: {
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[8]
        },
        series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            data: data
        }],
        title: {
            text: 'Count of Hospitals By Type'
        }
    });

    Highcharts.chart('bar', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'column'
        },
        title: {
            text: 'Facility Type'
        },
        xAxis: {
              categories:["Mathira", "Mukurwe-ini", "Kieni", "Tetu", "Nyeri Town", "Othaya"],
              crosshair: true
          },
          yAxis: {
              min: 0,
              title: {
                  text: 'Hospital Count'
              }
          },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.count:.1f}%</b>'
        },
        plotOptions: {
          series: {
                stacking: 'normal',
                // color:Highcharts.getOptions().color[0],
            },
            Legend:false
        },
        series: [{
            name: 'Count',
            data: data.map(el => el.value)
        },]
     });
  }

// plot([1,2]);

});
