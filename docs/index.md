# Routing data for GraphHopper

Routing data for [GraphHopper](https://www.graphhopper.com) for offline navigation. With one-click installation on the best outdoor navigation app [Locus Map](https://www.locusmap.eu).

File [issue](https://github.com/develar/gh-routing-data/issues) if routing data not provided for wanted country or region.

!!! tip "Cross border navigation"
    As GraphHopper doesn't support [multiple](https://github.com/graphhopper/graphhopper/issues/293) files, if you need to cross borders, please use special region wide routing data (e.g. Alps). Feel free to file [issue](https://github.com/develar/gh-routing-data/issues) to build a special region for your needs.

## Installation

Click a "Locus" link to install on Locus (will be automatically downloaded and extracted to `mapsVector/`).
In the [GraphHopper Add-on](https://github.com/asamm/locus-addon-graphhopper/releases/latest) choose which file you want to use.

Or simply download zip file to install manually.
As most zip libraries for Android doesn't support files more than 2GB, large regions split into 3 parts.

Click on the region name to see other download options.

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
    
    Last update: 2020-02-03.

{!regions.md!}