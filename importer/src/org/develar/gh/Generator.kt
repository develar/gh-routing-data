package org.develar.gh

import com.graphhopper.reader.dem.MultiSourceElevationProvider
import com.graphhopper.reader.osm.GraphHopperOSM
import com.graphhopper.routing.ch.CHAlgoFactoryDecorator.EdgeBasedCHMode
import com.graphhopper.routing.util.*
import com.graphhopper.routing.util.parsers.*
import com.graphhopper.routing.weighting.DefaultTurnCostProvider
import com.graphhopper.routing.weighting.TurnCostProvider
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

      val elevationProvider = MultiSourceElevationProvider(getElevationCacheDir())
      elevationProvider.setAutoRemoveTemporaryFiles(false)
      graphHopper.elevationProvider = elevationProvider

      val chFactoryDecorator = graphHopper.chFactoryDecorator
      chFactoryDecorator.preparationThreads = Integer.getInteger("${Parameters.CH.PREPARE}threads", 1)
      chFactoryDecorator.edgeBasedCHMode = EdgeBasedCHMode.EDGE_OR_NODE

      val uTurnCosts = 30

      val profiles = System.getenv("PROFILES")?.split(',') ?: listOf("fastest")
      chFactoryDecorator.setCHProfilesAsStrings(profiles.map {
        "$it${if (isTurnCostEnabled) "|u_turn_costs=$uTurnCosts" else ""}"
      })

      for (encoder in graphHopper.encodingManager.fetchEdgeEncoders()) {
        for (chWeightingStr in profiles) {
          val turnCostProvider = if (isTurnCostEnabled) {
            DefaultTurnCostProvider(encoder, graphHopper.graphHopperStorage.turnCostStorage, uTurnCosts)
          }
          else {
            TurnCostProvider.NO_TURN_COST_PROVIDER
          }

          val weighting = graphHopper.createWeighting(HintsMap(chWeightingStr), encoder, null, turnCostProvider)
          val profile = if (isTurnCostEnabled && encoder.supportsTurnCosts()) {
            CHProfile.edgeBased(weighting)
          }
          else {
            CHProfile.nodeBased(weighting)
          }
          chFactoryDecorator.addCHProfile(profile)
        }
      }

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
    options.put("turn_costs", true)
    builder.add(CarFlagEncoder(options))
    builder.add(MotorcycleFlagEncoder(options))
    builder.add(Car4WDFlagEncoder(options))
    builder.add(FootFlagEncoder())
  }
  else {
    val empty = PMap("")
    builder.add(Bike2WeightFlagEncoder(empty))
    builder.add(MountainBikeFlagEncoder(empty))
    builder.add(RacingBikeFlagEncoder(empty))
    builder.add(HikeFlagEncoder(empty))
    builder.add(CarFlagEncoder(empty))
  }

  return builder
}