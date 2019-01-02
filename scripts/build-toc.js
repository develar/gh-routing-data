const path = require("path")
const fs = require("fs")
const prettyBytes = require("pretty-bytes")
const child_process = require("child_process")

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

function collectFiles(locusFileToInfo) {
  // remove duplicates - later (several days) old items will be removed (cannot be remove on upload a new because old item can be downloaded at this moment)
  const nameToInfo = new Map()

  function collectDir(dirName) {
    // caddy output
    const list = JSON.parse(child_process.execFileSync("curl", ["--silent", "--show-error", "-H", "Accept: application/json", `https://${rootUrlWithoutProtocol}/${dirName}/`], {encoding: "utf-8"}).trim())
    l: for (const item of list) {
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

      for (const index of ["2", "3"]) {
        const suffix = `-part${index}`
        if (name.includes(suffix)) {
          const firstPartInfo = nameToInfo.get(name.replace(suffix, ""))
          // noinspection JSUnresolvedVariable
          firstPartInfo.totalSize += item.Size
          firstPartInfo.hasMultipleParts = true
          continue l
        }
      }

      // noinspection JSUnresolvedVariable
      item.totalSize = item.Size
      // noinspection JSUnresolvedVariable
      item.lastModified = Date.parse(item.ModTime)

      const mapKey = name.replace("-part1", "")
      item.key = `${dirName}/${mapKey}`
      item.name = mapKey
      const existingInfo = nameToInfo.get(mapKey)
      if (existingInfo === undefined || item.lastModified > existingInfo.lastModified) {
        nameToInfo.set(mapKey, item)
      }
    }
  }

  const date = "2018-12-19"
  collectDir(`eu/${date}`)
  collectDir(`other/${date}`)
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
  for (const file of files) {
    const name = file.name
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

    const locusFile = `${path.posix.dirname(file.key)}/${regionId}.locus.xml`
    if (!locusFileToInfo.has(locusFile)) {
      throw new Error(`Cannot find ${locusFile}`)
    }

    const downloadUrl = `https://${rootUrlWithoutProtocol}/${file.key}`
    if (file.hasMultipleParts) {
      result += `| ${regionName}`
    }
    else {
      result += `| [${regionName}](${downloadUrl})`
    }

    const locusInstallUrl = `locus-actions://https/${rootUrlWithoutProtocol}/${locusFile}`
    result += ` | <a href="${locusInstallUrl}">Locus</a>`
    result += ` | ${prettyBytes(file.totalSize)}`

    result += ` | [coverage](${getCoverageUrl(regionId, locusInstallUrl, downloadUrl, file.hasMultipleParts)})`
    result += ` |\n`
    regionGroupToResult.set(regionScope, result)
  }

  // alphabetical order not suitable, so, list explicitly
  const keys = ["Europe", "Northern Europe", "North America", "Asia", "Other"]
  let result = ""
  // must be first
  for (const key of keys) {
    result += regionGroupToResult.get(key)
  }

  replace(result, resultFileName)
}

const ownCoverage = new Set(util.polyFiles.concat(["bayern-at-cz"]))

function getCoverageUrl(regionId, locusInstallUrl, downloadUrl, hasMultipleParts) {
  const regionCoverageId = regionId === "de-at-ch" ? "dach" : regionId

  if (ownCoverage.has(regionCoverageId)) {
    const geoJsonFile = path.join(__dirname, "../docs/geojson", regionCoverageId + ".geojson");
    const geoJson = JSON.parse(fs.readFileSync(geoJsonFile, "utf8"))
    if (geoJson.properties == null || geoJson.properties.locusInstall !== locusInstallUrl || geoJson.properties.zipUrls == null) {
      // https://gis.stackexchange.com/questions/25279/is-it-valid-to-have-a-properties-element-in-an-geojson-featurecollection
      // but... in any case we add `properties` for FeatureCollection
      if (geoJson.properties == null) {
        geoJson.properties = {}
      }
      geoJson.properties.locusInstall = locusInstallUrl
      geoJson.properties.zipUrls = hasMultipleParts ? Array(3).fill(downloadUrl).map((v, index) => v.replace(".osm-gh.zip", `-part${index + 1}.osm-gh.zip`)) : [downloadUrl]
      fs.writeFileSync(geoJsonFile, JSON.stringify(geoJson))
    }
    return `/coverage.html#${regionCoverageId}`
  }

  let coveragePage = getCoverageDir(regionId)
  if (coveragePage.length > 0) {
    coveragePage += "/"
  }
  coveragePage += regionCoverageId
  return `https://download.geofabrik.de/${coveragePage}.html`
}

function replace(content, fileName) {
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

function getCoverageDir(regionId) {
  if (regionId.startsWith("us-") || regionId === "canada") {
    return "north-america"
  }
  if (regionId === "australia" || regionId === "new-zealand") {
    return "australia-oceania"
  }
  if (regionId === "africa" || regionId === "south-america"  || regionId === "central-america" || regionId === "russia") {
    return ""
  }
  if (regionId === "brazil") {
    return "south-america"
  }
  if (util.asiaRegions.includes(regionId)) {
    return "asia"
  }
  if (regionId === "europe-region1") {
    return "car"
  }
  return "europe"
}

main()
  .catch(e => {
    console.error(e.stack)
    process.exit(1)
  })