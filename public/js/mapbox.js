/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.dir(locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoidnVsZWJhb2xvbmciLCJhIjoiY2xob2thdWpuMWxtZjNmcWwxNmN3OWtnaCJ9.2DxslRthooxypIYy5Y2f1w';
const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/vulebaolong/clholw4ti01s201qy70mt6h0f', // style URL,
  scrollZoom: false
  //   center: [-118.113491, 34.111745], // starting position [lng, lat]
  //   zoom: 9 // starting zoom
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom'
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  //Add popup
  new mapboxgl.Popup({
    offset: 30
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);
  // Mở rộng giới hạn bản đồ để bao gồm vị trí hiện tại
  bounds.extend(loc.coordinates);
});
const padding = {
  top: 200,
  bottom: 150,
  left: 100,
  right: 100
};
map.fitBounds(bounds, { padding });
