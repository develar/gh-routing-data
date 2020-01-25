const northernEuropeRegions = new Set(["iceland", "great-britain", "sweden", "norway", "denmark", "ireland-and-northern-ireland"])
const asiaRegions = ["japan", "india", "china", "indonesia", "thailand", "taiwan"]
const path = require("path")

module.exports = {
  rootUrlWithoutProtocol: "s3.eu-central-1.wasabisys.com/gh-routing-data",
  asiaRegions,
  isUseS3: true,

  bucketName: "gh-routing-data",
  serverAlias: "gh",

  getRegionScopeName: function (regionId) {
    if (regionId.startsWith("us-") || regionId === "canada") {
      return "North America"
    }
    if (regionId === "australia" || regionId === "new-zealand" || regionId === "africa" || regionId === "south-america" || regionId === "brazil" || regionId === "central-america") {
      return "Other"
    }
    if (asiaRegions.includes(regionId)) {
      return "Asia"
    }
    if (northernEuropeRegions.has(regionId) || regionId.startsWith("finland")) {
      return "Northern Europe"
    }
    return "Europe"
  },

  polyFiles: require("fs").readdirSync(path.join(__dirname, "../coverage/input")).filter(it => it.endsWith(".poly")).map(it => it.substring(0, it.length - ".poly".length))
}