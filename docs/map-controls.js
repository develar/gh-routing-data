// https://github.com/el/infobox-control/blob/master/dist/index.js
class MapboxInfoBoxControl {
  constructor() {
    this.controlContainer = document.createElement("div")
    this.controlContainer.classList.add("mapboxgl-ctrl")
    this.controlContainer.classList.add("mapboxgl-ctrl-group")
    this.controlContainer.classList.add("mapboxgl-ctrl-icon")
    this.controlContainer.classList.add("mapboxgl-info-box-ctrl")
  }

  getDefaultPosition() {
    return "top-left"
  }

  show(geojson) {
    this.controlContainer.style.display = "block"
    let html = ""
    if (/(android)/i.test(navigator.userAgent)) {
      html = `<a href="${geojson.properties.locusInstall}">Install on Locus</a> (android only)<br />`
    }

    const zipUrls = geojson.properties.zipUrls
    if (zipUrls.length === 1) {
      html += `<a href="${zipUrls[0]}">Download</a>`
    }
    else {
      html += `Download ${zipUrls.map((v, index) => `<a href="${v}">part ${index + 1}</a>`).join(", ")}`
    }
    this.controlContainer.innerHTML = html
  }

  onAdd(map) {
    this.controlContainer.style.display = "none"
    // map.on("mouseenter", this.layerId, () => {
    //   map.getCanvas().style.cursor = "pointer";
    // });
    // map.on("mousemove", this.layerId, (e) => {
    //   if (!e.features || !e.features.length) {
    //     return;
    //   }
    //   const [feature] = e.features;
    //   this.controlContainer.style.display = "block";
    //   this.controlContainer.innerHTML = this.formatter(feature.properties);
    // });
    // map.on("mouseleave", this.layerId, () => {
    //   map.getCanvas().style.cursor = "";
    //   this.controlContainer.style.display = "none";
    // });
    return this.controlContainer
  }

  onRemove() {
    return
  }
}

// https://github.com/el/style-switcher/blob/master/dist/index.js
class MapboxStyleSwitcherControl {
  constructor(styles) {
    this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
  }

  getDefaultPosition() {
    return "top-right";
  }

  onAdd(map) {
    this.controlContainer = document.createElement("div");
    this.controlContainer.classList.add("mapboxgl-ctrl");
    this.controlContainer.classList.add("mapboxgl-ctrl-group");
    const mapStyleContainer = document.createElement("div");
    const styleButton = document.createElement("button");
    mapStyleContainer.classList.add("mapboxgl-style-list");
    for (const style of this.styles) {
      const styleElement = document.createElement("button");
      styleElement.innerText = style.title;
      styleElement.classList.add(style.title);
      styleElement.dataset.uri = style.uri;
      styleElement.addEventListener("click", event => {
        const srcElement = event.srcElement;
        map.setStyle(srcElement.dataset.uri);
        mapStyleContainer.style.display = "none";
        styleButton.style.display = "block";
        const elms = mapStyleContainer.getElementsByClassName("active");
        while (elms[0]) {
          elms[0].classList.remove("active");
        }
        srcElement.classList.add("active");
      });
      if (style.title === MapboxStyleSwitcherControl.DEFAULT_STYLE) {
        styleElement.classList.add("active");
      }
      mapStyleContainer.appendChild(styleElement);
    }
    styleButton.classList.add("mapboxgl-ctrl-icon");
    styleButton.classList.add("mapboxgl-style-switcher");
    styleButton.addEventListener("click", () => {
      styleButton.style.display = "none";
      mapStyleContainer.style.display = "block";
    });
    document.addEventListener("click", event => {
      if (!this.controlContainer.contains(event.target)) {
        mapStyleContainer.style.display = "none";
        styleButton.style.display = "block";
      }
    });
    this.controlContainer.appendChild(styleButton);
    this.controlContainer.appendChild(mapStyleContainer);
    return this.controlContainer;
  }

  onRemove() {
    return;
  }
}

MapboxStyleSwitcherControl.DEFAULT_STYLE = "Streets";
// https://www.mapbox.com/api-documentation/#styles
MapboxStyleSwitcherControl.DEFAULT_STYLES = [
  {title: "Outdoors", uri: "mapbox://styles/mapbox/outdoors-v10"},
  {title: "Streets", uri: "mapbox://styles/mapbox/streets-v10"},
  {title: "Dark", uri: "mapbox://styles/mapbox/dark-v9"},
  {title: "Light", uri: "mapbox://styles/mapbox/light-v9"},
  {title: "Satellite", uri: "mapbox://styles/mapbox/satellite-streets-v10"},
];