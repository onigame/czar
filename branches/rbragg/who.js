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
var gTableFontSize = 80;  // percentage of font-size for the table as
                          // compared to the rest of the document.
var gNumCellsBetweenBreaks = 5;
var gNumCellsBetweenHeaders = 25;

var Init = function() {
  stateserver_url = config.server_url + config.hunt_id
  UpdateTagsSelector();
  gStateServer = stateserver.open(stateserver_url, function(key, value) {
      HandleUpdateFromStateserver(key, value);
      Notifications.HandleUpdateFromStateserver(key, value);
      gLastServerUpdate = new Date();
      RedrawTableSoon();
    });
  Notifications.Init(gStateServer);
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

var gOneRedrawTimer = null;
var RedrawTableSoon = function() {
  if (gOneRedrawTimer == null) {
    gOneRedrawTimer = window.setTimeout(function() {
	gOneRedrawTimer = null;
	RedrawTable();
      }, 250);
  }
}

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

var GetUserSortOrder = function() {
  var sortOrder;
  if (document.getElementById('columnsAlpha').checked) {
    sortOrder = 'alpha';
  } else if (document.getElementById('columnsRecency').checked) {
    sortOrder = 'recency';
  } else if (document.getElementById('columnsRecencyReverse').checked) {
    sortOrder = 'recencyReverse';
  } else if (document.getElementById('columnsActivity').checked) {
    var select = document.getElementById('columnsActivitySelect');
    sortOrder = select.options[select.selectedIndex].value;
  }

  return sortOrder;
};

var GetActivitySortOrder = function() {
  var sortOrder;
  if (document.getElementById('radioAlpha').checked) {
    sortOrder = 'alpha';
  } else if (document.getElementById('radioRecency').checked) {
    sortOrder = 'recency';
  } else if (document.getElementById('radioRecencyReverse').checked) {
    sortOrder = 'recencyReverse';
  } else if (document.getElementById('radioNumActives').checked) {
    sortOrder = 'numActives';
  } else if (document.getElementById('radioUser').checked) {
    var select = document.getElementById("sortUserSelect");
    sortOrder = select.options[select.selectedIndex].value;
  }

  return sortOrder;
};

var GetSortedUsers = function(sortOrder, mostRecentActivity) {
  var compare_users = function(id1, id2) {
    if (sortOrder == 'alpha') {
      return compare_by_name(id1, id2, gUsers);
    }
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
    } else {
      // sortOrder is an activity_id
      t1 = LastSeenTime(id1, sortOrder);
      t2 = LastSeenTime(id2, sortOrder);
      if (t1 == t2) return 0;
      if (t2 == 0) return -1;
      if (t1 == 0) return 1;
      return t2 - t1;
    }
  }


  var sorted_users = new Array();
  for (u in gUsers) {
    // Show a user only if they have a name.
    if (gUsers[u].name) {
      sorted_users.push(u);
    }
  }

  sorted_users.sort(compare_users);

  return sorted_users;
};

var GetSortedActivities = function(sortOrder,mostRecentActivity,
				   peoplePerActivity) {
  var compare_activities = function(id1, id2) {
    var id1_is_nonpuzzle = (id1[0] == 'a');
    var id2_is_nonpuzzle = (id2[0] == 'a');

    // Puzzles precede non-puzzle activities.
    if (sortOrder == 'alpha') {
      if (!id1_is_nonpuzzle && id2_is_nonpuzzle) return -1;
      if (id1_is_nonpuzzle && !id2_is_nonpuzzle) return 1;
      return compare_by_name(id1, id2, gActivities);
    }
    var t1 = mostRecentActivity[id1];
    var t2 = mostRecentActivity[id2];
    if (sortOrder == 'recency') {
      if (!id1_is_nonpuzzle && id2_is_nonpuzzle) return -1;
      if (id1_is_nonpuzzle && !id2_is_nonpuzzle) return 1;
      if (t1 == t2) return 0;
      if (t2 == null) return -1;
      if (t1 == null) return 1;
      return t2 - t1;
    } else if (sortOrder == 'recencyReverse') {
      if (!id1_is_nonpuzzle && id2_is_nonpuzzle) return -1;
      if (id1_is_nonpuzzle && !id2_is_nonpuzzle) return 1;
      if (t1 == t2) return 0;
      if (t2 == null) return 1;
      if (t1 == null) return -1;
      return t1 - t2;
    } else if (sortOrder == 'numActives') {
      if (!id1_is_nonpuzzle && id2_is_nonpuzzle) return -1;
      if (id1_is_nonpuzzle && !id2_is_nonpuzzle) return 1;
      var p1 = peoplePerActivity[id1];
      var p2 = peoplePerActivity[id2];
      if (p1 == p2) return 0;
      if (p1 == null) return 1;
      if (p2 == null) return -1;
      return p2 - p1;
    } else {
      // sortOrder is a user_id
      t1 = LastSeenTime(sortOrder, id1);
      t2 = LastSeenTime(sortOrder, id2);
      if (t1 == t2) return 0;
      if (t2 == 0) return -1;
      if (t1 == 0) return 1;
      return t2 - t1;
    }
  };

  var sorted_activities = new Array();
  for (a in gActivities) {
    // Show an activity only if it has a name.
    if (gActivities[a].name) {
      sorted_activities.push(a);
    }
  }
  sorted_activities.sort(compare_activities);

  return sorted_activities;
};

