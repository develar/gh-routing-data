package com.graphhopper.reader.dem

import java.io.File

class ReliableSkadiProvider(elevationCacheDir: String) : SkadiProvider(elevationCacheDir) {
  //private val fileMap = Collections.newSetFromMap(ConcurrentHashMap<File, Boolean>())

  override fun readFile(file: File?): ByteArray {
    try {
      return super.readFile(file)
    }
    catch (e: Exception) {
      throw RuntimeException("Cannot process $file", e)
    }
  }
}