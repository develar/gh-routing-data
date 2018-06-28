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

  "europe-region1": "Austria, Belgium, Croatia, Czech Republic, Denmark, France, Germany, Italy, Luxembourg, Montenegro, Netherlands, Portugal, Spain, Switzerland, Slovenia",
}

const prefix = ".osm-gh.zip"
const bucketName = "gh-data"

function collectFiles() {
  // remove duplicates - later (several days) old items will be removed (cannot be remove on upload a new because old item can be downloaded at this moment)
  const nameToInfo = new Map()

  // funny, but mc find much faster than mc stat
  child_process.execFileSync("mc", ["find", `${bucketName}/${bucketName}`, "--json"], {encoding: "utf-8"})
    .trim()
    .split("\n")
    .map(it => {
      const info = JSON.parse(it)
      const key = info.key.substring((bucketName.length * 2) + 1)
      const name = path.posix.basename(key)

      if (name.includes("-part2")) {
        const firstPartInfo = nameToInfo.get(name.replace("-part2", ""))
        firstPartInfo.size = firstPartInfo.size + info.size
        return null
      }

      info.key = key
      info.lastModified = Date.parse(info.lastModified)

      const mapKey = name.replace("-part1", "")
      const existingInfo = nameToInfo.get(mapKey)
      if (existingInfo === undefined || info.lastModified > existingInfo.lastModified) {
        nameToInfo.set(mapKey, info)
      }
      else {
        return null
      }

      return info
    })

  return Array.from(nameToInfo.values())
}

async function main() {
  const files = collectFiles()
  const keyToInfo = new Map()
  for (const file of files) {
    if (!file.key.endsWith("/")) {
      keyToInfo.set(file.key, file)
    }
  }

  const dataFiles = files.filter(it => {
    const name = it.key
    return name.endsWith(prefix)
  })
  dataFiles.sort((a, b) => path.posix.basename(a.key).localeCompare(path.posix.basename(b.key)))

  buildToC(dataFiles.filter(it => !isCarRoutingFile(it.key)), keyToInfo, "index.md")
  buildToC(dataFiles.filter(it => isCarRoutingFile(it.key)), keyToInfo, "car.md")
}

function isCarRoutingFile(fileName) {
  return fileName.includes("europe-region1") || fileName.includes("we-ce-europe")
}

function buildToC(files, keyToInfo, resultFileName) {
  const regionGroupToResult = new Map()
  for (const file of files) {
    let name = path.posix.basename(file.key)
    name = name.replace("-part1", "")

    let regionId = name.substring(0, name.length - prefix.length)
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

    const regionScope = getRegionScopeName(regionId)

    let result = regionGroupToResult.get(regionScope)
    if (result == null) {
      result = ""
      result += "\n"
      result += `### ${regionScope}\n`
      result += "| Region | Install | Size | Coverage |\n"
      result += "| --- | --- | --- | --- |\n"
    }

    const locusFile = path.dirname(file.key) + "/" + regionId + ".locus.xml"
    if (!keyToInfo.has(locusFile)) {
      throw new Error(`Cannot find ${locusFile}`)
    }

    if (file.key.includes("-part1")) {
      result += `| ${regionName}`
    }
    else {
      result += `| [${regionName}](http://d.graphhopper.develar.org${file.key})`
    }
    result += ` | <a href="locus-actions://http/d.graphhopper.develar.org${locusFile}">Locus</a>`
    result += ` | ${prettyBytes(file.size)}`


    result += ` | [coverage](${getCoverageUrl(regionId)})`
    result += ` |\n`
    regionGroupToResult.set(regionScope, result)
  }

  let car = regionGroupToResult.get("europe-region1")
  regionGroupToResult.delete("europe-region1")
  replace(car, "car.md")

  // alphabetical order not suitable, so, list explicitly
  const keys = ["Europe", "North America", "Asia", "Other"]
  let result = ""
  // must be first
  for (const key of keys) {
    result += regionGroupToResult.get(key)
  }

  replace(result, resultFileName)
}

function getCoverageUrl(regionId) {
  if (regionId === "estonia-latvia-lithuania") {
    return "https://umap.openstreetmap.fr/en/map/estonia-latvia-and-lithuania-coverage_227645#7/57.074/24.439"
  }
  if (regionId === "portugal-spain") {
    return "https://umap.openstreetmap.fr/en/map/portugal-and-spain_227651#5/38.400/-10.091"
  }
  if (regionId === "alps") {
    return "https://umap.openstreetmap.fr/en/map/alps-coverage_227659"
  }
  if (regionId === "finland-norway-sweden") {
    return "https://umap.openstreetmap.fr/en/map/finland-norway-and-sweden_227901"
  }
  if (regionId === "al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si") {
    return "http://umap.openstreetmap.fr/en/map/al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si-coverage_227665"
  }
  if (regionId === "europe-region1") {
    return "https://umap.openstreetmap.fr/en/map/europe-region-1-coverage_228183"
  }

  let coveragePage = getCoverageDir(regionId)
  if (coveragePage.length > 0) {
    coveragePage += "/"
  }
  coveragePage += regionId === "de-at-ch" ? "dach" : regionId
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

const asiaRegions = ["japan", "india", "china", "indonesia", "thailand"]

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
  if (asiaRegions.includes(regionId)) {
    return "asia"
  }
  if (regionId === "europe-region1") {
    return "car"
  }
  return "europe"
}

function getRegionScopeName(regionId) {
  if (regionId.startsWith("us-") || regionId === "canada") {
    return "North America"
  }
  if (regionId === "australia" || regionId === "new-zealand" || regionId === "africa" || regionId === "south-america" || regionId === "brazil" || regionId === "central-america") {
    return "Other"
  }
  if (asiaRegions.includes(regionId)) {
    return "Asia"
  }
  // if (regionId === "denmark" || regionId === "norway" || regionId === "finland" || regionId === "sweden" || regionId === "great-britain") {
  //   return "Northern Europe"
  // }
  return "Europe"
}

main()
  .catch(e => {
    console.error(e.stack)
    process.exit(1)
  })