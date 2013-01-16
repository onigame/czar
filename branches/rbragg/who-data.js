// Methods and classes to store and modify the data used by the Who page.
// This data is used by the Czar page, too.

var Assignment = function(when, active, exclusive) {
  this.when = when == null ? 0 : when;
  this.active = active == null ? false : active;
  this.exclusive = exclusive == null ? true : exclusive;
};

var LastSeenTime = function(user, activity) {
  if (gLastSeenTime[user] && gLastSeenTime[user][activity]) {
    return gLastSeenTime[user][activity].when;
  } else {
    return 0;
  }
};

var IsExclusiveAssignment = function(user, activity) {
  if (gLastSeenTime[user] && gLastSeenTime[user][activity]) {
    return gLastSeenTime[user][activity].exclusive;
  } else if (gActivities[activity]) {
    return gActivities[activity].exclusive;
  } else {
    return true;
  }
};

var IsActiveAssignment = function(user, activity) {
  if (gLastSeenTime[user] && gLastSeenTime[user][activity]) {
    return gLastSeenTime[user][activity].active;
  } else {
    return false;
  }
};

var IsJobToDisplay = function(activity) {
  for (j in config.jobs_to_display) {
    if (config.jobs_to_display[j] == gActivities[activity].name) {
      return true;
    }
  }
  return false;
};

// UpdateActivityHack is a hook for anyone who wants to be called when
// an activity or an assignment has changed  UpdateActivityHack is defined in
// the global scope, so, just set it to your own callable and we'll invoke it.
var UpdateActivityHack = null;

var UpdateAssignment = function(user, activity, when, active, exclusive) {
  if (when == null && active == null && exclusive == null) {
    // Delete this assignment.
    delete gLastSeenTime[user][activity];
    return;
  }

  if (! gLastSeenTime[user]) {
    gLastSeenTime[user] = {};
  }
  if (!gLastSeenTime[user][activity]) {
    // Create new object.
    gLastSeenTime[user][activity] = new Assignment(when, active, exclusive);
  } else {
    // Update existing object.
    if (when != null) {
      gLastSeenTime[user][activity].when = when;
    }
    if (active != null) {
      gLastSeenTime[user][activity].active = active;
    }
    if (exclusive != null) {
      gLastSeenTime[user][activity].exclusive = exclusive;
    }
  }

  if (UpdateActivityHack) {
    UpdateActivityHack(activity);
  }
};

var User = function(id, name) {
  if (id < 0) {
    // Generate a new ID.
    do id = "u" + Math.floor(Math.random() * 10000);
    while (gUsers[id]);
  }
  this.id = id;
  this.name = name;
};

var Activity = function(id, name) {
  if (id < 0) {
    // Generate a new ID.
    do id = "a" + Math.floor(Math.random() * 10000);
    while (gActivities[id]);
  }
  this.id = id;
  this.name = name;
  this.tags = '';
  this.exclusive = true;
};

Activity.prototype.IsNonPuzzleActivity = function() {
  return this.id[0] == 'a';
};

var gUsers = {};
var gActivities = {};
// Map from person to {map of activity to Assignment} wherein this person most
// recently worked on this activity at this time.
var gLastSeenTime = {};


var HandleUpdateFromStateserver = function(key, value) {
  log('From stateserver: [' + key + '] = [' + value + ']');

  // p####.field................ Puzzle.
  // x####.field................ Puzzle (deprecated).
  // u####.field................ Person ("user").  #### is ID, field is name.
  // a####.field................ Activity (excl. puzzle).  #### is ID, field
  //                             is name.
  // t.u####.?####.field........ Assignment.  field is when, exclusive, active.
  //                             ####s are IDs.

  var dot = key.indexOf(".");
  var id = dot >= 0 ? key.substring(0, dot) : null;
  var field = dot >= 0 ? key.substring(dot+1) : null;

  if (key[0] == 'p' || key[0] == 'x') {
    // Puzzle.
    if (dot >= 0 && field == 'label') {
      if (value) {
        InternalUpdateActivity(id, value);
      } else {
        ForgetActivity(id);
      }
    } else if (dot >= 0 && field == 'tags') {
      UpdateTags(id, value);
    }
    if (UpdateActivityHack) {
      UpdateActivityHack(id);
    }
  } else if (key[0] == 'a') {
    // Activity.
    var dot = key.indexOf(".");
    if (dot >= 0 && key.substring(dot+1) == 'name') {
      if (value) {
        InternalUpdateActivity(key.substring(0, dot), value);
      } else {
        ForgetActivity(key.substring(0, dot));
      }
    }
    if (UpdateActivityHack) {
      UpdateActivityHack(id);
    }
  } else if (key[0] == 'u') {
    // Person.
    var dot = key.indexOf(".");
    if (dot >= 0 && key.substring(dot+1) == 'name') {
      if (value) {
        InternalAddPerson(key.substring(0, dot), value);
      } else {
        ForgetPerson(key.substring(0, dot));
      }
    }
  } else if (key[0] == 't') {
    // Assignment.
    var parts = key.match(/t\.([^.]*)\.([^.]*)(\.([^.]*))?/);
    if (parts && parts.length == 5) {
      var uid = parts[1];
      var aid = parts[2];
      var field = parts[4];

      InternalAddPerson(uid, null);
      InternalUpdateActivity(aid, null);

      var when;
      var active;
      var exclusive;

      if (field == null || field == 'when') {
        when = value;
      } else if (field == 'active') {
        active = gStateServer.parse_boolean(value);
      } else if (field == 'exclusive') {
        exclusive = gStateServer.parse_boolean(value);
      }
      UpdateAssignment(uid, aid, when, active, exclusive);
    }
  }
};

