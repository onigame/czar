#!/usr/bin/python

"""
Test suite for stateserver.py.

Start with an empty state:

>>> try: os.remove("test.state")
... except OSError: pass

>>> channel = stateserver.Channel("test.state")
>>> channel.get(0, 0)
(0, {})


Add two items, which should bump the version to 2.

>>> channel.set({1: "one", 2: "two"})
New file: test.state

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

>>> channel.set({1: "one+", 3: "three+"})

>>> pprint.pprint([channel.get(n, 0) for n in range(6)])
[(5, {1: 'one+', 2: 'two', 3: 'three+'}),
 (5, {1: 'one+', 2: 'two', 3: 'three+'}),
 (5, {1: 'one+', 3: 'three+'}),
 (5, {1: 'one+', 3: 'three+'}),
 (5, {3: 'three+'}),
 (5, {})]


Delete something, make sure that works properly.

>>> channel.set({2: None})

>>> pprint.pprint([channel.get(n, 0) for n in range(7)])
[(6, {1: 'one+', 3: 'three+'}),
 (6, {1: 'one+', 3: 'three+'}),
 (6, {1: 'one+', 2: None, 3: 'three+'}),
 (6, {1: 'one+', 2: None, 3: 'three+'}),
 (6, {2: None, 3: 'three+'}),
 (6, {2: None}),
 (6, {})]


Reload the channel from the data file, make sure it's intact.

>>> channel = None
>>> channel = stateserver.Channel("test.state")
>>> pprint.pprint([channel.get(n, 0) for n in range(7)])
Read 3 keys: test.state
[(6, {1: 'one+', 3: 'three+'}),
 (6, {1: 'one+', 3: 'three+'}),
 (6, {1: 'one+', 2: None, 3: 'three+'}),
 (6, {1: 'one+', 2: None, 3: 'three+'}),
 (6, {2: None, 3: 'three+'}),
 (6, {2: None}),
 (6, {})]


Make sure rewrite() works properly, reducing the file size.

>>> before_rewrite = os.path.getsize("test.state")
>>> channel.rewrite()
Rewrote 3 keys: test.state
>>> after_rewrite = os.path.getsize("test.state")
>>> after_rewrite < before_rewrite
True

>>> channel.set({4: "four"})
>>> after_rewrite < os.path.getsize("test.state")
True
>>> pprint.pprint([channel.get(n, 0) for n in range(8)])
[(7, {1: 'one+', 3: 'three+', 4: 'four'}),
 (7, {1: 'one+', 3: 'three+', 4: 'four'}),
 (7, {1: 'one+', 2: None, 3: 'three+', 4: 'four'}),
 (7, {1: 'one+', 2: None, 3: 'three+', 4: 'four'}),
 (7, {2: None, 3: 'three+', 4: 'four'}),
 (7, {2: None, 4: 'four'}),
 (7, {4: 'four'}),
 (7, {})]


Reload the rewritten state file to make sure it's all good.

>>> channel = None
>>> channel = stateserver.Channel("test.state")
>>> pprint.pprint([channel.get(n, 0) for n in range(8)])
Read 4 keys: test.state
[(7, {1: 'one+', 3: 'three+', 4: 'four'}),
 (7, {1: 'one+', 3: 'three+', 4: 'four'}),
 (7, {1: 'one+', 2: None, 3: 'three+', 4: 'four'}),
 (7, {1: 'one+', 2: None, 3: 'three+', 4: 'four'}),
 (7, {2: None, 3: 'three+', 4: 'four'}),
 (7, {2: None, 4: 'four'}),
 (7, {4: 'four'}),
 (7, {})]

"""

import doctest
import os
import pprint
import stateserver

doctest.testmod()
