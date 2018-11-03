luchtvervuiling = {};

luchtvervuiling.boot = function (key) {
    // Load external libraries.
    //google.load('visualization', '1', {packages: ["corechart"]});
    google.load('maps', '3', {'other_params': 'key=' + key + '&libraries=drawing'});

    google.setOnLoadCallback(function () {
        google.charts.load("current", {packages: ['corechart']});
        google.charts.setOnLoadCallback(function () {
            luchtvervuiling.instance = new luchtvervuiling.App();
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
    this.zipcodes = {};

    //Hide the results panel on click
    $('.results .close').click(this.hidePanel.bind(this));

    //this.addCountries(countriesMapId, countriesToken);
    this.createRegions();
    this.map.data.addListener('click', this.handleMapClick.bind(this));

    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('legend'));

    /**
     * Wms Overlay adding
     */
    loadOverlay(this.map, 'lki');

    // $.ajax({
    //     url: '/overlay',
    //     method: 'GET',
    //     beforeSend: function () {
    //         console.log('Loading map overlay...');
    //     },
    //     error: function (data) {
    //         console.log('Error obtaining data!');
    //     }
    // }).done((function (data) {
    //     if (data['error']) {
    //         console.log('Error: ' + data['error']);
    //     } else {
    //         var mapId = data['mapid'];
    //         var token = data['token'];
    //         // $('#legend-max span').html(myanmar.App.format(data['max']));
    //         // $('#legend-min span').html(myanmar.App.format(data['min']));
    //         // var legend = $('#legend');
    //         // legend.show();
    //         this.addOverlay(mapId, token);
    //     }
    // }).bind(this));
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
    this.map.data.loadGeoJson('static/polygons/amsterdam.geojson');
    this.map.data.setStyle(function (feature) {
        return luchtvervuiling.App.UNSELECTED_STYLE;
    });
};

/**
 * Handle Map Click (Select Buurt)
 * @param event
 */
luchtvervuiling.App.prototype.handleMapClick = function (event) {
    var feature = event.feature;
    var name = feature.getProperty('BU_NAAM');
    console.log('Buurt: ' + name);
    this.map.data.revertStyle();
    this.map.data.overrideStyle(feature, luchtvervuiling.App.SELECTED_STYLE);
    $('.results .buurtnaam').html(name);
    $('.results').show();
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

/**
 * Hides results panel
 */
luchtvervuiling.App.prototype.hidePanel = function () {
    $('.results').hide();
};


luchtvervuiling.App.format = function (value) {
    return parseFloat(Math.round(value * 100.0) / 100.0).toFixed(2);
};

luchtvervuiling.App.EE_URL = 'https://earthengine.googleapis.com';

luchtvervuiling.App.SELECTED_STYLE = {strokeWeight: 2};

luchtvervuiling.App.UNSELECTED_STYLE = {
    fillOpacity: 0.0,
    strokeColor: 'black',
    strokeWeight: 0.3
};

luchtvervuiling.App.INACTIVE_STYLE = {
    fillOpacity: 0.0,
    strokeColor: 'black',
    strokeWeight: 0
};

luchtvervuiling.App.OVERLAY_BASE_BUTTON_NAME = 'Create Overlay';

luchtvervuiling.App.GRAPH_BASE_BUTTON_NAME = 'Create Graph';

luchtvervuiling.App.DEFAULT_CENTER = {lng: 4.893985568630569, lat: 52.375142184470015};
luchtvervuiling.App.DEFAULT_ZOOM = 13;
luchtvervuiling.App.MAX_ZOOM = 14;

luchtvervuiling.App.CHIRPS_CLIMATE = 'UCSB-CHG/CHIRPS/DAILY';
luchtvervuiling.App.TERA_EVAPOTRANSPIRATION = 'MODIS/006/MOD16A2';

