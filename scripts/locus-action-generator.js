const fs = require("fs")
const path = require("path")
const child_process = require("child_process")

const patterns = ["*_bike2_node", "*_mtb_node", "*_racingbike_node"]
const patterns2 = ["*_car_node", "*_hike_node"]
const bucketName = "gh-data"
const serverAlias = "sw"
const util = require("./info.js")
const serverUrl = `https://${util.rootUrlWithoutProtocol}`

function unlinkIfExists(file) {
  try {
    fs.unlinkSync(file)
  }
  catch (ignore) {
  }
}

function statOrNull(file) {
  try {
    return fs.statSync(file)
  }
  catch (e) {
    if (e.code === "ENOENT") {
      return null
    }
    throw e
  }
}

function spawn(command, args, data) {
  process.stderr.write(`${command} ${args.join(" ")}\n`)
  return new Promise((resolve, reject) => {
    const options = data == null ? {stdio: ["ignore", process.stderr, process.stderr], cwd: mapDir} : {stdio: ["pipe", process.stdout, process.stderr], cwd: mapDir}
    if (command === "rsync") {
      // strange, but otherwise rsync fails to upload
      options.shell = true
    }
    const child = child_process.spawn(command, args, options)
    child.on("error", reject)
    child.on("close", code => {
      if (code === 0) {
        resolve()
      }
      else {
        reject(new Error(`${command} exited with code ${code}`))
      }
    })

    if (data != null) {
      child.stdin.end(data)
    }
  })
}

// if > 600 MB, compress as 3 ZIPs files (because now car is provided and africa requires at least 3 parts)
const maxFileSize = 600_000_000
const mapDir = process.env.MAP_DIR

// 7za very slow - compression ratio doesn't worth spent time (2m52.212s vs 11m16.306s)
async function main(resultName) {
  process.chdir(mapDir)

  const builder = new Builder(resultName)
  if (builder.isUseParts()) {
    await Promise.all([
      builder.archiveAndUpload(builder.getPartFileName(1), patterns),
      builder.archiveAndUpload(builder.getPartFileName(2), patterns2),
      builder.archiveAndUpload(builder.getPartFileName(3), patterns.concat(patterns2), true),
    ])
  }
  else {
    await builder.archiveAndUpload(`${builder.dirName}.zip`, null)
  }

  if (process.env.SKIP_UPLOAD != null) {
    return
  }

  let data = "<locusActions>"
  for (const file of builder.fileNames) {
    const remotePath = `${builder.remoteDir}/${file}`
    data += `<download>
<source>${escapeXml(`${serverUrl}/${remotePath}`)}</source>
<dest>/mapsVector/${escapeXml(resultName)}</dest>
<after>extract|deleteSource</after>
</download>
`
  }
  data += "</locusActions>"

  const locusFileName = `${resultName}.locus.xml`
  if (util.isUseS3) {
    await spawn("mc", ["pipe", builder.getRemotePathSpec(locusFileName)], data)
  }
  else {
    const locusFilePath = path.join(mapDir, locusFileName);
    fs.writeFileSync(locusFilePath, data)
    builder.filesToUpload.push(locusFilePath)
  }


  process.stdout.write(builder.remoteDir + "\n")
  process.stdout.write(builder.filesToUpload.join("\n"))
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '\'':
        return '&apos;'
      case '"':
        return '&quot;'
    }
  })
}

class Builder {
  constructor(resultName) {
    this.resultName = resultName
    this.dirName = `${resultName}.osm-gh`

    // const dirName = new Date().toISOString().substr(0, 10)
    // noinspection UnnecessaryLocalVariableJS
    const dirName = "2019-01-21"
    this.remoteDir = dirName

    this.fileNames = []
    this.filesToUpload = []
  }

  async archiveAndUpload(fileName, patterns, isExclude = false) {
    this.fileNames.push(fileName)

    const file = path.join(mapDir, fileName)

    if (process.env.SKIP_ZIP == null) {
      unlinkIfExists(file)

      // important to not pass absolute path to dir here to ensure that zip will contain dir name as root entry
      const args = ["-r", "-9", file, this.dirName]
      if (patterns != null) {
        args.push(isExclude ? "-x" : "-i")
        args.push(...patterns)
      }
      await spawn("zip", args)
    }

    if (process.env.SKIP_UPLOAD == null) {
      this.filesToUpload.push(file)
    }
  }

  getRemotePathSpec(file) {
    return `${serverAlias}/${bucketName}/${this.remoteDir}/${file}`
  }

  // uploadFiles() {
  //   if (util.isUseS3) {
  //     const args = ["cp"]
  //     args.push(...this.filesToUpload)
  //     args.push(this.getRemotePathSpec(this.filesToUpload.length === 1 ? path.basename(this.filesToUpload[0]) : ""))
  //     return spawn("mc", args)
  //   }
  //   else {
  //     const remoteDir = `/var/www/${this.remoteDir}`
  //     return spawn("rsync", ["--chown=caddy:caddy", "--human-readable", "--progress",
  //       `--rsync-path="sudo -u caddy mkdir -p '${remoteDir}' && rsync"`,
  //       ...this.filesToUpload,
  //       `root@[2001:bc8:4728:da09::1]:${remoteDir}/`,
  //     ])
  //   }
  // }

  getPartFileName(index) {
    return `${this.resultName}-part${index}.osm-gh.zip`
  }

  isUseParts() {
    const fileStat = statOrNull(path.join(mapDir, this.dirName, "shortcuts_fastest_bike2_node"))
    if (fileStat == null) {
      // gh data dir removed and only previously archived file exists
      return statOrNull(path.join(mapDir, this.getPartFileName(1))) != null
    }
    else {
      return fileStat.size > maxFileSize
    }
  }
}

main(process.argv[2])
  .catch(e => {
    console.error(e.stack)
    process.exit(1)
  })