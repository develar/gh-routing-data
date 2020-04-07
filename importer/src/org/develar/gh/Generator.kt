package org.develar.gh

import com.graphhopper.config.ProfileConfig
import com.graphhopper.reader.dem.ReliableSkadiProvider
import com.graphhopper.reader.osm.GraphHopperOSM
import com.graphhopper.routing.util.*
import com.graphhopper.routing.util.parsers.*
import com.graphhopper.storage.CHProfile
import com.graphhopper.util.PMap
import com.graphhopper.util.Parameters
import java.nio.file.Paths

class Generator {
  companion object {
    @JvmStatic
    fun main(args: Array<String>) {
      val isTurnCostEnabled = System.getenv("TURN_COSTS_ENABLED")?.toBoolean() ?: false

      val graphHopper = GraphHopperOSM(null).forServer()
      graphHopper.setMinNetworkSize(200, 200)

      graphHopper.graphHopperLocation = System.getProperty("graph.location")
      if (!isTurnCostEnabled) {
        graphHopper.setSortGraph(true)
      }

      graphHopper.dataReaderFile = System.getProperty("datareader.file")
      graphHopper.encodingManager = buildEncodingManager(isTurnCostEnabled).build()

      val elevationProvider = ReliableSkadiProvider(getElevationCacheDir())
      elevationProvider.setAutoRemoveTemporaryFiles(false)
      graphHopper.elevationProvider = elevationProvider

      val chPreparationHandler = graphHopper.chPreparationHandler
      chPreparationHandler.preparationThreads = Integer.getInteger("${Parameters.CH.PREPARE}threads", 1)

      val profiles = mutableListOf<ProfileConfig>()
      for (encoder in graphHopper.encodingManager.fetchEdgeEncoders()) {
        val weightingNames = if (encoder is MountainBikeFlagEncoder || encoder is HikeFlagEncoder) listOf("shortest", "short_fastest", "fastest") else listOf("fastest")
        for (weightingName in weightingNames) {
          val profileConfig = ProfileConfig("$encoder-$weightingName")
            .setWeighting(weightingName)
            .setVehicle(encoder.toString())
            .setTurnCosts(isTurnCostEnabled)
          val weighting = graphHopper.createWeighting(profileConfig, PMap())
          val profile = if (isTurnCostEnabled && encoder.supportsTurnCosts()) {
            CHProfile.edgeBased(weighting)
          }
          else {
            CHProfile.nodeBased(weighting)
          }
          profiles.add(profileConfig)
          chPreparationHandler.addCHProfile(profile)
        }
      }

      graphHopper.profiles = profiles
      graphHopper.importAndClose()
    }
  }
}

private fun getElevationCacheDir(): String {
  return System.getProperty("graph.elevation.cache_dir")
    ?: Paths.get("${System.getenv("MAP_DIR")}/../elevation").toAbsolutePath().toString()
}

private fun buildEncodingManager(isTurnCostEnabled: Boolean): EncodingManager.Builder {
  val builder = EncodingManager.Builder()
  builder.add(OSMRoadClassParser())
  builder.add(OSMRoadClassLinkParser())
  builder.add(OSMRoadEnvironmentParser())
  builder.add(OSMMaxSpeedParser())
  builder.add(OSMRoadAccessParser())

  builder.add(OSMSurfaceParser())

  if (isTurnCostEnabled) {
    builder.add(OSMTollParser())
    builder.add(OSMMaxWeightParser())
    builder.add(OSMMaxHeightParser())
    builder.add(OSMMaxWidthParser())
    builder.add(OSMMaxAxleLoadParser())
    builder.add(OSMTrackTypeParser())

    builder.add(OSMHazmatParser())
    builder.add(OSMHazmatTunnelParser())
    builder.add(OSMHazmatWaterParser())
  }

  if (isTurnCostEnabled) {
    val options = PMap("")
    options.putObject(Parameters.Routing.TURN_COSTS, true)
    builder.add(CarFlagEncoder(options))
    builder.add(MotorcycleFlagEncoder(options))
    builder.add(Car4WDFlagEncoder(options))
    builder.add(FootFlagEncoder())
  }
  else {
    val empty = PMap()
    builder.add(Bike2WeightFlagEncoder(empty))
    builder.add(MountainBikeFlagEncoder(empty))
    builder.add(RacingBikeFlagEncoder(empty))
    builder.add(HikeFlagEncoder(empty))
    builder.add(CarFlagEncoder(empty))
  }

  return builder
}