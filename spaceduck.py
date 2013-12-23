#!/usr/bin/env python

'''
spaceduck.org site

Let's make a site!!! yay!!
'''

import cherrypy
from os.path import dirname, abspath, sep
from Cheetah.Template import Template

# Globals
currentDirectory = dirname(abspath(__file__)) + sep
config = {
    'global': {
        'server.socket_host': '0.0.0.0',
        'server.socket_port': 9000,
    },
    '/': {
        'tools.staticdir.root': currentDirectory,
    },
}


class Webpage(object):
    def index(self):
        page = Template(file="%s/../lib/index.tmpl" % currentDirectory)

        return str(page)

    index.exposed = True


class run():
    cherrypy.quickstart(Webpage(), '/', config)
    cherrypy.engine.block()
