// We have a map from (activity, person) -> time.  Only one time is stored
// per pair.  Time refers to the last time this person worked on this activity.
// One function will update the HTML of the big-board showing the status of
// what each person is working on.

// x Store the timestamp of last-seen.
// x Create the popup dialog in HTML and leave it hidden.
// x Create a widget that shows the names of people to display.  Add a button
//   that will populate it with everyone we know about (from the data store).
// * on hover over each cell, highlight the row and column headings.
// x Add non-puzzles to activities (sleeping, RC, PC).
// x Update the table every minute (window.timer).
// x Add a toggle that disables / restarts periodic update mode.
// x Handle the delete-data messages.  Those are when value = null.
// x Sort in some useful way.
// x Let me change a person's name or an activity's name.
// x Alternate background colors on rows.
// x Try to make the time format more compact.  Don't bold.  Maybe drop 'm'.
//   Maybe :04 or 1:18?
// x Add a legend.
// o Update the legend when all other formatting is done.
// x Add a "Solved" tag.
// o Highlight 'solved' puzzles in some way.
// o Highlight the last person to have touched a puzzle.
// x Sort orders:
//   x Alphabetical.
//   x Most recently active first.
//   x Most recently active last.
//   x Sort non-puzzle activities outside of puzzles.
// x Filter by tags.
// o In-place editing to rename people and activities.
// x Add instructions:
//   - Clicking updates your status.
//   - Click to rename person or activity.
// x Cross-link between czar and who.html.
// x Add a last-updated-on timestamp.
// x Add a last-update-from-stateserver timestamp.
// x Track down why Chrome hits 50% CPU when stateserver returns empty.
// x Shrink font size of big table.
// x Add menu to each puzzle on index.html to say "I'm working on this now."
// x Record whether an assignment is exclusive of other assignments.
// x Allow non-puzzle activities to be non-exclusive.
// x Allow puzzle activities to be non-exclusive.
// x Add buttons to update widget to make an activity non-exclusive.
// x Add buttons to update widget to terminate a non-exclusive assignment.

// Add a 'has' member function to any Array object.
Array.prototype.has = function(v) {
  for (var i=0; i < this.length; i++) {
    if (this[i] == v) return true;
  }
  return false;
}


var gStateServer = null;
var gPeriodicTimer = null;
var gLastServerUpdate = null;
var gTableFontSize = 83;

var Init = function(stateserver_url) {
  UpdateTagsSelector();
  gStateServer = stateserver.open(stateserver_url, function(key, value) {
      HandleUpdateFromStateserver(key, value);
      gLastServerUpdate = new Date();
      RedrawTable();
    });

  RedrawTable();
  SchedulePeriodicRedrawTable();
};

var UpdateTagsSelector = function() {
  ResetTags();

  for (a in gActivities) {
    if (gActivities[a].tags) {
      UpdateTagCounts(gActivities[a].tags);
    }
  }

  MakeTagSelector(document.getElementById("tags"), RedrawTable);
};

var PeriodicRedrawTable = function() {
  RedrawTable();
  SchedulePeriodicRedrawTable();
};

var SchedulePeriodicRedrawTable = function() {
  gPeriodicTimer = window.setTimeout(PeriodicRedrawTable, 60 * 1000);
};

var PadWithZeroes = function(x, len) {
  var s = String(x);
  if (s.length < len) {
    s = '0' * (len - s.length) + s;
  }

  return s;
};

var DisplayTime = function(d) {
  if (!d)
    return 'never';

  // YYYY.MM.DD HH:MM:SS
  var s = '';

  s +=       PadWithZeroes(d.getFullYear(), 4);
  s += '.' + PadWithZeroes(d.getMonth() + 1, 2);
  s += '.' + PadWithZeroes(d.getDate() + 1, 2);
  s += ' ' + PadWithZeroes(d.getHours(), 2);
  s += ':' + PadWithZeroes(d.getMinutes(), 2);
  s += ':' + PadWithZeroes(d.getSeconds(), 2);

  return s;
};


