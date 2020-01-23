# Routing data for GraphHopper

Routing data for [GraphHopper](https://www.graphhopper.com) for offline navigation. With one-click installation on the best outdoor navigation app [Locus Map](http://www.locusmap.eu).

For GraphHopper [1.0-pre18 and higher](https://github.com/asamm/locus-addon-graphhopper/pull/4).

File [issue](https://github.com/develar/gh-routing-data/issues) if routing data not provided for wanted country or region.

!!! tip "Cross border navigation"
    As GraphHopper doesn't support [multiple](https://github.com/graphhopper/graphhopper/issues/293) files, if you need to cross borders, please use special region wide routing data (e.g. Alps).

## Installation

Click a "Locus" link to install on Locus (will be automatically downloaded and extracted to `mapsVector/`).
In the [GraphHopper Add-on](https://github.com/asamm/locus-addon-graphhopper/releases/latest) choose which file you want to use.

Or simply download zip file to install manually.
As most zip libraries for Android doesn't support files more than 2GB, large regions split into 3 parts.

## Maps

!!! question "Which vehicles are supported?"
    * pedestrian or walking with priority for more beautiful hiking tours (`hike`),
    * trekking bike avoiding hills (`bike2`),
    * mountain bike,
    * racing bike,
    * car.
    
    Foot routing not supported to reduce size of graph (please use `hike` instead).
    
??? question "How often data is updated?"
    At least monthly. 
    File [issue](https://github.com/develar/gh-routing-data/issues) to force update if need. 
    Also, data can be updated once a new version of GraphHopper is released.
    
Last update: 2019-01-21.

<!-- do not edit. start of generated block -->

### Europe

See [Northern Europe](#northern-europe) below.

| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="alps.osm-gh.zip">Alps</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/alps.locus.xml">Locus</a> | 1.69 GB | [coverage](/coverage.html#alps) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="austria.osm-gh.zip">Austria</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/austria.locus.xml">Locus</a> | 402 MB | [coverage](/coverage.html#austria) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="bayern-at-cz.osm-gh.zip">Bayern (Germany), Austria, Czech Republic</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/bayern-at-cz.locus.xml">Locus</a> | 1.18 GB | [coverage](/coverage.html#bayern-at-cz) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="belgium.osm-gh.zip">Belgium</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/belgium.locus.xml">Locus</a> | 215 MB | [coverage](/coverage.html#belgium) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="czech-republic.osm-gh.zip">Czech Republic</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/czech-republic.locus.xml">Locus</a> | 272 MB | [coverage](/coverage.html#czech-republic) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="de-at-ch-part1.osm-gh.zip,de-at-ch-part2.osm-gh.zip,de-at-ch-part3.osm-gh.zip">Germany, Austria and Switzerland</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/de-at-ch.locus.xml">Locus</a> | 3.18 GB | [coverage](/coverage.html#dach) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="estonia-latvia-lithuania.osm-gh.zip">Estonia, Latvia and Lithuania</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/estonia-latvia-lithuania.locus.xml">Locus</a> | 173 MB | [coverage](/coverage.html#estonia-latvia-lithuania) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="france.osm-gh.zip">France</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/france.locus.xml">Locus</a> | 2 GB | [coverage](/coverage.html#france) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="germany-part1.osm-gh.zip,germany-part2.osm-gh.zip,germany-part3.osm-gh.zip">Germany</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/germany.locus.xml">Locus</a> | 2.52 GB | [coverage](/coverage.html#germany) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="greece.osm-gh.zip">Greece</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/greece.locus.xml">Locus</a> | 279 MB | [coverage](/coverage.html#greece) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="italy.osm-gh.zip">Italy</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/italy.locus.xml">Locus</a> | 1.15 GB | [coverage](/coverage.html#italy) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="netherlands.osm-gh.zip">Netherlands</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/netherlands.locus.xml">Locus</a> | 371 MB | [coverage](/coverage.html#netherlands) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="poland.osm-gh.zip">Poland</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/poland.locus.xml">Locus</a> | 814 MB | [coverage](/coverage.html#poland) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="portugal-spain.osm-gh.zip">Portugal and Spain</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/portugal-spain.locus.xml">Locus</a> | 1.39 GB | [coverage](/coverage.html#portugal-spain) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="russia.osm-gh.zip">Russia</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/russia.locus.xml">Locus</a> | 1.79 GB | [coverage](/coverage.html#russia) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="switzerland.osm-gh.zip">Switzerland</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/switzerland.locus.xml">Locus</a> | 265 MB | [coverage](/coverage.html#switzerland) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="turkey.osm-gh.zip">Turkey</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/turkey.locus.xml">Locus</a> | 562 MB | [coverage](/coverage.html#turkey) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="ukraine.osm-gh.zip">Ukraine</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/ukraine.locus.xml">Locus</a> | 472 MB | [coverage](/coverage.html#ukraine) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si.osm-gh.zip">Albania, Bosnia-Herzegovina, Bulgaria, Croatia, Hungary, Kosovo, Macedonia, Moldova, Montenegro, Romania, Serbia, Slovakia and Slovenia</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si.locus.xml">Locus</a> | 1.01 GB | [coverage](/coverage.html#al-ba-bg-hr-hu-xk-mk-md-me-ro-rs-sk-si) |

### Northern Europe
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="denmark.osm-gh.zip">Denmark</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/denmark.locus.xml">Locus</a> | 209 MB | [coverage](/coverage.html#denmark) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="finland-norway-sweden.osm-gh.zip">Finland, Norway and Sweden</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/finland-norway-sweden.locus.xml">Locus</a> | 940 MB | [coverage](/coverage.html#finland-norway-sweden) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="finland.osm-gh.zip">Finland</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/finland.locus.xml">Locus</a> | 315 MB | [coverage](/coverage.html#finland) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="great-britain.osm-gh.zip">Great Britain</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/great-britain.locus.xml">Locus</a> | 996 MB | [coverage](/coverage.html#great-britain) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="iceland.osm-gh.zip">Iceland</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/iceland.locus.xml">Locus</a> | 21.3 MB | [coverage](/coverage.html#iceland) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="ireland-and-northern-ireland.osm-gh.zip">Ireland and Northern Ireland</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/ireland-and-northern-ireland.locus.xml">Locus</a> | 144 MB | [coverage](/coverage.html#ireland-and-northern-ireland) |

### North America
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="canada.osm-gh.zip">Canada</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/canada.locus.xml">Locus</a> | 627 MB | [coverage](/coverage.html#canada) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="us-midwest.osm-gh.zip">US Midwest</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/us-midwest.locus.xml">Locus</a> | 1.64 GB | [coverage](/coverage.html#us-midwest) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="us-northeast.osm-gh.zip">US Northeast</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/us-northeast.locus.xml">Locus</a> | 801 MB | [coverage](/coverage.html#us-northeast) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="us-pacific.osm-gh.zip">US Pacific</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/us-pacific.locus.xml">Locus</a> | 25.2 MB | [coverage](/coverage.html#us-pacific) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="us-south-part1.osm-gh.zip,us-south-part2.osm-gh.zip,us-south-part3.osm-gh.zip">US South</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/us-south.locus.xml">Locus</a> | 2.49 GB | [coverage](/coverage.html#us-south) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="us-west.osm-gh.zip">US West</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/us-west.locus.xml">Locus</a> | 1.67 GB | [coverage](/coverage.html#us-west) |

### Asia
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="china.osm-gh.zip">China</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/china.locus.xml">Locus</a> | 1.03 GB | [coverage](/coverage.html#china) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="india.osm-gh.zip">India</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/india.locus.xml">Locus</a> | 973 MB | [coverage](/coverage.html#india) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="indonesia.osm-gh.zip">Indonesia</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/indonesia.locus.xml">Locus</a> | 951 MB | [coverage](/coverage.html#indonesia) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="japan-part1.osm-gh.zip,japan-part2.osm-gh.zip,japan-part3.osm-gh.zip">Japan</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/japan.locus.xml">Locus</a> | 2.03 GB | [coverage](/coverage.html#japan) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="taiwan.osm-gh.zip">Taiwan</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/taiwan.locus.xml">Locus</a> | 134 MB | [coverage](/coverage.html#taiwan) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="thailand.osm-gh.zip">Thailand</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/thailand.locus.xml">Locus</a> | 462 MB | [coverage](/coverage.html#thailand) |

### Other
| Region | Install | Size | Coverage |
| --- | --- | --- | --- |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="africa-part1.osm-gh.zip,africa-part2.osm-gh.zip,africa-part3.osm-gh.zip">Africa</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/africa.locus.xml">Locus</a> | 4.34 GB | [coverage](/coverage.html#africa) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="australia.osm-gh.zip">Australia</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/australia.locus.xml">Locus</a> | 537 MB | [coverage](/coverage.html#australia) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="brazil.osm-gh.zip">Brazil</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/brazil.locus.xml">Locus</a> | 1.49 GB | [coverage](/coverage.html#brazil) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="central-america.osm-gh.zip">Central America</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/central-america.locus.xml">Locus</a> | 362 MB | [coverage](/coverage.html#central-america) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="new-zealand.osm-gh.zip">New Zealand</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/new-zealand.locus.xml">Locus</a> | 79 MB | [coverage](/coverage.html#new-zealand) |
| <span class="regionInfo" data-parent-dir-url="https://d.graphhopper.develar.org/2019-01-21" data-zip-urls="south-america-part1.osm-gh.zip,south-america-part2.osm-gh.zip,south-america-part3.osm-gh.zip">South America</span> | <a href="locus-actions://https/d.graphhopper.develar.org/2019-01-21/south-america.locus.xml">Locus</a> | 2.83 GB | [coverage](/coverage.html#south-america) |

<!-- end of generated block -->