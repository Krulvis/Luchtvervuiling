#!/usr/bin/env python
"""Web server for the Trendy Lights application.

The overall architecture looks like:

               server.py         script.js
 ______       ____________       _________
|      |     |            |     |         |
|  EE  | <-> | App Engine | <-> | Browser |
|______|     |____________|     |_________|
     \                               /
      '- - - - - - - - - - - - - - -'

The code in this file runs on App Engine. It's called when the user loads the
web page and when details about a polygon are requested.

Our App Engine code does most of the communication with EE. It uses the
EE Python library and the service account specified in config.py. The
exception is that when the browser loads map tiles it talks directly with EE.

The basic flows are:

1. Initial page load

When the user first loads the application in their browser, their request is
routed to the get() function in the MainHandler class by the framework we're
using, webapp2.

The get() function sends back the main web page (from index.html) along
with information the browser needs to render an Earth Engine map and
the IDs of the polygons to show on the map. This information is injected
into the index.html template through a templating engine called Jinja2,
which puts information from the Python context into the HTML for the user's
browser to receive.

Note: The polygon IDs are determined by looking at the static/polygons
folder. To add support for another polygon, just add another GeoJSON file to
that folder.

2. Getting details about a polygon

When the user clicks on a polygon, our JavaScript code (in static/script.js)
running in their browser sends a request to our backend. webapp2 routes this
request to the get() method in the DetailsHandler.

This method checks to see if the details for this polygon are cached. If
yes, it returns them right away. If no, we generate a Wikipedia URL and use
Earth Engine to compute the brightness trend for the region. We then store
these results in a cache and return the result.

Note: The brightness trend is a list of points for the chart drawn by the
Google Visualization API in a time series e.g. [[x1, y1], [x2, y2], ...].

Note: memcache, the cache we are using, is a service provided by App Engine
that temporarily stores small values in memory. Using it allows us to avoid
needlessly requesting the same data from Earth Engine over and over again,
which in turn helps us avoid exceeding our quota and respond to user
requests more quickly.

"""

import json
import os
import sys
from httplib import HTTPException
import jinja2
import webapp2
from google.appengine.api import urlfetch

import config
import ee


###############################################################################
#                             Web request handlers.                           #
###############################################################################

class MainHandler(webapp2.RequestHandler):
    """A servlet to handle requests to load the main web page."""

    def get(self):
        """Returns the main web page, populated with EE map."""
        template_values = {
            'key': config.KEY
        }
        template = JINJA2_ENVIRONMENT.get_template('/static/home.html')
        self.response.out.write(template.render(template_values))


class Map(webapp2.RequestHandler):
    """A servlet to handle requests to load the main web page."""

    def get(self):
        """Returns the main web page, populated with EE map."""
        template_values = {
            'key': config.KEY
        }
        template = JINJA2_ENVIRONMENT.get_template('index.html')
        self.response.out.write(template.render(template_values))


class OverlayHandler(webapp2.RequestHandler):

    def get(self):
        values = {}
        try:
            overlay = GetOverlayImage()
            data = overlay.getMapId()
            values['mapid'] = data['mapid']
            values['token'] = data['token']
            values['download_url'] = overlay.getDownloadURL()
            print(values)
        except (ee.EEException, HTTPException):
            # Handle exceptions from the EE client library.
            print('Fuck error getting map')
            e = sys.exc_info()[0]
            values['error'] = ErrorHandling(e)
        finally:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(json.dumps(values))


class SFHandler(webapp2.RequestHandler):

    def get(self):
        link = self.request.get('link')
        fc = ee.FeatureCollection(link)
        print(fc.getInfo())
        data = {}
        data['success'] = 'true'
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(data))


class BuurtHandler(webapp2.RequestHandler):

    def get(self):
        buurt = self.request.get('buurt')
        particle = self.request.get('particle')
        print('Looking for:', buurt, ', particle:', particle)
        data = {}
        graph = (0, 1)  # buurtNaam(buurt, particle)
        data['time'] = graph[0]
        data['y'] = graph[1]
        data['success'] = 'true'
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(data))


# http://webapp-improved.appspot.com/tutorials/quickstart.html
app = webapp2.WSGIApplication([
    ('/overlay', OverlayHandler),
    ('/shapefile', SFHandler),
    ('/', Map),
    ('/buurt', BuurtHandler),
    ('/map', MainHandler),
])


###############################################################################
#                                Overlay                                      #
###############################################################################

def GetOverlayImage():
    """Map for displaying summed up images of specified measurement"""
    return BUURT_OVERLAY.clip(NETHERLANDS).visualize(min=-2, max=11, opacity=0.4,
                                                     palette='0020C5, 009CF9, 2DCDFB, FFFC4D, FF9845, FE7626, FF0A17, DC0610')


###############################################################################
#                                   Helpers.                                  #
###############################################################################

def GetShapeFileFeature(shapefile):
    return ee.FeatureCollection(shapefile).geometry().dissolve()


def OrderForGraph(details):
    """Generates a multi-dimensional array of information to be displayed in the Graphs"""
    # Create first row of columns
    first_row = ['Date']
    for i in details:
        first_row.append(i)

    # Build array of months (Assumes Month (mm-yyyy) to be first, and have the value as second element per row
    first = details[details.keys()[0]]
    months = [first[i][0] for i in range(len(first))]
    print(months)

    rows = [len(first)]
    rows[0] = first_row

    # Create rows and add to main array
    for index in range(len(months)):
        row = [months[index]]
        for i in details:
            value = details[i][index][1]
            row.append(0.0 if value is None else value)
        rows.append(row)

    print(rows)

    return rows


def ErrorHandling(e):
    print('Error getting graph data ERROR CAUGHT')
    print(str(e))
    return 'Area too large' if e is HTTPException else str(e)


###############################################################################
#                                   Constants.                                #
###############################################################################


# Memcache is used to avoid exceeding our EE quota. Entries in the cache expire
# 24 hours after they are added. See:
# https://cloud.google.com/appengine/docs/python/memcache/
MEMCACHE_EXPIRATION = 60 * 60 * 24

###############################################################################
#                               Initialization.                               #
###############################################################################


# Use our App Engine service account's credentials.
EE_CREDENTIALS = ee.ServiceAccountCredentials(
    config.EE_ACCOUNT, config.EE_PRIVATE_KEY_FILE)

# Create the Jinja templating system we use to dynamically generate HTML. See:
# http://jinja.pocoo.org/docs/dev/
JINJA2_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    autoescape=True,
    extensions=['jinja2.ext.autoescape'])

# Initialize the EE API.
ee.Initialize(EE_CREDENTIALS)
urlfetch.set_default_fetch_deadline(80)

###############################################################################
#                               Building the ImageCollections.                #
###############################################################################
BUURT_OVERLAY = ee.Image('users/joepkt/vandaag_18')

COUNTRIES = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw')
NETHERLANDS = COUNTRIES.filter(ee.Filter.inList('Country', ['Netherlands'])).geometry().dissolve()
