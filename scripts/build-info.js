const path = require("path")
const s3Util = require(__dirname + "/bucket.js")
const prettyBytes = require("pretty-bytes")

const regionIdToName = {
  "us-midwest": "US Midwest",
  "us-northeast": "US Northeast",
  "us-pacific": "US pacific",
  "us-south": "US South",
  "us-west": "US West",
  "de-at-ch": "Germany, Austria and Switzerland",
  "czech-republic": "Czech Republic",
  "south-america": "South America",
}

async function main() {
  const bucket = new s3Util({
                                 bucketName: "gh-routing-data",
                               })
  const files = await bucket.listFiles({})
  const keyToInfo = new Map()
  for (const file of files) {
    if (!file.Key.endsWith("/")) {
      keyToInfo.set(file.Key, file)
    }
  }

  const prefix = ".osm-gh.zip"
  const regionGroupToResult = new Map()
  for (const file of files) {
    if (!file.Key.endsWith(prefix)) {
      continue
    }

    const name = path.posix.basename(file.Key)
    const regionId = name.substring(0, name.length - prefix.length)

    let regionName = regionIdToName[regionId]
    if (regionName == null) {
      regionName = regionId[0].toUpperCase() + regionId.substring(1)
    }

    const regionScope = getRegionScopeName(regionId)

    let result = regionGroupToResult.get(regionScope)
    if (result == null) {
      result = ""
      result += "\n"
      result += `## ${regionScope}\n`
      result += "| Region | Install | Size | Coverage |\n"
      result += "| --- | --- | --- | --- |\n"
    }

    const locusFile = file.Key.substring(0, file.Key.length - prefix.length) + ".locus.xml"
    if (!keyToInfo.has(locusFile)) {
      throw new Error(`Cannot find ${locusFile}`)
    }

    result += `| [${regionName}](https://s3.eu-central-1.amazonaws.com/gh-routing-data/${file.Key})`
    result += ` | [Locus](locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/${locusFile})`
    result += ` | ${prettyBytes(file.Size)}`

    let coveragePage = getCoverageDir(regionId)
    if (coveragePage.length > 0) {
      coveragePage += "/"
    }
    coveragePage += regionId === "de-at-ch" ? "dach" : regionId
    result += ` | [coverage](https://download.geofabrik.de/${coveragePage}.html)`
    result += ` |\n`
    regionGroupToResult.set(regionScope, result)
  }

  const keys = Array.from(regionGroupToResult.keys()).sort()
  let result = ""
  for (const key of keys) {
    result += regionGroupToResult.get(key)
  }

  // console.log(files)

  console.log(result)
}

function getCoverageDir(regionId) {
  if (regionId.startsWith("us-") || regionId === "canada") {
    return "north-america"
  }
  if (regionId === "australia" || regionId === "new-zealand") {
    return "australia-oceania"
  }
  if (regionId === "africa" || regionId === "south-america") {
    return ""
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
  return "Europe"
}

main()
.catch(e => {
  console.error(e.toString())
  process.exit(1)
})