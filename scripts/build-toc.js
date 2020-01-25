const path = require("path")
const fs = require("fs")
const prettyBytes = require("pretty-bytes")
const execFileSync = require("child_process").execFileSync

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

const suffix = ".osm-gh.zip"
const util = require("./info.js")
const rootUrlWithoutProtocol = util.rootUrlWithoutProtocol

function commonCurlArgs() {
  return [
    "--silent",
    "--show-error",
    // to exclude from access log
    "-A", "GhRoutingData",
  ]
}

function collectFiles(locusFileToInfo) {
  // remove duplicates - later (several days) old items will be removed (cannot be remove on upload a new because old item can be downloaded at this moment)
  const nameToInfo = new Map()

  function collectDir(dirName) {
    // caddy output
    const parentDirUrl = `https://${rootUrlWithoutProtocol}/${dirName}`
    console.log(`Get ${parentDirUrl}`)
    const list = JSON.parse(execFileSync("curl", commonCurlArgs().concat(["-H", "Accept: application/json", `${parentDirUrl}/`]), {encoding: "utf-8"}).trim())
    for (const item of list) {
      // noinspection JSUnresolvedVariable
      if (item.IsDir) {
        continue
      }

      // noinspection JSUnresolvedVariable
      const name = item.Name

      if (!name.endsWith(suffix)) {
        if (name.endsWith(".locus.xml")) {
          // full path to check that locus file in the same dir exists
          locusFileToInfo.set(`${dirName}/${name}`, item)
        }
        continue
      }

      let mapKey = name

      item.parentDirUrl = parentDirUrl

      const match = /-part([\d{1}])/.exec(name)
      // noinspection JSValidateTypes
      if (match != null) {
        const partIndex = match[1]
        // first part will be registered, other parts not
        mapKey = name.replace(`-part${partIndex}`, "")
        if (partIndex !== "1") {
          const firstPartInfo = nameToInfo.get(mapKey)
          // noinspection JSUnresolvedVariable
          firstPartInfo.totalSize += item.Size
          firstPartInfo.parts.push(name)
          continue
        }
      }

      // noinspection JSUnresolvedVariable
      item.totalSize = item.Size
      // noinspection JSUnresolvedVariable
      item.lastModified = Date.parse(item.ModTime)

      item.parts = [name]

      item.key = `${dirName}/${mapKey}`
      item.name = mapKey
      const existingInfo = nameToInfo.get(mapKey)
      if (existingInfo === undefined || item.lastModified > existingInfo.lastModified) {
        nameToInfo.set(mapKey, item)
      }
    }
  }

  const date = "2019-01-21"
  collectDir(`${date}`)
  return Array.from(nameToInfo.values())
}

async function main() {
  const locusFileToInfo = new Map()
  const files = collectFiles(locusFileToInfo)
  const keyToInfo = new Map()
  for (const file of files) {
    keyToInfo.set(file.key, file)
  }

  files.sort((a, b) => {
    if (a.name === `al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si${suffix}`) {
      return 1
    }
    if (b.name === `al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si${suffix}`) {
      return -1
    }
    return a.name.localeCompare(b.name)
  })

  buildToC(files, keyToInfo, "index.md", locusFileToInfo)
}

function buildToC(files, keyToInfo, resultFileName, locusFileToInfo) {
  const regionGroupToResult = new Map()
  for (const info of files) {
    const name = info.name
    let regionId = name.substring(0, name.length - suffix.length)
    if (regionId === "we-ce-europe") {
      regionId = "europe-region1"
    }

    let regionName = regionIdToName[regionId]
    if (regionName == null) {
      regionName = regionId[0].toUpperCase() + regionId.substring(1)
      const index = regionName.indexOf("-")
      if (index > 0) {
        regionName = regionName.substring(0, index) + " " + regionId[index + 1].toUpperCase() + regionId.substring(index + 2)
      }
    }

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
    if (!locusFileToInfo.has(`${path.posix.dirname(info.key)}/${locusFileName}`)) {
      if (locusFileName === "austria-18-50.locus.xml") {
        continue
      }
      throw new Error(`Cannot find ${locusFileName}`)
    }

    // https://ux.stackexchange.com/a/98437
    result += `| <span class="regionInfo" data-parent-dir-url="${info.parentDirUrl}" data-zip-urls="${info.parts.join(",")}">${regionName}</span>`

    info.totalSizePretty = prettyBytes(info.totalSize)

    const locusInstallUrl = `locus-actions://${info.parentDirUrl.replace("://", "/")}/${locusFileName}`
    result += ` | <a href="${locusInstallUrl}">Locus</a>`
    result += ` | ${info.totalSizePretty}`
    result += ` | [coverage](${getCoverageUrlAndChangeGeoJsonIfNeed(regionId, regionName, locusInstallUrl, info)})`
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

function getCoverageUrlAndChangeGeoJsonIfNeed(regionId, regionName, locusInstallUrl, info) {
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
      zipUrls: info.parts.map(it => `${info.parentDirUrl}/${it}`),
      totalSize: info.totalSize,
      totalSizePretty: info.totalSizePretty,
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