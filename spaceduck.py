#!/usr/bin/env python

'''
spaceduck.org site

Let's make a site!!! yay!!
'''

from bottle import route, run, template
from os.path import dirname, abspath, sep
from Cheetah.Template import Template

# Globals
currentDirectory = dirname(abspath(__file__)) + sep
host = '0.0.0.0'
port = 9000

@route('/')
def index():
    page = str(Template(file="%s/lib/index.tmpl" % currentDirectory))
    return template(page)

class run():
    run(host = host, port = port)
