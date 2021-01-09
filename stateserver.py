#!/usr/bin/env python2

import BaseHTTPServer
import cgi
import json  # New in python 2.6.
import os
import signal
import socket
import SocketServer
import sys
import threading
import time
import urlparse

"""
Self-contained HTTP server supplying JSON key/value state maps to long-polling
browser clients (see stateserver.js).  Listens on a port and handles multiple
"channels" (each channel is a self-contained key/value database, stored in a
separate disk file).

To use, run with the port number:

  stateserver.py :8888  # (or your favorite port)

State files will be created and served from the current directory.

The server protocol uses GET requests:

  GET /your-channel-name?jsona=...&jsonp=...&set=...&time=...&v=...

The path (/your-channel-name) identifies the channel to access, which will
be created if it does not exist.  Each channel's data is stored in a file with
".state" appended, so a request to /test will access the channel "test.state".

All request arguments are optional:

  jsona - arbitrary JSON argument to copy into the response (see below)
  jsonp - arbitrary JSON prefix to copy into the response (see below)
  set - JSON object with key/value map to modify this channel with
  time - timeout, in seconds, to respond even if no new data is present
  v - version last known to the client

The response format is JSON text:

  [jsonp]([jsona,]version,{key:value,...})

The 'jsonp' and 'jsona' values are copied verbatim, if present.  These are
normally used when accessing the server via <script src=...> to arrange for
the JSON to invoke the correct JavaScript function to handle the data.

The version is an integer value associated with the current state of the
channel.  Every time the channel is modified (any key/value updated) the
version number increases.

If the 'v' request argument is present, only keys which changed since the
supplied version number are returned.

If the 'time' request argument is present, *and* nothing has changed since
the supplied version, then the server will not respond until something does
change (at which point it will return the new value immediately) or the
supplied number of seconds elapses (at which point it returns an empty result). 
Without the 'time' request, an empty result is returned immediately.

If the 'set' argument is used to send new values, the supplied keys will be
updated immediately, and the new values will be returned in the response.
"""


CHANNELS = {}


class Channel:
  def __init__(self, filename):
    self.__condition = threading.Condition()
    self.__filename = filename
    self.__file = None
    self.release()

  class __Update:
    def __init__(self, key):
      self.modify_version = -1
      self.create_version = -1
      self.key = key
      self.value = None
      self.prev = None
      self.next = None

  def set(self, values):
    self.__condition.acquire()
    try:
      self.__open_for_writing()
      for key, value in values.items():
        version = self.__version + 1
        if self.__update(key, value, version, version):
          self.__file.write(("%d\t%s\t%s\n" % (
              version, json.dumps(key), json.dumps(value))).encode("utf-8"))

      self.__file.flush()

    finally:
      self.__condition.notifyAll()
      self.__condition.release()

  def get(self, version, timeout):
    endtime = time.time() + timeout
    self.__condition.acquire()
    try:
      self.__read_if_present()

      while self.__version <= version:
        timeleft = endtime - time.time()
        if timeleft <= 0: break
        self.__condition.wait(timeleft)

      data = {}
      update = self.__latest_update
      while update and update.modify_version > version:
        if update.value is not None or update.create_version <= version:
          data[update.key] = update.value
        update = update.prev

      return (self.__version, data)

    finally:
      self.__condition.release()

  def rewrite(self):
    tmpname = "%s.tmp" % self.__filename
    tmpfile = file(tmpname, "w")
    start_version = catchups = 0
    while True:
      data = []
      self.__condition.acquire()
      try:
        self.__read_if_present()

        update = None
        prev_update = self.__latest_update
        while prev_update and prev_update.modify_version > start_version:
          update = prev_update
          prev_update = update.prev

        while update:
          create, modify = update.create_version, update.modify_version
          key, value = json.dumps(update.key), json.dumps(update.value)
          if create < modify and create > start_version:
            data.append("%d:%d\t%s\t%s\n" % (create, modify, key, value))
          else:
            data.append("%d\t%s\t%s\n" % (modify, key, value))
          update = update.next

        start_version = self.__version
        if catchups == 5 or not data:
          for line in data: tmpfile.write(line.encode("utf-8"))
          tmpfile.close()
          self.__file.close()
          os.rename(tmpname, self.__filename)
          self.__file = file(self.__filename, "a")
          key_count = len(self.__updates_by_key)
          print "Rewrote %d keys: %s" % (key_count, self.__filename)
          return

      finally:
        self.__condition.release()

      for line in data: tmpfile.write(line.encode("utf-8"))
      tmpfile.flush()
      catchups += 1

  def release(self):
    try:
      self.__condition.acquire()
      if self.__file:
        key_count = len(self.__updates_by_key)
        print "Released %d keys: %s" % (key_count, self.__filename)

      self.__file = None
      self.__updates_by_key = {}
      self.__latest_update = None
      self.__version = 0

    finally:
      self.__condition.release()

  def __update(self, key, value, create_version, modify_version):
    update = self.__updates_by_key.setdefault(key, self.__Update(key))
    if value == update.value and create_version == modify_version:
      return False

    if update.next:
      update.next.prev = update.prev
      if update.prev: update.prev.next = update.next

    if update != self.__latest_update:
      update.next = None
      update.prev = self.__latest_update
      if update.prev: update.prev.next = update
      self.__latest_update = update

    self.__version = max(self.__version, modify_version)
    update.modify_version = max(update.modify_version, modify_version)
    if update.create_version < 0: update.create_version = update.modify_version
    update.create_version = min(update.create_version, create_version)
    update.value = value
    return True

  def __read_if_present(self):
    if self.__file is not None: return
    try: self.__file = file(self.__filename, "r+")
    except IOError: return

    try:
      for line in self.__file:
        version, key, value = line.decode("utf-8").strip().split("\t")
        if ":" in version:
          create, modify = map(int, version.split(":"))
        else:
          create = modify = int(version)
        if modify <= self.__version:
          raise ValueError("Out of order in %s: %s" % (self.__filename, line))
        self.__version = modify
        self.__update(json.loads(key), json.loads(value), create, modify)
      print "Read %d keys: %s" % (len(self.__updates_by_key), self.__filename)
    except Exception, e:
      self.__file = None
      raise e

  def __open_for_writing(self):
    self.__read_if_present()
    if self.__file is not None: return
    self.__file = file(self.__filename, "w")
    print "New file: %s" % self.__filename


