package org.develar.gh

import com.graphhopper.GraphHopper
import com.graphhopper.storage.RAMDirectory
import com.graphhopper.storage.StorableProperties

class Routing {
  companion object {
    @JvmStatic
    fun main(args: Array<String>) {
      val gh = GraphHopper().forMobile()
      gh.isAllowWrites = false
      //val ghDataDir = "/Volumes/data/Downloads/austria.osm-gh"
      val ghDataDir = "/Volumes/data/maps/de-at-ch.osm-gh"
      val dir = RAMDirectory(ghDataDir, true)
      val properties = StorableProperties(dir)
      if (!properties.loadExisting()) {
        throw IllegalStateException("Cannot load properties at: ${dir.location}")
      }

      gh.isCHEnabled = (properties.get("prepare.ch.done") == "true")
      gh.setElevation(properties.get("prepare.elevation_interpolation.done") == "true")

      gh.load(ghDataDir)
    }
  }
}