"use strict"

// noinspection SpellCheckingInspection, ES6ModulesDependencies
mapboxgl.accessToken = "pk.eyJ1IjoiZGV2ZWxhciIsImEiOiJjanFjazlweHMwM2p5NDNvM3Rydm1tZ3dzIn0.y2NW7B5vRxESYaBC5NbEgQ"

class CoverageApp {
  constructor(defaultStyleUri = "mapbox://styles/mapbox/outdoors-v10") {
    this.defaultStyleUri = defaultStyleUri

    // noinspection ES6ModulesDependencies
    this.map = new mapboxgl.Map({
      container: "map",
      style: this.defaultStyleUri,
    })
    const map = this.map

    this.infoControl = new MapboxInfoBoxControl()

    this.currentLayerId = null
    this.currentGeoJson = null

    // triggered when `setStyle` is called
    map.on("style.load", () => {
      if (this.currentLayerId != null) {
        this.addGeoJsonLayers(this.currentLayerId, this.currentGeoJson)
      }
    })

    map.on("load", () => {
      this.updateGeoJson()

      window.onhashchange = () => {
        this.updateGeoJson()
      }
    })

    this.addControls()
  }

  addControls() {
    /// not enough width on Android screen - need to hide input and open on icon click (todo)
    // map.addControl(new MapboxGeocoder({
    //   accessToken: mapboxgl.accessToken,
    // }))

    const map = this.map
    map.addControl(new MapboxStyleSwitcherControl(this.defaultStyleUri))
    // noinspection ES6ModulesDependencies
    map.addControl(new mapboxgl.FullscreenControl({container: document.querySelector("body")}))
    // noinspection ES6ModulesDependencies
    map.addControl(new mapboxgl.NavigationControl())
    // noinspection ES6ModulesDependencies
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
    }))
    // ScaleControl doesn't make sense for us

    map.addControl(this.infoControl)
    // noinspection JSCheckFunctionSignatures
    map.addControl(new MapboxLanguage())
  }

  updateGeoJson() {
    if (this.currentLayerId != null) {
      this.map.removeLayer(this.currentLayerId)
      this.map.removeLayer(`${this.currentLayerId}-line`)
      this.currentLayerId = null
      this.currentGeoJson = null
    }

    const regionId = window.location.hash.slice(1)
    // ensure that malicious input is not used
    if (!/^[\w.-]+$/.test(regionId)) {
      alert("Passed region id violates format")
      return
    }

    fetch(`/geojson/${regionId}.geojson`, {mode: "same-origin"})
      .then(it => it.json())
      .then(geojson => {
        this.currentLayerId = regionId
        this.currentGeoJson = geojson
        this.addGeoJsonLayers(regionId, geojson)
        // https://www.mapbox.com/mapbox-gl-js/example/zoomto-linestring/
        // https://stackoverflow.com/questions/35586360/mapbox-gl-js-getbounds-fitbounds
        // noinspection ES6ModulesDependencies,NodeModulesDependencies
        this.map.fitBounds(turf.bbox(geojson), {
          // to make visible not included area (to make clear what area is not included without using zoom controls)
          // not important for most regions, but for wide rectangular like Alps it is useful
          padding: 64,
        })

        this.infoControl.show(geojson)
      })
      .catch(e => alert(`Error loading or parsing GeoJSON for region ${regionId}: ${e}`))
  }

  addGeoJsonLayers(regionId, geojson) {
    const map = this.map
    // https://github.com/mapbox/mapbox-gl-js/issues/4087
    // https://github.com/mapbox/mapbox-gl-js/issues/4088
    // https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness
    // https://www.mapbox.com/mapbox-gl-js/style-spec
    map.addLayer({
      id: regionId,
      type: "fill",
      paint: {
        "fill-color": "#3388ff",
        "fill-opacity": 0.2,
      },
      source: {
        type: "geojson",
        data: geojson,
      },
    })
    map.addLayer({
      id: regionId + "-line",
      type: "line",
      paint: {
        "line-color": "#3388ff",
        "line-width": 2,
      },
      source: {
        type: "geojson",
        data: geojson,
      },
    })
  }
}

new CoverageApp()