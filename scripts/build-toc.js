const path = require("path")
const fs = require("fs")
const prettyBytes = require("pretty-bytes")
const needle = require("needle");

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

  "europe-region1": "Austria, Belgium, Croatia, Czech Republic, Denmark, France, Germany, Italy, Luxembourg, Montenegro, Netherlands, Portugal, Spain, Switzerland, Slovenia",
}

const prefix = ".osm-gh.zip"

async function collectFiles(dirPath, files) {
  // ask master server, not slaves
  //noinspection JSUnresolvedVariable
  const list = (await needle("get", `51.15.221.251${dirPath}/`)).body
  for (const file of list) {
    const filePath = `${dirPath}/${file.name}`

    if (file.type === "directory") {
      await collectFiles(filePath, files)
    }
    else {
      files.push({Key: filePath, Size: file.size})
    }
  }
}

async function main() {
  const files = []
  await collectFiles("", files)
  const keyToInfo = new Map()
  for (const file of files) {
    if (!file.Key.endsWith("/")) {
      keyToInfo.set(file.Key, file)
    }
  }

  const dataFiles = files.filter(it => {
    const name = it.Key
    return name.endsWith(prefix)
  })
  dataFiles.sort((a, b) => path.posix.basename(a.Key).localeCompare(path.posix.basename(b.Key)))

  buildToC(dataFiles.filter(it => !isCarRoutingFile(it.Key)), keyToInfo, "index.md")
  buildToC(dataFiles.filter(it => isCarRoutingFile(it.Key)), keyToInfo, "car.md")
}

function isCarRoutingFile(fileName) {
  return fileName.includes("europe-region1") || fileName.includes("we-ce-europe")
}

function buildToC(files, keyToInfo, resultFileName) {
  const regionGroupToResult = new Map()
  for (const file of files) {
    const name = path.posix.basename(file.Key)
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

    const locusFile = file.Key.substring(0, file.Key.length - prefix.length) + ".locus.xml"
    if (!keyToInfo.has(locusFile)) {
      throw new Error(`Cannot find ${locusFile}`)
    }

    result += `| [${regionName}](http://d.graphhopper.develar.org${file.Key})`
    result += ` | <a href="locus-actions://http://d.graphhopper.develar.org${locusFile}">Locus</a>`
    result += ` | ${prettyBytes(file.Size)}`


    result += ` | [coverage](${getCoverageUrl(regionId)})`
    result += ` |\n`
    regionGroupToResult.set(regionScope, result)
  }

  let car = regionGroupToResult.get("europe-region1")
  regionGroupToResult.delete("europe-region1")
  replace(car, "car.md")

  const keys = Array.from(regionGroupToResult.keys()).sort()
  let result = ""
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

function getCoverageDir(regionId) {
  if (regionId.startsWith("us-") || regionId === "canada") {
    return "north-america"
  }
  if (regionId === "australia" || regionId === "new-zealand") {
    return "australia-oceania"
  }
  if (regionId === "africa" || regionId === "south-america" || regionId === "russia") {
    return ""
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
  if (regionId === "australia" || regionId === "new-zealand" || regionId === "africa" || regionId === "south-america") {
    return "Other"
  }
  // if (regionId === "denmark" || regionId === "norway" || regionId === "finland" || regionId === "sweden" || regionId === "great-britain") {
  //   return "Northern Europe"
  // }
  return "Europe"
}

main()
.catch(e => {
  console.error(e.toString())
  process.exit(1)
})