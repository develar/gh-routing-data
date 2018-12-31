let map = L.map("map")
let layer = null

L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: "mapbox.run-bike-hike",
  accessToken: "pk.eyJ1IjoiZGV2ZWxhciIsImEiOiJjanFjazlweHMwM2p5NDNvM3Rydm1tZ3dzIn0.y2NW7B5vRxESYaBC5NbEgQ"
}).addTo(map)

function onEachFeature(feature, layer) {
  if (feature.properties) {
    layer.bindPopup(Object.entries(feature.properties).map(it => it.join(": ")).join("<br />"))
  }
}

function updateGeoJson() {
  if (layer != null) {
    map.removeLayer(layer)
    layer = null
  }

  const regionId = window.location.hash.slice(1)
  // ensure that malicious input is not used
  if (!/^[\w.-]+$/.test(regionId)) {
    alert("Passed region id violates format")
    return
  }

  fetch("/geojson/" + regionId + ".geojson", {cors: true})
    .then(it => it.json())
    .then(it => {
      layer = L.geoJson(it, {onEachFeature}).addTo(map)
      map.fitBounds(layer.getBounds())
    })
    .catch(() => alert(`Error loading or parsing GeoJSON for region ${regionId}`))
}

updateGeoJson()
window.onhashchange = updateGeoJson