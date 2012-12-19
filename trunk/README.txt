Overview
--------

The czar system is built on top of a simple real-time synchronization
service called "stateserver", which consists of a Python server and a
Javascript client library.

The stateserver system is designed to replicate generic key-value data
between a server and many clients, propagating changes to the clients
immediately when they occur.  Changes are sent to browsers via dynamic
script tag injection long polling, which works in all major browsers.

Stateserver replicates a copy of the entire data set to every client.
It is a synchronizer, not a query database.  This is appropriate because the
total amount of state used in the czar application is trivial -- a few
tens of kilobytes at most.  The Python server is a dumb key/value state
repository and is independent of the actual application logic.  It serves
only JSON data, not HTML web pages.

The actual czar application is implemented in Javascript using the client
library.  The actual browser loads a static HTML page (from disk, or from a
generic HTTP server); embedded Javascript constructs the page layout based on
incoming data changes and user actions.

The stateserver can host multiple "channels" (independent data files), so
independent instances of the application can easily be set up (for testing
or other purposes).


Walkthrough
-----------

stateserver.py - Python HTTP server that serves the stateserver protocol.
    See the doc comments for usage and request protocol documentation.
    Tested on Linux, but shouldn't contain anything too platform-specific.

test.py - Simple doctest unit tests for parts of stateserver.py code.

stateserver.js - Javascript client library for accessing stateserver data.
    See the header comments for API documentation.

json2.js - Javascript JSON library (from http://www.json.org/js.html).
    Used by stateserver.js, and must be included by the page first.

inspect.html - Inspector and diagnostic tool for stateserver channels.
    Load the page in a browser, enter a URL served by stateserver.py, and it
    will show you a live view of raw key/value data, plus a running log of changes.

czar.js - The application logic for Czar itself.
    This is long, rambly, and not documented at all.  Includes Wei-Hwa's
    modifications for adding tags to puzzles.  Makes a variety of assumptions
    about the content of the HTML page it is loaded into (including stylesheet
    definitions, etc).

index.html - The HTML page loaded by the browser.
    This includes (via <script src=...>) all of the above Javascript.


Running it yourself
-------------------

1. Check out this code directory.

2. Run the stateserver.  You can just run it in this directory:

     ./stateserver.py :8888

   Or, you can use the stateserver running on http://ofb.net:8888/,
   but using your own channel.  (Channels are created on demand.)

3. Copy (or edit in place) index.html.  Modify the call to start_czar() to
   pass in a your own stateserver's URL, or at least your own data.

   For example: start_czar('http://czar*.ofb.net:8888/my_test_name_here')

4. Load your copy of index.html in a browser, directly off disk or
   with some sort of web server.  (Note that if you serve index.html directly
   off disk, none of the audio will work due to Flash security restrictions.
   To avoid this limitation, running a web server is necessary.  You can use
   Google App Engine's dev_appserver.py to run such a web server, and an
   app.yaml config file is included for this purpose.)  You should get an
   initially empty czar instance to which you can make entries and edits.  Make
   sure the data is being sent to the server -- try simultaneous viewing in two
   browser windows.

5. Load up inspect.html in your browser.  Enter the URL of your stateserver
   (the same one you put in your edited index.html).  Look at the key/value
   pairs.  Try modifying some of them -- the modifications should be
   reflected in the running Czar instances.

6. Edit czar.js, (your copy of) index.html, etc. and go nuts.

Note that this will not handle spreadsheet link creation via e-mail --
TODO(egnor): add directions for how to set that up.
