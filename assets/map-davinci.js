import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Circle, Fill, Style } from 'ol/style';
import { Map, View } from 'ol/index';
import { Point } from 'ol/geom';
import { getVectorContext } from 'ol/render';
import { useGeographic } from 'ol/proj';

useGeographic();

const layer = new TileLayer({
  source: new OSM()
});

const derbyish = [-1.4746, 52.9225];

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: derbyish,
    zoom: 8
  })
});

// map.getView().setCenter(derbyish);

const image = new Circle({
  radius: 8,
  fill: new Fill({ color: 'rgb(255, 153, 0)' }),
});

const style = new Style({
  image: image,
});

let queryURL = "http://environment.data.gov.uk/flood-monitoring/id/floods?min-severity=3";
let geometries = [];

// Get lat/lon based on city name
$.ajax({
  url: queryURL,
  method: "GET"
})
  .then(function (response) {

    if (!response.items.length) {
      // No data
      console.log("No data available");
    } else {
      // Get lat/long for flood event - this step is a serious bottleneck
      response.items.forEach(item => {
        let positionURL = item['@id'];
        $.ajax({
          url: positionURL,
          method: "GET"
        })
          .then(function (posResponse) {
            if (!posResponse || !response.items.length) {
              console.log("Could not establish position for " + item.description);
            } else {
              // Push to a points array to be added to map by postrender callback
              let lon = posResponse.items.floodArea.long;
              let lat = posResponse.items.floodArea.lat;
              geometries.push(new Point([lon, lat]));
            }
          });
      });
    }
  });

layer.on('postrender', function (event) {

  const vectorContext = getVectorContext(event);

  for (let i = 0; i < geometries.length; ++i) {
    if (geometries[i]) {
      // TODO: select icon based on severity? 
      vectorContext.setStyle(style);
      vectorContext.drawGeometry(geometries[i]);
    }
  }
  map.render();
});

