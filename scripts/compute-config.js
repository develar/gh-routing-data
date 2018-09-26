const os = require("os")
const fs = require("fs")
const path = require("path")

const oneGb = 1024 * 1024 * 1024
const totalMemory = os.totalmem() - oneGb
const mapFileStat = fs.statSync(process.argv[2]).size
const threadCount = Math.max(Math.min(Math.floor(totalMemory / mapFileStat), os.cpus().length + 1), 1)

const config = `graphhopper:
  # Possible options: car,foot,bike,bike2,mtb,racingbike,motorcycle (comma separated)
  # bike2 takes elevation data into account (like up-hill is slower than down-hill) and requires enabling graph.elevation.provider below
  graph.flag_encoders: bike2,mtb,racingbike,hike
  graph.bytes_for_flags: 8

  graph.elevation.provider: multi
  graph.elevation.cache_dir: '${process.env.ELEVATION_DIR || path.join(os.homedir(), "elevation")}'

  # By default the speed mode with the 'fastest' weighting is used. Internally a graph preparation via
  # contraction hierarchies (CH) is done to speed routing up. This requires more RAM/disc space for holding the
  # graph but less for every request. You can also setup multiple weightings, by providing a comma separated list.
  prepare.ch.weightings: fastest

  # To make CH preparation faster for multiple flagEncoders you can increase the default threads if you have enough RAM.
  # Change this setting only if you know what you are doing and if the default worked for you.
  prepare.ch.threads: ${threadCount}

  # avoid being stuck in a (oneway) subnetwork, see https://discuss.graphhopper.com/t/93
  prepare.min_network_size: 200
  prepare.min_one_way_network_size: 200

  # You can limit the max distance between two consecutive waypoints of flexible routing requests to be less or equal
  # the given distance in meter. Default is set to 1000km.
  routing.non_ch.max_waypoint_distance: 1000000

  # configure the memory access, use RAM_STORE for well equipped servers (default and recommended)
  graph.dataaccess: RAM_STORE

  # Sort the graph after import to make requests roughly ~10% faster. Note that this requires significantly more RAM on import.
  graph.do_sort: true
`

fs.writeFileSync("/tmp/gh-config.yml", config)