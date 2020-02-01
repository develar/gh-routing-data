const path = require("path")
const fs = require("fs")
const prettyBytes = require("pretty-bytes")

const locusUrl = "https://graphhopper.develar.org/locus/2020-01-24".replace("://", "/")

const regionIdToName = {
  "us-midwest": "US Midwest",
  "us-northeast": "US Northeast",
  "us-pacific": "US Pacific",
  "us-south": "US South",
  "us-west": "US West",
  "de-at-ch": "Germany, Austria and Switzerland",
  "portugal-spain": "Portugal and Spain",
  "estonia-latvia-lithuania": "Estonia, Latvia and Lithuania",
  "finland-norway-sweden": "Finland, Norway and Sweden",
  "al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si": "Albania, Bosnia-Herzegovina, Bulgaria, Croatia, Hungary, Kosovo, Macedonia, Moldova, Montenegro, Romania, Serbia, Slovakia and Slovenia",

  "bayern-at-cz": "Bayern (Germany), Austria, Czech Republic",
  "ireland-and-northern-ireland": "Ireland and Northern Ireland",
}

const util = require("./info.js")

async function main() {
  const regions = JSON.parse(await fs.promises.readFile("./docs/locus/info.json", "utf-8"))
  const keyToInfo = new Map()
  for (const region of regions) {
    const name = region.name
    keyToInfo.set(name, region)

    let title = regionIdToName[name]
    if (title == null) {
      const index = name.indexOf("-")
      if (index > 0) {
        title = name[0].toUpperCase() + name.substring(1, index) + " " + name[index + 1].toUpperCase() + name.substring(index + 2)
      }
      else {
        title = name[0].toUpperCase() + name.substring(1)
      }
    }

    region.title = title
  }

  regions.sort((a, b) => {
    if (a.name === `al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si`) {
      return 1
    }
    if (b.name === `al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si`) {
      return -1
    }
    return a.title.localeCompare(b.title)
  })

  buildToC(regions, keyToInfo, "index.md")
}

function buildToC(regions, keyToInfo, resultFileName) {
  const regionGroupToResult = new Map()
  for (const region of regions) {
    const regionId = region.name
    const regionName = region.title

    const regionScope = util.getRegionScopeName(regionId)

    let result = regionGroupToResult.get(regionScope)
    if (result == null) {
      result = ""
      result += "\n"
      result += `### ${regionScope}\n`
      if (regionScope === "Europe") {
        result += `\nSee [Northern Europe](#northern-europe) below.\n\n`
      }
      result += "| Region | Install | Size | Coverage |\n"
      result += "| --- | --- | --- | --- |\n"
    }

    const locusFileName = `${regionId}.locus.xml`
    // https://ux.stackexchange.com/a/98437
    result += `| <span class="regionInfo" data-parent-dir-url="${region.dirUrl}" data-zip-urls="${region.parts.map(it => it.fileName).join(",")}">${regionName}</span>`

    region.totalSizePretty = prettyBytes(region.totalSize)

    const locusInstallUrl = `locus-actions://${locusUrl}/${locusFileName}`
    result += ` | <a href="${locusInstallUrl}">Locus</a>`
    result += ` | ${region.totalSizePretty}`
    result += ` | [coverage](${getCoverageUrlAndChangeGeoJsonIfNeed(regionId, regionName, locusInstallUrl, region)})`
    result += ` |\n`
    regionGroupToResult.set(regionScope, result)
  }

  // alphabetical order not suitable, so, list explicitly
  const keys = ["Europe", "Northern Europe", "North America", "Asia", "Other"]
  let result = ""
  for (const key of keys) {
    result += regionGroupToResult.get(key)
  }

  replaceFileContent(result, resultFileName)
}

const ownCoverage = new Set(util.polyFiles.concat(["bayern-at-cz"]))

function getCoverageUrlAndChangeGeoJsonIfNeed(regionId, regionName, locusInstallUrl, region) {
  const regionCoverageId = regionId === "de-at-ch" ? "dach" : regionId
  if (!ownCoverage.has(regionCoverageId)) {
    throw new Error(`GeoJSON not provided for ${regionId}`)
  }

  const geoJsonFile = path.join(__dirname, "../docs/geojson", regionCoverageId + ".geojson")
  const geoJson = JSON.parse(fs.readFileSync(geoJsonFile, "utf8"))
  let properties = geoJson.properties
  if (properties == null || properties.locusInstall !== locusInstallUrl || properties.download == null || properties.regionName == null) {
    // https://gis.stackexchange.com/questions/25279/is-it-valid-to-have-a-properties-element-in-an-geojson-featurecollection
    // in any case we add `properties` for FeatureCollection
    if (properties == null) {
      properties = {}
      console.warn(`No properties in ${geoJsonFile}`)
      geoJson.properties = properties
    }
    properties.locusInstall = locusInstallUrl
    properties.download = {
      zipUrls: region.parts.map(it => `${region.dirUrl}/${it.fileName}`),
      totalSize: region.totalSize,
      totalSizePretty: region.totalSizePretty,
    }
    properties.regionName = regionName
    fs.writeFileSync(geoJsonFile, JSON.stringify(geoJson, null, 2))
  }

  return `/coverage.html#${regionCoverageId}`
}

function replaceFileContent(content, fileName) {
  const file = path.join(__dirname, "/../docs/" + fileName)
  const existingContent = fs.readFileSync(file, "utf8")
  const startMarker = "<!-- do not edit. start of generated block -->"
  const endMarker = "<!-- end of generated block -->"
  const start = existingContent.indexOf(startMarker)
  const end = existingContent.indexOf(endMarker)
  if (start !== -1 && end !== -1) {
    return fs.writeFileSync(file, existingContent.substring(0, start + startMarker.length) + "\n" + content + "\n" + existingContent.substring(end))
  }
  else {
    return fs.writeFileSync(file, content)
  }
}

main()
  .catch(e => {
    console.error(e.stack)
    process.exit(1)
  })