var RedrawTable = function() {
  // Recreate the HTML <table> showing who's been working on what activity.
  // Assumes that there's a <div> on the page with id=data.  Replaces its
  // contents with this newly-created table.

  var d = document.getElementById("data");
  var now = (new Date()).valueOf();

  var table = document.createElement("table");
  table.frame = 'outline';
  table.rules = 'all';
  table.id = 'the_big_table';
  table.style.fontSize = gTableFontSize + '%';

  // Record that we're redrawing now and when the last data update was.
  var caption = table.createCaption();
  caption.align = 'bottom';
  caption.innerHTML = ('Last data update: ' + DisplayTime(gLastServerUpdate) +
		       ' Page created: ' + DisplayTime(new Date()));

  var tr;

  // Get a sorted list of users and activities.
  var compare_by_name = function(id1, id2, storage) {
    if (id1 == id2) return 0;
    // If item 2 doesn't have a name then item 1 wins by default.  And vice
    // versa.
    if (!storage[id2] || !storage[id2].name) return -1;
    if (!storage[id1] || !storage[id1].name) return 1;

    // TODO(corin): precompute this key.
    var name1 = storage[id1].name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    var name2 = storage[id2].name.toLowerCase().replace(/[^a-z0-9]+/g, "");

    if (name1 < name2) return -1;
    if (name1 > name2) return 1;
    return 0;
  };

  var sorted_users = new Array();
  for (u in gUsers) {
    // Show a user only if they have a name.
    if (gUsers[u].name) {
      sorted_users.push(u);
    }
  }
  sorted_users.sort(function(id1, id2) {
      return compare_by_name(id1, id2, gUsers); });


  // When was the most recent activity for each activity?
  var mostRecentActivity = {};
  for (u in gUsers) {
    var user = gUsers[u];

    for (a in gLastSeenTime[user.id]) {
      var t = LastSeenTime(user.id, a);
      if (mostRecentActivity[a] == null ||
	  t > mostRecentActivity[a]) {
	mostRecentActivity[a] = t;
      }
    }
  }

  var sortOrder;
  if (document.getElementById('radioAlpha').checked) {
    sortOrder = 'alpha';
  } else if (document.getElementById('radioRecency').checked) {
    sortOrder = 'recency';
  } else if (document.getElementById('radioRecencyReverse').checked) {
    sortOrder = 'recencyReverse';
  }

  var compare_activities = function(id1, id2) {
    var id1_is_nonpuzzle = (id1[0] == 'a');
    var id2_is_nonpuzzle = (id2[0] == 'a');

    // Puzzles precede non-puzzle activities.
    if (!id1_is_nonpuzzle && id2_is_nonpuzzle) return -1;
    if (id1_is_nonpuzzle && !id2_is_nonpuzzle) return 1;
    if (sortOrder == 'alpha') return compare_by_name(id1, id2, gActivities);
    var t1 = mostRecentActivity[id1];
    var t2 = mostRecentActivity[id2];
    if (sortOrder == 'recency') {
      if (t1 == t2) return 0;
      if (t2 == null) return -1;
      if (t1 == null) return 1;
      return t2 - t1;
    } else if (sortOrder == 'recencyReverse') {
      if (t1 == t2) return 0;
      if (t2 == null) return 1;
      if (t1 == null) return -1;
      return t1 - t2;
    }
  };

  var sorted_activities = new Array();
  for (a in gActivities) {
    sorted_activities.push(a);
  }
  sorted_activities.sort(compare_activities);
  
  // Header row showing each user name.
  tr = document.createElement("tr");
  tr.appendChild(document.createElement("td"));
  for (var u = 0; u < sorted_users.length; u++) {
    var user = gUsers[sorted_users[u]];
    var td = document.createElement("td");
    td.innerHTML = user.name;
    td.onclick = BindRenameWidget(td, user);
    tr.appendChild(td);
  }
  table.appendChild(tr);

  var selected_tags = GetSelectedTags();
  var shade_this_row = false;

  // One row per activity.
  for (var a = 0; a < sorted_activities.length; a++) {
    var activity = gActivities[sorted_activities[a]];
    var tags_match = TagsMatch(selected_tags, activity.tags);
    
    var show_activity = ((tags_match && !IsSelectionInverted()) ||
			 (!tags_match && IsSelectionInverted()));

    if (!show_activity) {
      log('Not showing activity ' + activity.name);
      continue;
    }

    tr = document.createElement('tr');

    // Every other row is lightly highlighted.
    if (shade_this_row) {
      tr.style.backgroundColor = '#eef';
    }
    shade_this_row = !shade_this_row;

    var td = document.createElement('td');
    td.innerHTML = activity.name;
    if (activity.IsNonPuzzleActivity()) {
      // Non-puzzle activity.
      td.className = 'nonpuzzle';
      td.onclick = BindRenameWidget(td, activity);
    }
    tr.appendChild(td);

    for (var u = 0; u < sorted_users.length; u++) {
      var user = gUsers[sorted_users[u]];

      td = document.createElement('td');
      if (LastSeenTime(user.id, activity.id) > 0) {
	td.innerHTML = MakeAgoString(now, LastSeenTime(user.id, activity.id));
	if (IsActiveAssignment(user.id, activity.id) &&
	    IsExclusiveAssignment(user.id, activity.id)) {
	  td.className = 'active';
	} else if (IsActiveAssignment(user.id, activity.id)) {
	  td.className = 'nonexclusive';
	} else {
	  td.className = 'nonactive';
	}
      }

      td.onclick = BindShowUpdateWidget(td, user, activity);

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  d.innerHTML = ''
  d.appendChild(table);
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
}

var BindShowUpdateWidget = function(td, user, activity) {
  // Returns a wrapper around ShowUpdateWidget for this user and activity.
  // This function, and this wrapper, are needed in order to curry user
  // and activity with their present values, rather than the variables scoped
  // by the caller (which change while the loop is executing).

  return function() { ShowUpdateWidget(td, user, activity); };
};
  

var ShowUpdateWidget = function(td, user, activity) {
  // Click on the user/activity cell.  Show a menu of choices: now working on
  // this activity, worked on it recently, never worked on it.

  // Create the div with the buttons.
  // Position the div absolutely and with respect to the corner of the
  // user/activity cell.
  // Bind the button functions.

  var div = document.getElementById('divUpdateWidget');
  var now = (new Date()).valueOf();

  document.getElementById('btnCurrently').onclick = function() {
    UpdateStatusAndRedraw(user, activity, now, true, null);
  };
  document.getElementById('btnRecently').onclick = function() {
    // 15 minutes ago.
    UpdateStatusAndRedraw(user, activity, now - 15 * 60 * 1000, true, null);
  };
  if (!IsExclusiveAssignment(user.id, activity.id)) {
    log('setting class to nonexclusive');
    document.getElementById('btnCurrently').className = 'nonexclusive';
    document.getElementById('btnRecently').className = 'nonexclusive';
  }
  document.getElementById('btnNoLonger').onclick = function() {
    var then = LastSeenTime(user, activity);
    if (then == 0) {
      then = now;
    }
    UpdateStatusAndRedraw(user, activity, then, false, true);
  };
  document.getElementById('btnNever').onclick = function() {
    UpdateStatusAndRedraw(user, activity, 0, false, true);
  };
  document.getElementById('btnCancel').onclick = function() {
    div.style.visibility = 'hidden';
  };
  document.getElementById('btnMakeExclusive').onclick = function() {
    UpdateStatusAndRedraw(user, activity, now, true, true);
  };
  document.getElementById('btnMakeNonExclusive').onclick = function() {
    UpdateStatusAndRedraw(user, activity, now, true, false);
  };

  if (IsExclusiveAssignment(user.id, activity.id)) {
    document.getElementById('btnMakeExclusive').style.display = 'none';
    document.getElementById('btnMakeNonExclusive').style.display = 'block';
    document.getElementById('checkboxToggleAdvanced').checked = false;
    document.getElementById('divAdvanced').style.display = 'none';
  } else {
    document.getElementById('btnMakeExclusive').style.display = 'block';
    document.getElementById('btnMakeNonExclusive').style.display = 'none';
    document.getElementById('checkboxToggleAdvanced').checked = true;
    document.getElementById('divAdvanced').style.display = 'block';
  }

  // Place the widget near the cell we're editing and show it.
  div.style.visibility = 'visible';
  table = td.parentNode.parentNode;

  var left = table.offsetLeft + td.offsetLeft + 10;
  var top = table.offsetTop + td.offsetTop + 10;

  div.style.left = left;
  div.style.top = top;
};

var UpdateStatusAndRedraw = function(user, activity, when, active, exclusive) {
  UpdateStatus(user, activity, when, active, exclusive);

  var div = document.getElementById('divUpdateWidget');
  div.style.visibility = 'hidden';

  RedrawTable();
};

var BindRenameWidget = function(td, item) {
  return function() { ShowRenameWidget(td, item); };
};
  

var ShowRenameWidget = function(td, item) {
  // TODO(corin): factor out the code common between here and ShowUpdateWidget.
  var div = document.getElementById('divRenameWidget');

  document.getElementById('inputName').value = item.name;
  document.getElementById('inputName').onchange = function() {
    UpdateName(item);
  };
  document.getElementById('btnCancelRename').onclick = function() {
    div.style.visibility = 'hidden';
  };

  // Place the widget near the cell we're editing and show it.
  div.style.visibility = 'visible';
  table = td.parentNode.parentNode;

  var left = table.offsetLeft + td.offsetLeft + 10;
  var top = table.offsetTop + td.offsetTop + 10;

  div.style.left = left;
  div.style.top = top;
};

var UpdateName = function(item) {
  var div = document.getElementById('divRenameWidget');
  div.style.visibility = 'hidden';

  item.name = document.getElementById('inputName').value;
  RedrawTable();

  // Update stateserver with this information.
  gStateServer.set(item.id + '.name', item.name);
};

var AddPerson = function(input) {
  // Manually add a new person.
  var user = InternalAddPerson(-1, input.value)

  RedrawTable();
  input.value = '';
};

var AddActivity = function(input) {
  // Manually add a new activity.
  var activity = InternalUpdateActivity(-1, input.value);

  RedrawTable();
  input.value = '';
};

var ToggleAutoUpdate = function(input) {
  if (input.value) {
    // off -> on: redraw and start timer.
    RedrawTable();
    SchedulePeriodicRedrawTable();
  } else {
    // on -> off: clear timer.
    if (gPeriodicTimer) {
      window.clearTimeout(gPeriodicTimer);
      gPeriodicTimer = null;
    }
  }
};

var TableFontSizeBigger = function() {
  gTableFontSize = Math.floor(gTableFontSize * 1.25);
  document.getElementById('the_big_table').style.fontSize = gTableFontSize + '%';
  // Don't bother redrawing it because we're resizing it directly.
  //  RedrawTable();
};

var TableFontSizeSmaller = function() {
  gTableFontSize = Math.floor(gTableFontSize * 0.8);
  document.getElementById('the_big_table').style.fontSize = gTableFontSize + '%';
  // Don't bother redrawing it because we're resizing it directly.
  //  RedrawTable();
};
