regions = {};

$(function () {
    $('.regions-table').on('click', '.remove-marker', function () {
        var tr = $(this).closest('tr');
        var title = tr.find('.name').html();
        console.log('Removing Marker: ' + title);
        var markers = [];
        myanmar.instance.regions.forEach(function (marker) {
            if (marker.getTitle() !== title) {
                regions.push(marker);
                console.log("Removed at: " + marker.index);
            } else {
                marker.setMap(null);
            }
        });
        myanmar.instance.markers = regions;
        tr.remove();
    });
});

/**
 * Enable or disable drawing the markers, used when switching styles
 * @param draw
 */
regions.draw = function (draw) {
    if (draw) {
        var map = myanmar.instance.map;
        myanmar.instance.regions.forEach(function (marker) {
            marker.setMap(map);
        });
    } else {
        myanmar.instance.regions.forEach(function (marker) {
            marker.setMap(null);
        });
    }
};

/**
 * Gets latLng from click
 * @param event
 * @returns {*[]}
 */
regions.addMarkerFromClick = function (event) {
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();
    regions.addMarker(lat, lng, '[' + lat + ', ' + lng + ']');
};

/**
 * Adds a marker for filled in values
 */
regions.addMarkerFromForm = function () {
    var lat = $('#lat').val();
    var lng = $('#lng').val();
    var title = $('#title').val();
    if (lat === '' || lng === '' || title === '') {
        $('#error-message').show().html('Please enter a valid Latitude, Longitude and Title');
    } else {
        $('#error-message').hide();
        regions.addMarker(lat, lng, title);
    }
};

/**
 * Add marker to map and
 */
regions.addMarker = function (lat, lng, title) {
    //nameing
    var position = new google.maps.LatLng(lat, lng);
    var marker = new google.maps.Marker({
        position: position,
        map: myanmar.instance.map,
        title: title
    });
    myanmar.instance.regions.push(marker);
    console.log('Added marker: ' + marker.getTitle());
    var tableContent = '<tr><td>' + lat + '</td><td><button class="btn btn-danger remove-region">Remove</button></td></tr>';
    $('.markers-table tbody').append(tableContent);
};

/**
 * Returns JSON of all markers for EE
 */
regions.getJSON = function () {
    var features = $.map(myanmar.instance.regions, function (marker) {
        var temp = {
            "type": "Feature",
            "properties": {
                "title": "Point",
                "id": "point"
            },
            "geometry": {
                "type": "Point",
                "coordinates": []
            }
        };
        temp.properties.title = marker.getTitle();
        var position = marker.getPosition();
        temp.geometry.coordinates = [position.lat(), position.lng()];
        return temp;
    });
    var data = {'features': features};
    var json = JSON.stringify(data);
    return json;
};

regions.chartData = [
    [
        "Month",
        "1",
        "2",
        "3"
    ],
    [
        "01-2017",
        2.856086600571871,
        33.24793869256973,
        0.3191777663305402
    ],
    [
        "02-2017",
        0.03792887204326689,
        100.31480434536934,
        1.6239589303731918
    ],
    [
        "03-2017",
        0.2154056765139103,
        253.93399512767792,
        2.780170165002346
    ],
    [
        "04-2017",
        0.5842667557299137,
        251.4244943857193,
        38.33665423095226
    ],
    [
        "05-2017",
        2.2078846246004105,
        212.5741709768772,
        137.94437164068222
    ],
    [
        "06-2017",
        7.848537530750036,
        36.9533856138587,
        1.8245152765884995
    ],
    [
        "07-2017",
        22.727295875549316,
        42.81465528905392,
        2.25284555926919
    ],
    [
        "08-2017",
        4.196191355586052,
        220.31073558330536,
        246.72935193777084
    ],
    [
        "09-2017",
        1.1168376579880714,
        278.2508134841919,
        180.01068380475044
    ],
    [
        "10-2017",
        9.757962703704834,
        216.72192466259003,
        21.93536625802517
    ],
    [
        "11-2017",
        1.5315435733646154,
        211.1272712647915,
        2.9051994383335114
    ],
    [
        "12-2017",
        9.426948010921478,
        29.98988765478134,
        0.3725663162767887
    ]
];

