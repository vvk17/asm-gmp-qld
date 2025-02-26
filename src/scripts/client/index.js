import '../../css/style.css';
import 'leaflet-search';
import 'leaflet.markercluster';
import L from 'leaflet';
import {
    Loading
} from 'carbon-components';

import loadMapLocations from './loadMapLocations';
import createClusterGroup from './createClusterGroup';
import createSearchControl from './createSearchControl';
import processUrlOptions from './processUrlOptions';
import { createMarkerType } from './createMarkerType';
import { createBoundaryType } from './createBoundaryType';
import { createLinkType } from './createLinkType';
import addWeatherLayers from './addWeatherLayers';

(function() {
    const configParams = processUrlOptions();
    // Pull the map tiles from wikimedia
/*    var wikimedia = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}@2x.png', {
        attribution: 'Wikimedia maps beta | &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        maxClusterRadius: 120
    });
*/
    var openStreetMapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
        maxClusterRadius: 120
    });

    var map = L.map('map', {
        center: [ -23.3787, 150.5089],
        zoom: 11,
        layers: [openStreetMapLayer]
    });

    // Create marker groups for each location type
    const markerTypes = {};
    configParams.locationTypes.forEach( type => {
        markerTypes[type] = createMarkerType(type);
    })

    // Create boundary groups for each geoBoundary type
    const boundaryTypes = {};
    if (!configParams.hideGeoBoundary) {
        configParams.geoBoundaryTypes.forEach( type => {
            boundaryTypes[type] = createBoundaryType(type);
        })
    }
    
    // Create link groups for each link type
    const linkTypes = {};
    if(!configParams.hideLinks) {
        configParams.locationLinkTypes.forEach( type => {
            linkTypes[type] = createLinkType(type);
        });
    }

    // Define the cluster grouping for all markers
    const clusterGroup = createClusterGroup(map, configParams);

    // Need to add overlay layers for each layer type
    const overlays = {};

    Object.keys(markerTypes).forEach(type => {
        // Add each marker type to the layer controls for filtering
        overlays[type] = markerTypes[type].clusterGroup;
        if (configParams.affectedRadiusProps.length && !configParams.hideAffectedRadius) {
            overlays[type + '_affected_raidus'] = markerTypes[type].affectedRadiusMarkersLayer;
            map.addLayer(markerTypes[type].affectedRadiusMarkersLayer);
        }
        // Add each marker type to the clustering
        clusterGroup.addLayer(markerTypes[type].clusterGroup);
    })

    if (!configParams.hideGeoBoundary) {
        Object.keys(boundaryTypes).forEach(type => {
            // Add each boundary type to the layer controls for filtering
            overlays[type] = boundaryTypes[type].clusterGroup;
            // Add each boundary type to the clustering
            clusterGroup.addLayer(overlays[type]);
        });
    }

    if(!configParams.hideLinks) {
        Object.keys(linkTypes).forEach(type => {
            let typeName = type;
            if (type === '*') {
                typeName = 'relationships';
            }
            // Add each link type to the layer controls for filtering
            overlays[typeName] = linkTypes[type].clusterGroup;
            // Add each link type to the clustering
            clusterGroup.addLayer(overlays[typeName]);
        });
    }

    // Add cluster group to the map
    map.addLayer(clusterGroup);

    // Add weather layer
    if (configParams.openWeatherMapApiId) {
        addWeatherLayers(overlays, configParams.openWeatherMapApiId);
    }

    const layerControl = L.control.layers(null, overlays).addTo(map);

    const loadingInstance = Loading.create(document.getElementById('my-loading'));

    const view = {
        map,
        layerControl,
        markerTypes,
        boundaryTypes,
        linkTypes,
        linkMap: {},
        clusterGroup,
        configParams,
        loadingInstance
    };

    // Add the search control
    const searchControl = createSearchControl(view);
    map.addControl(searchControl);

    map.whenReady(loadMapLocations.bind(this, view));
})()
