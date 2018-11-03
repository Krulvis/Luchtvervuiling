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
    results.draggable();//.resizable();
    settings.draggable();
    results.on('resizestop', function () {
        console.log('Resize complete');
        luchtvervuiling.instance.showChart();
    });

    this.layer = 'lki';

    $(".dropdown-menu a").click(function () {
        var id = $(this).attr('id');
        luchtvervuiling.instance.layer = id;
        $(".btn:first-child").text($(this).text());
        $(".btn:first-child").val($(this).text());
        $('.results .chart').attr('src', '/static/img/' + id + '.png');
        loadOverlay(luchtvervuiling.instance.map, id);
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
    loadOverlay(this.map, this.layer);
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
    var code = feature.getProperty('BU_CODE');
    var layer = this.layer;
    console.log('Buurt: ' + name, ', layer: ' + layer + ', code: ' + code);
    this.map.data.revertStyle();
    this.map.data.overrideStyle(feature, luchtvervuiling.App.SELECTED_STYLE);

    $.ajax({
        url: '/static/dataset.json',
        method: 'GET',
        beforeSend: function () {
            $('.results .buurtnaam').html(name);
            //$('.results .loading').show();
            $('.results').show();
            $('.results .chart').attr('src', '/static/img/' + layer + '.png');
            $('.results .chart').show();
        },
        error: function (data) {
            console.log('Error obtaining data!');
        }
    }).done((function (data) {
        $('#wozwaarde').val('189.683 euro');
    }).bind(this));
};

luchtvervuiling.App.prototype.processData = function (allText) {
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];

    for (var i = 1; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {
            var tarr = [];
            for (var j = 0; j < headers.length; j++) {
                tarr.push(headers[j] + ":" + data[j]);
            }
            lines.push(tarr);
        }
    }
    console.log(lines);
};

/**
 * Shows a chart with the given timeseries.
 * @param {Array<Array<number>>} timeseries The timeseries data
 *     to plot in the chart.
 */
luchtvervuiling.App.prototype.showChart = function (chartTitle, chartData) {
    $('.results').show();
    $('.results .title').show().text(chartTitle);
    var data = google.visualization.arrayToDataTable(chartData);
    var wrapper = new google.visualization.ChartWrapper({
        chartType: 'LineChart',
        dataTable: data,
        options: {
            title: 'Precipitation over time',
            //curveType: 'function',
            legend: {position: 'bottom'},
            titleTextStyle: {fontName: 'Roboto'},
            hAxis: {title: 'Time'},
            vAxis: {title: 'Precipitation (mm)'}
        }
    });
    $('.results .chart').show();
    var chartEl = $('.chart').get(0);
    wrapper.setContainerId(chartEl);
    wrapper.draw();
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

