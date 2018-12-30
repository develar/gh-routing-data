const northernEuropeRegions = new Set(["iceland", "great-britain", "sweden", "norway", "denmark", "ireland-and-northern-ireland"])
const asiaRegions = ["japan", "india", "china", "indonesia", "thailand"]

module.exports = {
  rootUrlWithoutProtocol: "d2.graphhopper.develar.org",
  asiaRegions,
  isUseS3: false,

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
  }
}