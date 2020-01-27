package org.develar.gh

import com.graphhopper.GraphHopper
import com.graphhopper.routing.util.DefaultFlagEncoderFactory
import com.graphhopper.routing.util.EncodingManager
import com.graphhopper.storage.RAMDirectory
import com.graphhopper.storage.StorableProperties

class Routing {
  companion object {
    @JvmStatic
    fun main(args: Array<String>) {
      val gh = GraphHopper().forMobile()
      gh.isAllowWrites = false
      //val ghDataDir = "/Volumes/data/Downloads/austria.osm-gh"
      val ghDataDir = "/Volumes/data/Downloads/austria.osm-gh 2"
      val dir = RAMDirectory(ghDataDir, true)
      val properties = StorableProperties(dir)
      if (!properties.loadExisting()) {
        throw IllegalStateException("Cannot load properties to fetch EncodingManager configuration at: ${dir.location}")
      }

      val builder = EncodingManager.Builder()
      properties.get("graph.encoded_values")?.let {
        builder.addAll(gh.encodedValueFactory, it)
      }
      // GraphHopper doesn't expose flagEncoderFactory, but it is - stateless DefaultFlagEncoderFactory is used.
      properties.get("graph.flag_encoders")?.let {
        builder.addAll(DefaultFlagEncoderFactory(), it)
      }

      gh.encodingManager = builder.build()

      gh.isCHEnabled = (properties.get("prepare.ch.done") == "true")
      gh.setElevation(properties.get("prepare.elevation_interpolation.done") == "true")

      gh.load(ghDataDir)
    }
  }
}