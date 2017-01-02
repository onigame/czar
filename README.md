# Overview

Czar is built on top of a simple real-time synchronization service called
"stateserver", which has a Python server and a Javascript client library.
Stateserver replicates generic key-value data between a server
and many clients, propagating changes to the clients as they occur.
Changes are sent to browsers via dynamic script tag injection long polling,
which works in all major browsers.

Stateserver replicates a copy of the entire data set to every client.
(The total amount of state used by Czar is trivial -- a few tens of kilobytes
at most.) The Python server is a dumb key/value state repository and is
independent of the actual application logic. It serves only JSON, not HTML.

The Czar web interface is implemented in Javascript using the stateserver
client library. The browser loads a static HTML shell (from disk, or from a
generic HTTP server); embedded Javascript populates the content with data
from stateserver.

One stateserver process can host multiple "channels" (independent data files),
so independent instances of the application can easily be set up (for testing
or other purposes).

## Walkthrough

- `stateserver.py` - Python HTTP server that serves the stateserver protocol.

- `stateserver.js` - Javascript client library for accessing stateserver data.

- `stateserver_inspect.html` - Development tool to inspect stateserver channels.

  Development tool to show raw key/value data from stateserver.

- `czar.js` - The application logic for Czar itself.

  This is long, rambly, and not documented at all. Makes a variety of
  assumptions about the content of the HTML page it is loaded into
  (including stylesheet definitions, etc).

- `config.js` - Configuration parameters for Czar.

- `index.html`, `who.html`, etc. - HTML pages loaded by the browser.

  These include (via `<script src=...>`) all of the above Javascript,
  and many other things not described here.

## Running it yourself

1. Check out this code directory somewhere a Web server can serve.
   
   (You can always use `python -m SimpleHTTPServer 8080` to start
   serving the current directory on port 8080.)

2. Run the stateserver. You can just run it in this directory:

   `./stateserver.py :8888`

3. Edit `config.js`. Create your own config block, or modify an existing one.
   Set the `var config = ...` at the bottom to point to that block.

   (See [below](#google-drive-api) for notes about `gapi_client_id`
   and `doc_folder_id` in the config block.)

4. Load `index.html` in a browser. You should get an initially empty Czar
   instance to which you can make entries and edits. Make sure the data is
   being sent to the server -- try simultaneous viewing in two browser windows.

5. Load `stateserver_inspect.html` in a browser. Enter the URL of your
   stateserver (the same one you put in config.js). Look at the key/value
   pairs. Try modifying some of them -- the modifications should be
   reflected in the running Czar instances.

6. Edit czar.js, index.html, etc. and go nuts.

## Google Drive API

Czar uses the [Google Drive API](https://developers.google.com/drive/) to
automatically create spreadsheets for new puzzles. This API needs work to set
up, or whenever you deploy Czar on a new domain.

1. Go to the [Google API Console](https://console.developers.google.com/).

2. From the drop-down at the top of the page, either select an existing
   Project, or create a new one. (Projects can be shared among multiple admins.)

3. Select "Dashboard" from the left-hand menu. Enable the *Google Drive API*,
   if it is not already enabled.

4. Select "Credentials" from the left-hand menu and create *OAuth client ID*
   credentials (or edit existing credentials).

  1. Configure the consent page however you like.
  2. Select a *Web application* client ID type.
  3. Name it however you like.
  4. Add your server's domain to *Authorized JavaScript origins*.
  5. (You don't need any *Authorized redirect URIs*.)
  6. Copy the *Client ID* and use it for `gapi_client_id` in `config.js`.

5. Visit your Czar instance (on the same domain you added) and click the
   *Authenticate with Google* button.

6. Optionally, make a folder in Google Drive to contain the spreadsheets.
   The folder's ID is the last part of its Google Drive URL (an alphanumeric
   jumble). Use it for `doc_folder_id` in `config.js`.
