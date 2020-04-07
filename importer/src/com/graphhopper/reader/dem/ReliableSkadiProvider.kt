package com.graphhopper.reader.dem

import com.github.luben.zstd.ZstdInputStream
import com.graphhopper.storage.DAType
import com.graphhopper.storage.DataAccess
import com.graphhopper.storage.Directory
import com.graphhopper.storage.GHDirectory
import java.io.File
import java.io.IOException
import java.nio.file.*

class ReliableSkadiProvider(elevationCacheDir: String) : SkadiProvider(elevationCacheDir) {
  override fun readFile(file: File?): ByteArray {
    try {
      return super.readFile(file)
    }
    catch (e: Exception) {
      throw RuntimeException("Cannot process $file", e)
    }
  }

  override fun getDirectory(): Directory {
    var result = dir
    if (result != null) {
      return result
    }

    logger.info("$this Elevation Provider, from: $baseUrl, to: $cacheDir, as: $daType using interpolate: $interpolate")
    result = CompressedDirectory(cacheDir.toPath(), daType)
    dir = result
    return result
  }
}

// compress: zstd -3 --rm dem*
// and then:
// move: find . -maxdepth 1 -name '*.zst' | xargs gmv --target-directory=compressed
private class CompressedDirectory(private val cacheDir: Path, defaultType: DAType) : GHDirectory(cacheDir.toAbsolutePath().toString(), defaultType) {
  private val parentCompressed = cacheDir.resolve("compressed")

  override fun find(name: String, type: DAType): DataAccess {
    if (!map.containsKey(name)) {
      unpack(name)
    }
    return super.find(name, type)
  }

  private fun unpack(name: String) {
    val zstFile = parentCompressed.resolve("$name.zst")
    // if another process started to unpack the same file
    val tempFile = cacheDir.resolve("tmp_${name}_${System.nanoTime().toString(32)}")
    try {
      val output = Files.newOutputStream(tempFile)
      ZstdInputStream(Files.newInputStream(zstFile)).use { input ->
        output.use {
          input.copyTo(output, bufferSize = 64 * 1024)
        }
      }
    }
    catch (e: NoSuchFileException) {
    }

    val file = cacheDir.resolve(name)
    try {
      move(tempFile, file)
    }
    catch (ignore: FileAlreadyExistsException) {
      try {
        Files.delete(tempFile)
      }
      catch (ignore: IOException) {
      }
    }
  }

  private fun move(from: Path, to: Path) {
    try {
      Files.move(from, to, StandardCopyOption.ATOMIC_MOVE)
    }
    catch (e: AtomicMoveNotSupportedException) {
      Files.move(from, to)
    }
  }
}