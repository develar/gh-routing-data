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

  show(info, regionName, formatVersion) {
    let item = null
    for (const infoElement of info) {
      if (formatVersion === "" || formatVersion === infoElement.ghVersion) {
        item = infoElement
        break
      }
    }

    if (item == null) {
      console.error(`No data for ${item}`)
      return
    }

    const regionData = item.regions.find(it => it.name === regionName)
    console.log(regionData)

    this.container.style.display = "block"
    let html = ""
    let downloadText = "Download"
    if (/(android)/i.test(navigator.userAgent)) {
      html = `<a href="locus-actions://https/graphhopper.develar.org/locus/${regionData.locusUrl}}">Install on Locus</a> or `
      downloadText = downloadText.toLowerCase()
    }

    const parts = regionData.parts
    if (parts.length === 1) {
      html += `<a href="${regionData.dirUrl}/${parts[0].fileName}">${downloadText}</a>`
    }
    else {
      html += `${downloadText} ${parts.map(part => `<a href="${regionData.dirUrl}/${part.fileName}">part ${part.index}</a>`).join(", ")}`
    }
    html += ` (${regionData.totalSizeHuman})`
    this.container.innerHTML = html

    document.title = `Coverage of ${regionData.title}`
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