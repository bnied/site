#!/usr/bin/env python

'''
spaceduck.org site

Let's make a site!!! yay!!
'''

import cherrypy
from os.path import dirname, abspath, sep
from Cheetah.Template import Template

# Globals
current_dir = dirname(abspath(__file__)) + sep

class Webpage(object):
	def index(self):
		htmlString = "<html>\n\t<head>\n\t\t<title>spaceduck.org</title>\n\t</head>\n\t<body>\n\t\tTesting 1 2 3\n\t</body>\n</html>"

		return htmlString

	index.exposed = True

class run():
	cherrypy.quickstart(Webpage(), '/', config)
	cherrypy.engine.block()

# Config
config = {
	'global': {
		'server.socket_host': '0.0.0.0',
		'server.socket_port': 9000,
	}, 
	'/': {
		'tools.staticdir.root': current_dir,
	},
}
