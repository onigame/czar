#!/usr/bin/python

import email
import json
import random
import re
import sys
import urllib

TITLE_RE = re.compile("""I've shared a document with you called "(.*)":""")
URL_RE = re.compile("""(https?://spreadsheets.google.com/ccc[\\S]*)""")
NEW_RE = re.compile("""I've shared a document with you: *(.*) *(https?://spreadsheets.google.com/ccc[\\S]*)""")
JUNK_RE = re.compile("""\\W+""")


def crunch(s):
  return JUNK_RE.sub("", s).lower()


def document(server, title, url):
  data = urllib.urlopen(server).read().strip()
  if not (data[:1] == "(" and data[-1:] == ")"):
    sys.stderr.write("error: invalid server response: " + data)
    sys.exit(1)

  crunched = crunch(title)
  ver, state = json.read("[" + data[1:-1] + "]")
  out = { }
  for key, value in state.items():
    if key.endswith(".label") and crunch(value) == crunched:
      key = key.replace(".label", ".sheet")
      if not state.get(key):
        out[key] = url
        break

  else:
    while 1:
      key = "p%05d" % (random.random() * 10000)
      if not state.get(key + ".label"):
        out[key + ".label"] = title
        out[key + ".sheet"] = url
        break

  seturl = "%s?%s" % (server, urllib.urlencode({"set": json.write(out)}))
  urllib.urlopen(seturl).read()


if __name__ == "__main__":
  if len(sys.argv) != 2:
    sys.stderr.write("Command-line Usage (for debugging):\n")
    sys.stderr.write("   czarmail.py http://stateserver:port/path < message\n")
    sys.stderr.write("Practical Usage:\n")
    sys.stderr.write("   Set an alias that forwards email to this script.\n")
    sys.stderr.write("   For example, set a postfix alias:\n")
    sys.stderr.write("     czar: \"|/path/to/czarmail.py http://stateserver:port/path\"\n")

    sys.exit(2)

  server = sys.argv[1]
  message = email.message_from_file(sys.stdin)
  for part in message.walk():
    if part.get_content_type() == "text/plain":
      body = part.get_payload().replace("\n", " ")
      title = TITLE_RE.search(body)
      url = URL_RE.search(body)
      if title and url:
        document(server, title.group(1), url.group(1))
        sys.exit(0)

      both = NEW_RE.search(body)
      if both:
        document(server, both.group(1), both.group(2))
        sys.exit(0)

  sys.stderr.write("error: No document reference found!\n")
  sys.exit(1)
