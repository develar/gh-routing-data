"use strict"

// https://github.com/el/infobox-control/blob/master/dist/index.js
class MapboxInfoBoxControl {
  getDefaultPosition() {
    return "top-left"
  }

  onAdd(map) {
    this.container = document.createElement("div")
    this.container.classList.add("mapboxgl-ctrl", "mapboxgl-ctrl-group", "mapboxgl-ctrl-icon", "mapboxgl-info-box-ctrl")
    this.container.style.display = "none"
    return this.container
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container)
    this.container = null
  }

  show(geojson) {
    this.container.style.display = "block"
    let html = ""
    let downloadText = "Download"
    if (/(android)/i.test(navigator.userAgent)) {
      html = `<a href="${geojson.properties.locusInstall}">Install on Locus</a> or `
      downloadText = downloadText.toLowerCase()
    }

    const zipUrls = geojson.properties.zipUrls
    if (zipUrls.length === 1) {
      html += `<a href="${zipUrls[0]}">${downloadText}</a>`
    }
    else {
      html += `${downloadText} ${zipUrls.map((v, index) => `<a href="${v}">part ${index + 1}</a>`).join(", ")}`
    }
    this.container.innerHTML = html
  }
}

// https://github.com/el/style-switcher/blob/master/dist/index.js
class MapboxStyleSwitcherControl {
  constructor(defaultStyleUri, styles) {
    this.defaultStyleUri = defaultStyleUri
    this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES
  }

  getDefaultPosition() {
    return "top-right"
  }

  onAdd(map) {
    this.container = document.createElement("div")
    const container = this.container
    container.classList.add("mapboxgl-ctrl", "mapboxgl-ctrl-group")
    const mapStyleContainer = document.createElement("div")
    const styleButton = document.createElement("button")
    mapStyleContainer.classList.add("mapboxgl-style-list")
    for (const style of this.styles) {
      const styleElement = document.createElement("button")
      styleElement.innerText = style.title
      styleElement.classList.add(style.title)
      styleElement.dataset.uri = style.uri
      styleElement.addEventListener("click", event => {
        const srcElement = event.srcElement
        map.setStyle(srcElement.dataset.uri)
        mapStyleContainer.style.display = "none"
        styleButton.style.display = "block"
        const elements = mapStyleContainer.getElementsByClassName("active")
        while (elements[0] != null) {
          elements[0].classList.remove("active")
        }
        srcElement.classList.add("active")
      })

      if (style.uri === this.defaultStyleUri) {
        styleElement.classList.add("active")
      }
      mapStyleContainer.appendChild(styleElement)
    }

    styleButton.classList.add("mapboxgl-ctrl-icon", "mapboxgl-style-switcher")
    styleButton.addEventListener("click", () => {
      styleButton.style.display = "none"
      mapStyleContainer.style.display = "block"
    })

    document.addEventListener("click", event => {
      if (!this.container.contains(event.target)) {
        mapStyleContainer.style.display = "none"
        styleButton.style.display = "block"
      }
    })

    container.appendChild(styleButton)
    container.appendChild(mapStyleContainer)
    return container
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container)
    this.container = null
  }
}

// https://www.mapbox.com/api-documentation/#styles
MapboxStyleSwitcherControl.DEFAULT_STYLES = [
  {title: "Outdoors", uri: "mapbox://styles/mapbox/outdoors-v10"},
  {title: "Streets", uri: "mapbox://styles/mapbox/streets-v10"},
  {title: "Dark", uri: "mapbox://styles/mapbox/dark-v9"},
  {title: "Light", uri: "mapbox://styles/mapbox/light-v9"},
  {title: "Satellite", uri: "mapbox://styles/mapbox/satellite-streets-v10"},
]