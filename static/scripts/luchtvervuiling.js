luchtvervuiling = {};

luchtvervuiling.boot = function (key) {
    // Load external libraries.
    //google.load('visualization', '1', {packages: ["corechart"]});
    google.load('maps', '3', {'other_params': 'key=' + key + '&libraries=drawing'});

    google.setOnLoadCallback(function () {
        google.charts.load("current", {packages: ['corechart']});
        google.charts.setOnLoadCallback(function () {
            luchtvervuiling.instance = new luchtvervuiling.App();
            luchtvervuiling.instance.initVals();
        });

    });
};

luchtvervuiling.App = function () {
    this.map = this.createMap();

    //Some styling (responsiveness of results panel)
    var results = $('.results');
    var settings = $('.settings');
    results.draggable().resizable();
    settings.draggable();
    results.on('resizestop', function () {
        console.log('Resize complete');
        luchtvervuiling.instance.showChart();
    });

    //Get GeoJSON for all countries
    var names = [];
    $.getJSON('static/polygons/myanmar_state_region_boundaries.json', function (json) {
        json.features.forEach(function (feature) {
            names.push(feature.properties.ST);
        });
    });
    $.getJSON('static/polygons/myanmar_district_boundaries.json', function (json) {
        json.features.forEach(function (feature) {
            names.push(feature.properties.ST);
        });
    });

    //this.addCountries(countriesMapId, countriesToken);
    this.createRegions();

    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('legend'));
};

/**
 * Set the initial Values to use
 */
luchtvervuiling.App.prototype.initVals = function () {

    this.chartData = null;
};

/**
 * Creates a Google Map
 * The map is anchored to the DOM element with the CSS class 'map'.
 * @return {google.maps.Map} A map instance with the map type rendered.
 */
luchtvervuiling.App.prototype.createMap = function () {
    var mapOptions = {
        backgroundColor: '#000000',
        center: luchtvervuiling.App.DEFAULT_CENTER,
        //disableDefaultUI: true,
        streetViewControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM},
        zoom: luchtvervuiling.App.DEFAULT_ZOOM,
        maxZoom: luchtvervuiling.App.MAX_ZOOM
    };
    var mapEl = $('.map').get(0);
    return new google.maps.Map(mapEl, mapOptions);
};


/**
 * Retrieves the JSON data for each Region
 * Loads the JSON as GeoJSON to the map's data, letting each Region become a feature
 */
luchtvervuiling.App.prototype.createRegions = function () {
    this.map.data.loadGeoJson('static/polygons/myanmar_state_region_boundaries.json');
    this.map.data.setStyle(function (feature) {
        return luchtvervuiling.App.UNSELECTED_STYLE;
    });
};

/**
 * Retrieves the JSON data for each District
 * Loads the JSON as GeoJSON to the map's data, letting each District become a feature
 */
luchtvervuiling.App.prototype.createDistricts = function () {
    this.map.data.loadGeoJson('static/polygons/myanmar_districts_boundaries.json');
    this.map.data.setStyle(function (feature) {
        return luchtvervuiling.App.UNSELECTED_STYLE;
    });
};


/**
 * Adds overlay to the map with given mapId and token,
 * Fires event on done loading map
 * @param eeMapId
 * @param eeToken
 * @param statistic
 */
luchtvervuiling.App.prototype.addOverlay = function (eeMapId, eeToken) {
    console.log('MapID: ' + eeMapId + ', Token: ' + eeToken);
    //var bounds = new google.maps.LatLngBounds();
    var maxZoom = 5;
    var overlay = new google.maps.ImageMapType({
        getTileUrl: function (tile, zoom) {
            var url = luchtvervuiling.App.EE_URL + '/map/';
            maxZoom = zoom > maxZoom ? zoom : maxZoom;
            url += [eeMapId, zoom, tile.x, tile.y].join('/');
            url += '?token=' + eeToken;
            return url;
        },
        tileSize: new google.maps.Size(256, 256)
    });

    this.map.overlayMapTypes.push(overlay);
    //this.map.fitBounds(bounds);
    //this.map.setZoom(maxZoom);

};


/**
 * Removes previously added Overlay Map Types (Used to remove Map Overlay Rainfall)
 */
luchtvervuiling.App.prototype.clearOverlays = function () {
    var overlays = this.map.overlayMapTypes;
    while (overlays[0]) {
        overlays.pop().setMap(null);
    }
    this.map.overlayMapTypes.clear();
};


/**
 * Validates the given shapefile link
 */
luchtvervuiling.App.prototype.validateShapefile = function () {
    var link = $('#shapefile-link').val();
    console.log('Validating: ' + link);
    $.ajax({
        url: '/shapefile?link=' + link,
        method: 'GET',
        beforeSend: function () {
            $('.validated-shapefile').hide();
        }, error: function (data) {
            error.show().html(data['error']);
        }
    }).done((function (data) {
        console.log(data);
        console.log(data['success']);
        if (data['error']) {
            error.show().html(data['error']);
        } else if (data['success'] === 'true') {
            console.log('Validated Shapefile!');
            $('.validated-shapefile').show();
            //this.addOverlay(data['mapId'], data['token']);
        }
    }).bind(this));

};


luchtvervuiling.App.format = function (value) {
    return parseFloat(Math.round(value * 100.0) / 100.0).toFixed(2);
};

luchtvervuiling.App.EE_URL = 'https://earthengine.googleapis.com';

luchtvervuiling.App.SELECTED_STYLE = {strokeWeight: 4};

luchtvervuiling.App.UNSELECTED_STYLE = {
    fillOpacity: 0.0,
    strokeColor: 'black',
    strokeWeight: 1
};

luchtvervuiling.App.INACTIVE_STYLE = {
    fillOpacity: 0.0,
    strokeColor: 'black',
    strokeWeight: 0
};

luchtvervuiling.App.OVERLAY_BASE_BUTTON_NAME = 'Create Overlay';

luchtvervuiling.App.GRAPH_BASE_BUTTON_NAME = 'Create Graph';

luchtvervuiling.App.DEFAULT_CENTER = {lng: 96.95112549402336, lat: 18.00746449851361};
luchtvervuiling.App.DEFAULT_ZOOM = 6;
luchtvervuiling.App.MAX_ZOOM = 14;

luchtvervuiling.App.CHIRPS_CLIMATE = 'UCSB-CHG/CHIRPS/DAILY';
luchtvervuiling.App.TERA_EVAPOTRANSPIRATION = 'MODIS/006/MOD16A2';

