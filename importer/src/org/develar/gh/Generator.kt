package org.develar.gh

import com.graphhopper.reader.dem.MultiSourceElevationProvider
import com.graphhopper.reader.osm.GraphHopperOSM
import com.graphhopper.routing.ch.CHAlgoFactoryDecorator
import com.graphhopper.routing.util.*
import com.graphhopper.routing.util.parsers.*
import com.graphhopper.util.PMap
import com.graphhopper.util.Parameters

class Generator {
  companion object {
    @JvmStatic
    fun main(args: Array<String>) {
      val isTurnCostEnabled = System.getProperty("turn_costs")?.toBoolean() ?: false

      val graphHopper = GraphHopperOSM(null).forServer()
      graphHopper.graphHopperLocation = System.getProperty("graph.location")
      graphHopper.setSortGraph(true)

      graphHopper.dataReaderFile = System.getProperty("datareader.file")
      graphHopper.encodingManager = buildEncodingManager(isTurnCostEnabled).build()

      val elevationProvider = MultiSourceElevationProvider(System.getProperty("graph.elevation.cache_dir"))
      elevationProvider.setAutoRemoveTemporaryFiles(false)
      graphHopper.elevationProvider = elevationProvider

      val chFactoryDecorator = graphHopper.chFactoryDecorator
      chFactoryDecorator.preparationThreads = Integer.getInteger("${Parameters.CH.PREPARE}threads", 1)
      chFactoryDecorator.edgeBasedCHMode = CHAlgoFactoryDecorator.EdgeBasedCHMode.EDGE_OR_NODE
      for (profile in listOf("fastest", "shortest")) {
        chFactoryDecorator.addCHProfileAsString("$profile${if (isTurnCostEnabled) "|u_turn_costs=30" else ""}")
      }

      graphHopper.importAndClose()
    }
  }
}

private fun buildEncodingManager(isTurnCostEnabled: Boolean): EncodingManager.Builder {
  val builder = EncodingManager.Builder()
  builder.add(OSMRoadClassParser())
  builder.add(OSMRoadClassLinkParser())
  builder.add(OSMRoadEnvironmentParser())
  builder.add(OSMMaxSpeedParser())
  builder.add(OSMRoadAccessParser())

  builder.add(OSMSurfaceParser())
  builder.add(OSMGetOffBikeParser())

  builder.add(Bike2WeightFlagEncoder(PMap("")))
  builder.add(MountainBikeFlagEncoder(PMap("")))
  builder.add(RacingBikeFlagEncoder(PMap("")))
  builder.add(HikeFlagEncoder(PMap("")))

  val options = PMap("")
  if (isTurnCostEnabled) {
    options.put("turn_costs", true)
  }
  val carEncoder = CarFlagEncoder(options)
  builder.add(carEncoder)
  return builder
}