mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2ZWxhciIsImEiOiJjanFjazlweHMwM2p5NDNvM3Rydm1tZ3dzIn0.y2NW7B5vRxESYaBC5NbEgQ';
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v10",
})
map.addControl(new mapboxgl.FullscreenControl({container: document.querySelector("body")}))
map.addControl(new mapboxgl.NavigationControl())
map.addControl(new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
}))

let previousLayerId = null

map.on('load', function () {
  updateGeoJson()
  window.onhashchange = updateGeoJson
})

function updateGeoJson() {
  if (previousLayerId != null) {
    map.removeLayer(previousLayerId)
    previousLayerId = null
  }

  const regionId = window.location.hash.slice(1)
  // ensure that malicious input is not used
  if (!/^[\w.-]+$/.test(regionId)) {
    alert("Passed region id violates format")
    return
  }

  fetch("/geojson/" + regionId + ".geojson", {mode: "same-origin"})
    .then(it => it.json())
    .then(geojson => {
      previousLayerId = regionId
      // https://github.com/mapbox/mapbox-gl-js/issues/4087
      // https://github.com/mapbox/mapbox-gl-js/issues/4088
      // https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness
      // https://www.mapbox.com/mapbox-gl-js/style-spec
      map.addLayer({
        id: regionId,
        type: "fill",
        paint: {
          "fill-color": "#3388ff",
          "fill-opacity": 0.1,
        },
        source: {
          type: "geojson",
          data: geojson,
        },
      })
      // https://www.mapbox.com/mapbox-gl-js/example/zoomto-linestring/
      // https://stackoverflow.com/questions/35586360/mapbox-gl-js-getbounds-fitbounds
      map.fitBounds(turf.bbox(geojson))
    })
    .catch(e => alert(`Error loading or parsing GeoJSON for region ${regionId}: ${e}`))
}