var RadioUserSelected = function() {
  // We just had a request to sort by users.  Populate the sortUserSelect select
  // tag with the list of users and allow them to callback.
  sorted_users = GetSortedUsers('alpha');
  
  var select = document.getElementById("sortUserSelect");

  select.innerHTML = '';
  for (var i = 0; i < sorted_users.length; i++) {
    var user = gUsers[sorted_users[i]];
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(user.name));
    option.value = user.id;
    select.appendChild(option);
    option.selected = true;
  }

  select.disabled = false;
  select.onchange = RedrawTable;
  RedrawTable;
};


var SortByActivitySelected = function() {
  // We just had a request to sort by activity.  Populate the select tag with
  // the list of activities and allow them to callback.
  var sorted_activities = GetSortedActivities('alpha');
  var select = document.getElementById("columnsActivitySelect");

  select.innerHTML = '';
  for (var i = 0; i < sorted_activities.length; i++) {
    var activity = gActivities[sorted_activities[i]];
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(activity.name));
    option.value = activity.id;
    select.appendChild(option);
    option.selected = true;
  }

  select.disabled = false;
  select.onchange = RedrawTable;
  RedrawTable;
};


var IsSolved = function(activity) {
  if (!activity || !activity.tags)
    return false;

  var tags = activity.tags.split(',');
  return tags.indexOf('solved') != -1;
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
  table.style.fontSize = '75%';

  // Record that we're redrawing now and when the last data update was.
  var caption = table.createCaption();
  caption.align = 'bottom';
  caption.innerHTML = ('Last data update: ' + DisplayTime(gLastServerUpdate) +
		       ' Page created: ' + DisplayTime(new Date()));

  var tr;

  // When was the most recent activity for each activity and each user?
  var mostRecentActivity = {};
  var peoplePerActivity = {};  // Counts only active assignments.
  for (u in gUsers) {
    var user = gUsers[u];

    for (a in gLastSeenTime[user.id]) {
      if (!IsActiveAssignment(user.id, a)) {
      	// We care about only active assignments.  Not interesting
      	// to sort by "recently, stopped working on X."
      	continue;
      }
      var t = LastSeenTime(user.id, a);
      if (mostRecentActivity[a] == null ||
          t > mostRecentActivity[a]) {
        mostRecentActivity[a] = t;
      }
      if (mostRecentActivity[u] == null ||
          t > mostRecentActivity[u]) {
        mostRecentActivity[u] = t;
      }
      if (IsActiveAssignment(u, a)) {
        if (peoplePerActivity[a] == null) {
          peoplePerActivity[a] = 1;
        } else {
          peoplePerActivity[a]++;
        }
      }
    }
  }

  var sorted_users = GetSortedUsers(GetUserSortOrder(), mostRecentActivity);
  var sorted_activities = GetSortedActivities(GetActivitySortOrder(),
					      mostRecentActivity,
					      peoplePerActivity);
  
  // Header row showing each user name.
  var AddHeaderRow = function() {
    var whoami = cookies.get('whoami');
    var tr = document.createElement("tr");
    for (var u = 0; u < sorted_users.length; u++) {
      if (u % gNumCellsBetweenBreaks == 0) {
        tr.appendChild(document.createElement("td"));
      }
      var user = gUsers[sorted_users[u]];
      var td = document.createElement("td");
      td.style.verticalAlign = 'top';
      td.style.whiteSpace = 'nowrap';
      td.style.fontWeight = 'bold';
      td.style.textAlign = 'center';
      td.innerHTML = user.name;
      td.onclick = BindRenameWidget(td, user);
      if (whoami == user.id) {
        td.style.backgroundColor = '#ff6'
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  };

  var AddHorizontalGap = function() {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = sorted_users.length + 
      sorted_users.length/gNumCellsBetweenBreaks + 1;
    td.style.backgroundColor = '#ccc';
    tr.appendChild(td);
    table.appendChild(tr);
  }
  
  var selected_tags = GetSelectedTags();
  var shade_this_row = true;

  // One row per activity.
  var num_rows = 0;
  for (var a = 0; a < sorted_activities.length; a++) {
    var activity = gActivities[sorted_activities[a]];
    var tags_match = TagsMatch(selected_tags, activity.tags);
    
    var show_activity = ((tags_match && !selected_tags.invert) ||
			 (!tags_match && selected_tags.invert));

    if (!show_activity) {
      log('Not showing activity ' + activity.name);
      continue;
    }
    
    if (num_rows % gNumCellsBetweenHeaders == 0) {
      // Every 30 activities show the header row again.
      AddHeaderRow();
    } else if (num_rows % gNumCellsBetweenBreaks == 0) {
      AddHorizontalGap();
    }

    num_rows++;
    tr = document.createElement('tr');

    // Every other row is lightly highlighted.
    if (shade_this_row) {
      tr.style.backgroundColor = '#eef';
    }
    shade_this_row = !shade_this_row;

    var AddActivityCell = function() {
      var td = document.createElement('td');
      td.style.whiteSpace = 'nowrap';
      td.style.fontWeight = 'bold';
      td.innerHTML = activity.name;
      if (IsSolved(activity)) {
        td.innerHTML += ' <font color=green>&#x2714;</font>'
      }
      if (!activity.IsNonPuzzleActivity()) {
        if (activity.tags == '') {
          td.title = 'No tags.';
        } else {
          td.title = activity.tags;
        }
      }
      if (activity.IsNonPuzzleActivity()) {
        // Non-puzzle activity.
        td.className = shade_this_row ? 'nonpuzzlelt' : 'nonpuzzledk';
        if (!activity.IsJobToDisplay()) {
          td.onclick = BindRenameWidget(td, activity);
        }
      }
      tr.appendChild(td);
    }

    var AddVerticalGap = function() {
      var td = document.createElement('td');
      td.style.backgroundColor = '#ccc';
      tr.appendChild(td);
    }
    
    for (var u = 0; u < sorted_users.length; u++) {
      var user = gUsers[sorted_users[u]];

      if (u % gNumCellsBetweenHeaders == 0) {
        AddActivityCell();
      } else if (u % gNumCellsBetweenBreaks == 0) {
        AddVerticalGap();
      }
      
      var td = document.createElement('td');
      if (LastSeenTime(user.id, activity.id) > 0) {
      	var ago =  MakeAgoString(now, LastSeenTime(user.id, activity.id));
      	td.innerHTML = ago;
      	td.title = user.name + ' was doing ' + activity.name + ' ' + ago + ' ago.';
      	if (IsActiveAssignment(user.id, activity.id) && IsSolved(activity)) {
      	  td.className = 'activeOnSolved';
      	} else if (IsActiveAssignment(user.id, activity.id) &&
      	    IsExclusiveAssignment(user.id, activity.id)) {
      	  td.className = 'active';

          // Color hack -- if we haven't seen someone in a while,
          // start turning their color to red.  They start losing
          // their green at 2 hours and get to full red at 6 hours.
          var ago = now - LastSeenTime(user.id, activity.id); // milliseconds
          ago = ago / 1000 / 60.0 / 60.0 / 4.0;  // 6 hours is 1.5, 0 hours is 0
          ago -= 0.5;  // 6 hours is 1.0, 2 hours is 0
          if (ago < 0) { ago = 0; }  // range > 0 (float)
          if (ago > 1) { ago = 1; }  // range 0-1 (float)
          ago = parseInt(255 * ago);  // range 0-255 (int)
          td.style.backgroundColor = "rgb(" + (ago) + "," + (256-ago) + ",0)";

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

  document.getElementById('btnExclusively').onclick = function() {
    UpdateStatusAndRedraw(user, activity, now, true, true);
  };
  document.getElementById('btnNonExclusively').onclick = function() {
    UpdateStatusAndRedraw(user, activity, now, true, false);
  };
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

  // Place the widget near the cell we're editing and show it.
  div.style.visibility = 'visible';
  table = td.parentNode.parentNode;

  var left = table.offsetLeft + td.offsetLeft + 10;
  var top = table.offsetTop + td.offsetTop + 10;

  // Don't show the widget beyond the right side of the page.
  if (left + div.offsetWidth > document.body.clientWidth) {
    left = document.body.clientWidth - div.offsetWidth;
  }

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

  var value = document.getElementById('inputName').value;
  if (value || confirm("Delete \"" + item.name + "\" forever?")) {
    item.name = document.getElementById('inputName').value;
    RedrawTable();
    // Update stateserver with this information.
    gStateServer.set(item.id + '.name', item.name);
  }
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

var CreateTestData = function() {
  // For safety's sake.  Remove this return to actually create test data.
  // Note that it sends this data to the stateserver so you need to create
  // it only once per channel you want to test with.
  return;

  // Make puzzles with metas.  Expect about 11 metas with 7 puzzles each.
  for (var m = 0; m < 11; m++) {
    for (var p = 0; p < 7; p++) {
      var id;
      // p is for puzzle.
      do id = "p" + Math.floor(Math.random() * 10000);
      while (gActivities[id]);
      
      gStateServer.set(id + '.label', 'Puzzle ' + m + '.' + p);
      gStateServer.set(id + '.tags', 'meta' + m);
    }
  }

  // Some non-puzzle activities.
  for (var a = 0; a < 8; a++) {
    InternalUpdateActivity(-1, 'Activity ' + a);
  }

  // Create some people.
  for (var u = 0; u < 20; u++) {
    InternalAddPerson(-1, 'Person ' + u);
  }

};
