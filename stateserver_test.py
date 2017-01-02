#!/usr/bin/python

"""
Test suite for stateserver.py.

Start with an empty state:

>>> try: os.remove("stateserver_test.state")
... except OSError: pass

>>> channel = stateserver.Channel("stateserver_test.state")
>>> channel.get(0, 0)
(0, {})


Add two items, which should bump the version to 2.

>>> channel.set({1: "one", 2: "two"})
New file: stateserver_test.state

>>> pprint.pprint([channel.get(n, 0) for n in range(3)])
[(2, {1: 'one', 2: 'two'}), (2, {2: 'two'}), (2, {})]


Add two more items, one redundant; only bumps the version by +1.

>>> channel.set({2: "two", 3: "three"})

>>> pprint.pprint([channel.get(n, 0) for n in range(4)])
[(3, {1: 'one', 2: 'two', 3: 'three'}),
 (3, {2: 'two', 3: 'three'}),
 (3, {3: 'three'}),
 (3, {})]


Modify the first item and the last item; version is bumped by +2.
Verify that non-ASCII characters survive.

>>> channel.set({1: "one+", 3: u"\u4e09"})

>>> pprint.pprint([channel.get(n, 0) for n in range(6)])
[(5, {1: 'one+', 2: 'two', 3: u'\u4e09'}),
 (5, {1: 'one+', 2: 'two', 3: u'\u4e09'}),
 (5, {1: 'one+', 3: u'\u4e09'}),
 (5, {1: 'one+', 3: u'\u4e09'}),
 (5, {3: u'\u4e09'}),
 (5, {})]


Delete something, make sure that works properly.
Empty values (like "" or 0) should not delete.

>>> channel.set({0: "", 1: 0, 2: None, 4: None})

>>> pprint.pprint([channel.get(n, 0) for n in range(9)])
[(8, {0: '', 1: 0, 3: u'\u4e09'}),
 (8, {0: '', 1: 0, 3: u'\u4e09'}),
 (8, {0: '', 1: 0, 2: None, 3: u'\u4e09'}),
 (8, {0: '', 1: 0, 2: None, 3: u'\u4e09'}),
 (8, {0: '', 1: 0, 2: None, 3: u'\u4e09'}),
 (8, {0: '', 1: 0, 2: None}),
 (8, {1: 0, 2: None}),
 (8, {2: None}),
 (8, {})]


Reload the channel from the data file, make sure it's intact.
(Note, the JSON reload makes all strings unicode.)

>>> channel = None
>>> channel = stateserver.Channel("stateserver_test.state")
>>> pprint.pprint([channel.get(n, 0) for n in range(9)])
Read 4 keys: stateserver_test.state
[(8, {0: u'', 1: 0, 3: u'\u4e09'}),
 (8, {0: u'', 1: 0, 3: u'\u4e09'}),
 (8, {0: u'', 1: 0, 2: None, 3: u'\u4e09'}),
 (8, {0: u'', 1: 0, 2: None, 3: u'\u4e09'}),
 (8, {0: u'', 1: 0, 2: None, 3: u'\u4e09'}),
 (8, {0: u'', 1: 0, 2: None}),
 (8, {1: 0, 2: None}),
 (8, {2: None}),
 (8, {})]


Make sure rewrite() works properly, reducing the file size.

>>> before_rewrite = os.path.getsize("stateserver_test.state")
>>> channel.rewrite()
Rewrote 4 keys: stateserver_test.state
>>> after_rewrite = os.path.getsize("stateserver_test.state")
>>> after_rewrite < before_rewrite
True

>>> channel.set({4: "four"})
>>> after_rewrite < os.path.getsize("stateserver_test.state")
True
>>> pprint.pprint([channel.get(n, 0) for n in range(10)])
[(9, {0: u'', 1: 0, 3: u'\u4e09', 4: 'four'}),
 (9, {0: u'', 1: 0, 3: u'\u4e09', 4: 'four'}),
 (9, {0: u'', 1: 0, 2: None, 3: u'\u4e09', 4: 'four'}),
 (9, {0: u'', 1: 0, 2: None, 3: u'\u4e09', 4: 'four'}),
 (9, {0: u'', 1: 0, 2: None, 3: u'\u4e09', 4: 'four'}),
 (9, {0: u'', 1: 0, 2: None, 4: 'four'}),
 (9, {1: 0, 2: None, 4: 'four'}),
 (9, {2: None, 4: 'four'}),
 (9, {4: 'four'}),
 (9, {})]


Reload the rewritten state file to make sure it's all good.

>>> channel = None
>>> channel = stateserver.Channel("stateserver_test.state")
>>> pprint.pprint([channel.get(n, 0) for n in range(10)])
Read 5 keys: stateserver_test.state
[(9, {0: u'', 1: 0, 3: u'\u4e09', 4: u'four'}),
 (9, {0: u'', 1: 0, 3: u'\u4e09', 4: u'four'}),
 (9, {0: u'', 1: 0, 2: None, 3: u'\u4e09', 4: u'four'}),
 (9, {0: u'', 1: 0, 2: None, 3: u'\u4e09', 4: u'four'}),
 (9, {0: u'', 1: 0, 2: None, 3: u'\u4e09', 4: u'four'}),
 (9, {0: u'', 1: 0, 2: None, 4: u'four'}),
 (9, {1: 0, 2: None, 4: u'four'}),
 (9, {2: None, 4: u'four'}),
 (9, {4: u'four'}),
 (9, {})]

"""

import doctest
import os
import pprint
import stateserver

doctest.testmod()
