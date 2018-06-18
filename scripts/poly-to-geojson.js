const fs = require("fs")
const path = require("path")
const helpers = require("@turf/helpers")
const dissolve = require("@turf/dissolve")

const euRegion1 = [
  "germany.poly",
  "austria.poly",
  "czech-republic.poly",
  "switzerland.poly",

  "italy.poly",
  "croatia.poly",
  "montenegro.poly",

  "france.poly",
  "luxembourg.poly",
  "belgium.poly",
  "denmark.poly",
  "netherlands.poly",
  "spain.poly",
  "portugal.poly",
  "slovenia.poly",
]

function main() {
  build(euRegion1, "europe-region1.geojson")
  build([
    "bayern.poly",
    "austria.poly",
    "czech-republic.poly",
  ], "bayern-at-cz.geojson")
}

function build(files, outFile) {
  const polyList = []
  for (const file of files) {
    const lines = fs.readFileSync(path.join(__dirname, "../poly/input", file), "utf-8").split("\n")
    // skip first line, "The first line contains the name of the file."
    const n = lines.length - 1
    for (let i = 1; i < n; i++) {
      transformLine(lines[i], polyList)
    }
  }

  const featureList = polyList.map(it => helpers.polygon([it]))

  // see https://github.com/osmcode/osmium-tool/blob/master/man/osmium-extract.md#multipolygon-file-formats
  // we must produce "GeoJSON file containing exactly one Feature of type Polygon or MultiPolygon, or a FeatureCollection with the first Feature of type Polygon or MultiPolygon. Everything except the actual geometry (of the first Feature) is ignored."

  //const result = convex(helpers.featureCollection(featureList), {concavity: 1})
  // one invocation of dissolve is not enough, second call dissolve all still undissolved polygons
  let result = dissolve(helpers.featureCollection(featureList))
  result = dissolve(result)
  if (result.type !== "FeatureCollection") {
    throw new Error("root object must be FeatureCollection")
  }
  if (result.features.length !== 1) {
    throw new Error("root object must contain the one Feature")
  }
  if (result.features.length !== 1) {
    throw new Error("root object must contain the one Feature")
  }
  fs.writeFileSync(path.join(__dirname, "../poly", outFile), JSON.stringify(result.features[0]))
}

let poly

function onPolyStart(line) {
  if (line[0] === "!") {
    throw new Error("subtract the polygon not supported")
  }

  if (poly != null) {
    throw new Error("poly not null, END was missed?")
  }

  poly = []
}

function transformLine(line, polyList) {
  if (line.length === 0) {
    return
  }

  if (line === "END") {
    const length = poly == null ? 0 : poly.length
    if (length === 0) {
      return
    }

    const firstPoint = poly[0]
    const lastPoint = poly[length - 1]
    if (length === 1 || (firstPoint[0] !== lastPoint[0] && firstPoint[1] !== lastPoint[1])) {
      // The last line of the polygon section may repeat the starting point to close the circuit
      // but we require it for simplicity
      throw new Error("first point must be equal to last")
    }

    polyList.push(poly)
    poly = null
    return
  }

  if (poly == null) {
    onPolyStart(line)
  }
  else {
    poly.push(line.trim().split(/\s+/).map(parseFloat))
  }
  return null
}

main()