var InternalAdd = function(id, name, Type, storage) {
  var o = null;

  // Does it exist identically already?
  if (storage[id]) {
    o = storage[id];
    // Update name.
    if (name) {
      o.name = name;
    }
  } else {
    o = new Type(id, name);
    storage[o.id] = o;
  }

  if (id < 0) {
    // Created a new object; store this data with stateserver.
    gStateServer.set(o.id + '.name', o.name);
  }

  return o;
};

var InternalAddPerson = function(id, name) {
  user = InternalAdd(id, name, User, gUsers);
  if (! gLastSeenTime[user.id]) {
    gLastSeenTime[user.id] = {};
  }
};

var InternalUpdateActivity = function(id, name, tags) {
  activity = InternalAdd(id, name, Activity, gActivities);
  if (activity.IsNonPuzzleActivity()) {
    // TODO(corin): We can make all non-puzzle activities non-exclusive
    // by changing this next line.  OTOH that exposes the notion of being
    // non-exclusive to everyone.
    activity.exclusive = true;
  }
  if (tags != null) {
    activity.tags = tags;
  } else if (tags == null && activity.IsNonPuzzleActivity()) {
    activity.tags = 'activity';
  }
};

var ForgetPerson = function(id) {
  delete gUsers[id];
}
var ForgetActivity = function(id) {
  delete gActivities[id];
}

var UpdateTags = function(id, taglist) {
  if (taglist) {
    InternalUpdateActivity(id, null, taglist);
  } else {
    InternalUpdateActivity(id, null, '');
  }

  if (UpdateTagsSelector) {
    UpdateTagsSelector();
  }
};

var UpdateStatus = function(user, activity, when, active, exclusive) {
  // Record that user has worked on activity at the given time.

  log('UpdateStatus(' +
      [user.id, activity.id, when, active, exclusive].join(', ') +
      ')');

  UpdateAssignment(user.id, activity.id, when, active, exclusive);

  // If this assignment is exclusive of all other exclusive assignments,
  // update those other assignments to be inactive.
  if (IsActiveAssignment(user.id, activity.id) &&
      IsExclusiveAssignment(user.id, activity.id)) {
    for (a in gLastSeenTime[user.id]) {
      var otherActivity = gActivities[a];
      if (otherActivity != activity &&
          IsActiveAssignment(user.id, otherActivity.id) &&
          IsExclusiveAssignment(user.id, otherActivity.id)) {
        UpdateStatus(user, otherActivity, null, false, true);
      }
    }
  }

  // Update stateserver with this information.
  var key = 't.' + user.id + '.' + activity.id;
  if (when != null) gStateServer.set(key + '.when', when);
  if (active != null) {
    gStateServer.set(key + '.active', gStateServer.make_boolean(active));
  }
  if (exclusive != null) {
    gStateServer.set(key + '.exclusive', gStateServer.make_boolean(exclusive));
  }
};

var MakeAgoString = function(now, then) {
  var ms_ago = now - then;  // Milliseconds.
  var minutes_ago = parseInt(ms_ago / 1000.0 / 60.0);
  var hours_ago = parseInt(minutes_ago / 60);
  minutes_ago = minutes_ago - (hours_ago * 60);

  var ago = '';
  if (hours_ago > 0) {
    ago += hours_ago;
  }

  ago += ':' + PadWithZeroes(minutes_ago, 2);

  return ago;
};


var PadWithZeroes = function(x, len) {
  var s = String(x);
  if (s.length < len) {
    s = '0' * (len - s.length) + s;
  }

  return s;
};

