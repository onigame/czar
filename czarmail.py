#!/usr/bin/python

import email
import json
import random
import re
import sys
import urllib

USAGE = """Command-line usage (for debugging):
   czarmail.py http://stateserver:port/path < message

Practical Usage:
   Set an alias that forwards email to this script.
   For example, set a postfix alias:
     czar: "|/path/to/czarmail.py http://stateserver:port/path"
"""

TITLE_RE = re.compile(
    r"I've shared (?:a document|an item) with you called "
    r'"(.*)":')

URL_RE = re.compile(
    r'https?://(spreadsheets.google.com|docs.google.com/spreadsheet)/ccc[\S]*')

BOTH_RE = re.compile(
    r"I've shared an item with you: *(.*) (" + URL_RE.pattern + r")")


def crunch(s):
  return re.sub(r"\W+", "", s).lower()


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
    sys.stderr.write(USAGE)
    sys.exit(2)

  server = sys.argv[1]
  message = email.message_from_file(sys.stdin)
  for part in message.walk():
    if part.get_content_type() == "text/plain":
      body = part.get_payload().replace("\n", " ")
      title = TITLE_RE.search(body)
      url = URL_RE.search(body)
      if title and url:
        document(server, title.group(1), url.group(0))
        sys.exit(0)

      both = BOTH_RE.search(body)
      if both:
        document(server, both.group(1), both.group(2))
        sys.exit(0)

  sys.stderr.write("error: No document reference found!\n")
  sys.exit(1)