class ChannelManager(threading.Thread):
  def __init__(self):
    self.__channels = {}
    self.__channels_lock = threading.Lock()
    threading.Thread.__init__(self)
    self.daemon = True

  def get_channel(self, filename):
    self.__channels_lock.acquire()
    try:
      channel = self.__channels.get(filename)
      if channel:
        channel.__last_use = time.time()
      else:
        channel = Channel(filename)
        channel.__last_use = time.time()
        try: channel.__last_size = os.path.getsize(filename)
        except OSError: channel.__last_size = 0
        self.__channels[filename] = channel

      return channel

    finally:
      self.__channels_lock.release()

  def run(self):
    while 1:
      for filename, channel in self.__channels.items():
        if time.time() - channel.__last_use > 600:
          channel.release()
          channel.__last_use = time.time()
          continue

        try: size = os.path.getsize(filename)
        except OSError: size = 0

        if size > channel.__last_size*2 and size > channel.__last_size + 65536:
          channel.rewrite()
          channel.__last_size = os.path.getsize(filename)

      time.sleep(300)


class Handler(BaseHTTPServer.BaseHTTPRequestHandler):
  server_version = "stateserver/0"

  def do_GET(self):
    scheme, host, path, params, query, fragment = urlparse.urlparse(self.path)

    try:
      args = dict([(k, v.decode("utf-8")) for k, v in cgi.parse_qsl(query)])
    except Exception, e:
      self.send_error(400, "Invalid query encoding: " + query)
      return

    if path[:1] != "/" or "/" in path[1:]:
      self.send_error(400, "Invalid path: " + path)
      return

    try:
      filename = "%s.state" % path[1:]
      jsona = args.get("jsona", "")
      jsonp = args.get("jsonp", "")
      old_version = int(args.get("v", 0))
      timeout = int(args.get("time", 0))
      update = json.loads(args.get("set", "null"))
    except Exception, e:
      print "*** Invalid args (%s):" % e, args
      self.send_error(400, str(e))
      return

    try:
      channel = server.channel_manager.get_channel(filename)
      if type(update) is dict:
        channel.set(update)
      elif update is not None:
        self.send_error(400, "Not a map: " + json.dumps(update))
        return
      new_version, data = channel.get(old_version, timeout)
    except Exception, e:
      self.send_error(500, str(e))
      raise

    if jsona: jsona = "%s," % jsona
    output = "%s(%s%d,%s)\n" % (jsonp, jsona, new_version, json.dumps(data))
    self.send_response(200)
    self.send_header("Content-type", "text/javascript; charset=utf-8")
    self.send_header("Pragma", "no-cache")
    self.send_header("Cache-control", "no-cache")
    self.end_headers()
    self.wfile.write(output.encode("utf-8"))
    self.wfile.close()


class Server(SocketServer.ThreadingMixIn, BaseHTTPServer.HTTPServer):
  channel_manager = ChannelManager()


if __name__ == "__main__":
  if len(sys.argv) != 2 or not ":" in sys.argv[1]:
    sys.stderr.write("usage: cd /state/dir && stateserver.py [host]:port\n")
    sys.exit(2)

  signal.signal(signal.SIGINT, signal.SIG_DFL)
  host, port = sys.argv[1].split(":")
  server = Server((host, int(port)), Handler)
  print "Listening on http://%s:%s/" % (host or socket.gethostname(), port)
  server.serve_forever()
