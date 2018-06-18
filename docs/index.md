Routing data for [GraphHopper](https://www.graphhopper.com) for offline navigation in the best outdoor navigation app [Locus Map](http://www.locusmap.eu).

File [issue](https://github.com/develar/gh-routing-data/issues) if routing data not provided for wanted country or region.

!!! tip "Cross border navigation"
    As GraphHopper doesn't support [multiple](https://github.com/graphhopper/graphhopper/issues/293) files, if you need to cross borders, please use special region wide routing data (e.g. Alps).

## Installation

Click a "Locus" link to install on Locus (will be automatically downloaded and extracted to `mapsVector/`). In the [GraphHopper Add-on](https://github.com/asamm/locus-addon-graphhopper/releases/latest) choose which file you want to use.

## Maps

!!! question "Which vehicles are supported?"
    * pedestrian or walking with priority for more beautiful hiking tours (`hike`).
    * trekking bike avoiding hills (`bike2`),
    * mountain bike (`mtb`),
    * racing bike (`racingbike`),
    
    Routing data for car [provided separately](./car). Foot routing not supported to reduce size of graph (please use `hike` instead).
    
??? question "How often data is updated?"
    At least monthly. 
    File [issue](https://github.com/develar/gh-routing-data/issues) to force update if need. 
    Also, data can be updated once a new version of GraphHopper is released.
    
Last update: 10.06.2018.

<!-- do not edit. start of generated block -->

### Europe
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| [Albania, Bosnia-Herzegovina, Bulgaria, Croatia, Hungary, Kosovo, Macedonia, Moldova, Montenegro, Romania, Serbia, Slovakia and Slovenia](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si.locus.xml">Locus</a> | 856 MB | [coverage](http://umap.openstreetmap.fr/en/map/al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si-coverage_227665) |
| [Alps](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/alps.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/alps.locus.xml">Locus</a> | 1.61 GB | [coverage](https://umap.openstreetmap.fr/en/map/alps-coverage_227659) |
| [Bayern (Germany), Austria, Czech Republic](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-18/bayern-at-cz.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-18/bayern-at-cz.locus.xml">Locus</a> | 1.15 GB | [coverage](https://download.geofabrik.de/europe/bayern-at-cz.html) |
| [Belgium](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/belgium.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/belgium.locus.xml">Locus</a> | 208 MB | [coverage](https://download.geofabrik.de/europe/belgium.html) |
| [Czech Republic](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/czech-republic.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/czech-republic.locus.xml">Locus</a> | 256 MB | [coverage](https://download.geofabrik.de/europe/czech-republic.html) |
| [Germany, Austria and Switzerland](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-18/de-at-ch.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-18/de-at-ch.locus.xml">Locus</a> | 3.14 GB | [coverage](https://download.geofabrik.de/europe/dach.html) |
| [Denmark](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/denmark.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/denmark.locus.xml">Locus</a> | 190 MB | [coverage](https://download.geofabrik.de/europe/denmark.html) |
| [Estonia, Latvia and Lithuania](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/estonia-latvia-lithuania.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/estonia-latvia-lithuania.locus.xml">Locus</a> | 157 MB | [coverage](https://umap.openstreetmap.fr/en/map/estonia-latvia-and-lithuania-coverage_227645#7/57.074/24.439) |
| [Finland, Norway and Sweden](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/finland-norway-sweden.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/finland-norway-sweden.locus.xml">Locus</a> | 810 MB | [coverage](https://umap.openstreetmap.fr/en/map/finland-norway-and-sweden_227901) |
| [Finland](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/finland.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/finland.locus.xml">Locus</a> | 282 MB | [coverage](https://download.geofabrik.de/europe/finland.html) |
| [France](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/france.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/france.locus.xml">Locus</a> | 1.84 GB | [coverage](https://download.geofabrik.de/europe/france.html) |
| [Great Britain](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/great-britain.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/great-britain.locus.xml">Locus</a> | 898 MB | [coverage](https://download.geofabrik.de/europe/great-britain.html) |
| [Greece](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/greece.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/greece.locus.xml">Locus</a> | 255 MB | [coverage](https://download.geofabrik.de/europe/greece.html) |
| [Italy](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-11/italy.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-11/italy.locus.xml">Locus</a> | 1.05 GB | [coverage](https://download.geofabrik.de/europe/italy.html) |
| [Netherlands](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/netherlands.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/netherlands.locus.xml">Locus</a> | 339 MB | [coverage](https://download.geofabrik.de/europe/netherlands.html) |
| [Poland](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/poland.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/poland.locus.xml">Locus</a> | 731 MB | [coverage](https://download.geofabrik.de/europe/poland.html) |
| [Portugal and Spain](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/portugal-spain.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/portugal-spain.locus.xml">Locus</a> | 1.24 GB | [coverage](https://umap.openstreetmap.fr/en/map/portugal-and-spain_227651#5/38.400/-10.091) |
| [Russia](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/russia.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/russia.locus.xml">Locus</a> | 1.57 GB | [coverage](https://download.geofabrik.de/russia.html) |
| [Ukraine](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/ukraine.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/ukraine.locus.xml">Locus</a> | 405 MB | [coverage](https://download.geofabrik.de/europe/ukraine.html) |

### North America
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| [Canada](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/canada.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/canada.locus.xml">Locus</a> | 562 MB | [coverage](https://download.geofabrik.de/north-america/canada.html) |
| [US Midwest](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-midwest.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-midwest.locus.xml">Locus</a> | 1.43 GB | [coverage](https://download.geofabrik.de/north-america/us-midwest.html) |
| [US Northeast](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-northeast.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-northeast.locus.xml">Locus</a> | 687 MB | [coverage](https://download.geofabrik.de/north-america/us-northeast.html) |
| [US Pacific](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-pacific.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-pacific.locus.xml">Locus</a> | 21.5 MB | [coverage](https://download.geofabrik.de/north-america/us-pacific.html) |
| [US South](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-south.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-south.locus.xml">Locus</a> | 2.16 GB | [coverage](https://download.geofabrik.de/north-america/us-south.html) |
| [US West](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-west.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/us-west.locus.xml">Locus</a> | 1.49 GB | [coverage](https://download.geofabrik.de/north-america/us-west.html) |

### Other
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| [Africa](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/africa.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/africa.locus.xml">Locus</a> | 2.67 GB | [coverage](https://download.geofabrik.de/africa.html) |
| [Australia](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/australia.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-13/australia.locus.xml">Locus</a> | 456 MB | [coverage](https://download.geofabrik.de/australia-oceania/australia.html) |
| [New Zealand](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/new-zealand.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/new-zealand.locus.xml">Locus</a> | 63.6 MB | [coverage](https://download.geofabrik.de/australia-oceania/new-zealand.html) |
| [South America](https://s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/south-america.osm-gh.zip) | <a href="locus-actions://https/s3.eu-central-1.amazonaws.com/gh-routing-data/2018-06-14/south-america.locus.xml">Locus</a> | 2.36 GB | [coverage](https://download.geofabrik.de/south-america.html) |

<!-- end of generated block -->