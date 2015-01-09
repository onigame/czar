// Each puzzle is represented by a <form> object.  The form has fields
// for the puzzle name, status, etc.  <form>s are stored in a hidden div
// on the host HTML page.

// Data is stored in stateserver as form.field = value.

var gStateServer = null;
// A timer for sort_forms.  Really, though, it's a mutex to ensure we
// enqueue only one "please call sort_forms sometime soon" at a time.
var the_sort_timeout = null;

var on_blur = function(event) {
  if (this.className == "dirty") {
    if (this.value == this.czar_oldvalue)
      this.className = "focused";
    else if (this.czar_autosubmit)
      this.form.onsubmit();
  }

  if (!this.value && (!this.className || this.className == "focused")) {
    this.className = "empty";
    this.value = this.czar_prompt;
  } else if (this.className == "focused") {
    this.className = "";
  }
}

var on_change = function(event) {
  if (this.className != "empty" && this.value != this.czar_oldvalue)
    this.className = "dirty";
  return true;
}

var on_focus = function(event) {
  // Handler for <input> onFocus event.

  if (this.form.czar_deadline)
    send_value(this.form, "deadline", null);

  if (!this.className || this.className == "empty") {
    if (this.className == "empty") this.value = "";
    this.className = "focused";
  }
}

var on_keypress = function(event) {
  if (window.event) event = window.event;
  if (event.keyCode == 13) {
    this.blur();
    if (!this.czar_autosubmit) this.form.onsubmit();
    return false;
  } else {
    return true;
  }
}

var on_submit_edit = function() {
  // Callback for when any field of the puzzle form is changed.

  for (var i = 0; i < this.length; ++i) {
    var input = this.elements[i];
    if (input.className == "dirty") {
      input.className = "";
      if (input.name == "label") {
        if (!input.value && input.czar_oldvalue) {
          // start countdown to delete puzzle
          input.value = input.czar_oldvalue;
          send_value(this, "deadline", new Date().getTime() + 20000);
        } else if (input.value) {
          docid = this["docid"].value;
          if (!docid || renameSpreadsheet(docid, input.value)) {
            send_value(this, input, input.value);
          } else {
            input.value = input.czar_oldvalue;
          }
        }
      } else {
        if (input.name == "tags") {
          input.value = SanitizeTagList(input.value);
        }
        send_value(this, input, input.value);
        if (input.name == "tags") {
          UpdateTagsSelector();
          MaybeHandleSolvedPuzzle(this.name, input.value);
        }
      }
      if (!input.className)
        input.className = "inflight";
    }
  }
  return false;
};

var MaybeRecolorSheet = function(puzzle_id, new_tags) {
  log('MaybeRecolorSheet(' + puzzle_id + ', ' + new_tags + ')');
  var tags = new_tags.split(',');
  if (tags.indexOf('nosheet') != -1) {
    document.getElementById(puzzle_id + ".sheet").style.color = "#FF0000";
    document.getElementById(puzzle_id + ".sheet").style.textDecoration = "line-through";
  } else {
    document.getElementById(puzzle_id + ".sheet").style.color = "";
    document.getElementById(puzzle_id + ".sheet").style.textDecoration = "";
  }
}

var gSolvedPuzzles = [];
var MaybeHandleSolvedPuzzle = function(puzzle_id, new_tags) {
  log('MaybeHandleSolvedPuzzle(' + puzzle_id + ', ' + new_tags + ')');

  // Is "solved" one of the tags mentioned?
  var tags = new_tags.split(',');
  if (tags.indexOf('solved') == -1) {
    // Not solved yet.
    if (gSolvedPuzzles.indexOf(puzzle_id) != -1) {
      // Weird case: human removed the "solved" tag.
      gSolvedPuzzles.splice(gSolvedPuzzles.indexOf(puzzle_id), 1);
    }
    return;
  }

  // Is it newly solved?
  if (gSolvedPuzzles.indexOf(puzzle_id) >= 0) {
    // Already solved.
    return;
  }

  gSolvedPuzzles.push(puzzle_id);

  // get a list of all users who are working and were working on this puzzle.
  var actives = [];
  var inactives = [];
  for (u in gUsers) {
    if (gUsers[u].name && IsActiveAssignment(gUsers[u].id, puzzle_id)) {
      actives.push(gUsers[u].name);
    } else if (gUsers[u].name && LastSeenTime(gUsers[u].id, puzzle_id)) {
      inactives.push(gUsers[u].name);
    }
  }
  var info_message = '<div style="font-size:60%">';
  if (actives.length > 0) info_message += '<br>Active Solvers: ' + actives.join(', ');
  if (inactives.length > 0) info_message += '<br>Previous Solvers: ' + inactives.join(', ');
  info_message += '<br>Final Status: ' + new_tags + '</div>';

  if (tags.indexOf('meta') == -1) {
    Notifications.Send('We just solved ' + gActivities[puzzle_id].name + '!' + info_message,
			'puzzle');
  } else {
    Notifications.Send('We just solved a meta:<br>' + gActivities[puzzle_id].name + info_message,
			'meta');
  }
  
  // Unassign all users assigned to this puzzle.
  for (u in gUsers) {
    if (IsActiveAssignment(gUsers[u].id, puzzle_id)) {
      UpdateStatus(gUsers[u], gActivities[puzzle_id], null, false, true);
    }
  }  
}

var on_submit_create = function() {
  // Callback for creating a new puzzle by means of the link at the top
  // of the page.

  if (this.label.className == "dirty") {
    var label = this.label.value;
    this.label.className = "empty";
    this.label.value = this.label.czar_prompt;
    this.label.blur();

    // Does the label contain a URL as its last term?
    var i = label.lastIndexOf(" ");
    var puzurl = "";
    if (i != -1) {
      var lastterm = label.substring(i+1);
      var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      if (pattern.test(lastterm)) {
        puzurl = lastterm;
        label = label.substring(0,i);
      }
    }

    if (label) {
      var name = null;
      // p is for puzzle.
      do name = "p" + Math.floor(Math.random() * 10000);
      while (document.forms[name]);

      if (createSpreadsheet(label, function(id, url) {
        send_value(name, "docid", id);
        send_value(name, "sheet", url);
      })) {
        send_value(name, "label", label);
        if (puzurl) {
          send_value(name, "puzzle", puzurl);
        }
        var form = document.forms[name];
        if (this.label.className != "dirty")
          form.label.className = "inflight";
  
        sort_forms();
        form.status.focus();
      }
    }
  }
  return false;
}

var watch_deadline = function(form) {
  // This procedure is something about deleting forms.

  if (form.czar_timeout) {
    window.clearTimeout(form.czar_timeout);
    form.czar_timeout = null;
  }

  if (!form.czar_deadline) {
    if (form.className == "marked" || form.className == "deleted") {
      form.className = "";
      form.status.disabled = false;
      if (!form.status.czar_oldvalue) {
        form.status.className = "empty";
        form.status.value = form.status.czar_prompt;
      } else {
        form.className = "";
        form.status.value = form.status.czar_oldvalue;
      }
    }
    return;
  }

  var callme = function() { watch_deadline(form); }
  var now = new Date().getTime();
  if (now < form.czar_deadline) {
    if (form.className != "marked") {
      form.className = "marked";
      form.status.blur();
      form.status.disabled = true;
      form.czar_timeout = window.setTimeout(callme, 0);
    } else {
      form.status.disabled = false;
      form.czar_timeout = window.setTimeout(callme, 1000);
    }
    var secs = Math.round((form.czar_deadline - now) / 1000);
    if (secs == 0) {
      form.status.value = "already DELETED, just waiting for server to realize it";
    } else {
      form.status.value = "DELETED in " + secs + " seconds (click to undo)";
    }
    form.status.className = "countdown";
  } else if (form.className == "deleted") {
    send_value(form, "label", null);
    send_value(form, "deadline", null);
    for (var i = 0; i < form.elements.length; ++i) {
      if (form.elements[i].name != "label")
        send_value(form, form.elements[i].name, null);
    }
  } else {
    var delay = 60000 + Math.random() * 60000;
    form.className = "deleted";
    form.czar_timeout = window.setTimeout(callme, delay);
  }
};

var sort_forms = function() {
  if (the_sort_timeout) window.clearTimeout(the_sort_timeout);
  the_sort_timeout = null;

  var compare_form = function(a, b) {
    if (!a.czar_sortkey) return b.czar_sortkey ? -1 : 0;
    if (!b.czar_sortkey) return 1;
    if (a.czar_sortkey < b.czar_sortkey) return -1;
    if (a.czar_sortkey > b.czar_sortkey) return 1;
    return 0;
  }

  var forms = [];
  for (var i = 0; i < document.forms.length; ++i)
    forms[i] = document.forms[i];

  forms.sort(compare_form);

  var parent = document.getElementById("items");
  var next = parent.firstChild;
  var odd = 0;
  for (var i = 0; i < forms.length; ++i) {
    var form = forms[i];
    if (form && form.name != "create" && form.czar_sortkey) {
      while (next != null && next != form) next = next.nextSibling;
      if (next == form)
        next = next.nextSibling;
      else
        parent.insertBefore(form, next);
    }
    if (!form.classList.contains("deleted")) {
      if (odd) {
        form.classList.add("shaded");
      } else {
        form.classList.remove("shaded");
      }
      odd = !odd;
    }
  }
  UpdateTagsSelector();

  // Overkill, but: needed because <div id=items> isn't populated until
  // the first sort_form call, which may be after whoami is set (which is
  // the only other time UpdateAssignButtons() gets called at startup).
  UpdateAssignButtons();
}

var bind_input = function(input, prompt) {
  // Add event handlers for an <input> field.

  input.className = "empty";
  input.czar_autosubmit = true;
  input.czar_oldvalue = "";
  input.czar_prompt = prompt;
  input.onblur = on_blur;
  input.onchange = on_change;
  input.onfocus = on_focus;
  input.onkeypress = on_keypress;
  input.onkeyup = on_change;
  input.value = prompt;
  return input;
}

var bind_link = function(form, name, prompt) {
  // Handler for adding a link to a puzzle.  Includes adding a tooltip for
  // this field.

  var link = document.getElementById(form.name + "." + name);
  var input = form[name];
  var tooltip = input.parentNode;
  var timeout = null;

  bind_input(input, prompt);

  var show_tip  = function() {
    timeout = null;

    var elem = link;
    var x = y = 0;
    while (elem) {
      x += elem.offsetLeft;
      y += elem.offsetTop;
      elem = elem.offsetParent;
    }

    tooltip.style.visibility = "visible";
    tooltip.style.zIndex = 1;
    tooltip.style.left = x + 5;
    tooltip.style.top = y + 10;
  }

  var hide_tip  = function() {
    timeout = null;
    if (!input.className || input.className == "empty") {
      tooltip.style.visibility = "hidden";
    } else {
      timeout = window.setTimeout(hide_tip, 100);  // Hack: punt
    }
  }

  link.onmouseover = function() {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(show_tip, 700);
  }

  link.onmouseout = function() {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(hide_tip, 100);
  }

  tooltip.onclick = link.onclick = function() {
    if (link.className == "missing") {
      if (timeout) window.clearTimeout(timeout);
      show_tip();
      input.focus();
      return false;
    }
  }

  tooltip.onmouseover = function() {
    if (timeout) window.clearTimeout(timeout);
    timeout = null;
  }

  tooltip.onmouseout = function() {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(hide_tip, 100);
  }
}

var the_form_html =
  "<form name=@NAME@>" +
  "<input type=hidden id=@NAME@.docid name=docid>" +
  "<input type=text name=label size=35 style='font-weight: bold'>" +
  "<a class=missing target=@NAME@.puzzle id=@NAME@.puzzle>puzzle</a>" +
  "<span class=tooltip><input type=text name=puzzle size=30></span>" +
  "<a class=missing target=@NAME@.sheet id=@NAME@.sheet>sheet</a>" +
  "<span class=tooltip><input type=text name=sheet size=30></span>" +
  "<input type=text name=status size=50 style='width:32em'>" +
  "<input type=text id=@NAME@.tags name=tags size=20>" +
  "<span style='cursor:pointer;cursor:hand;display:inline-block;width:2em' id=@NAME@.actives " +
      "class=actives>(0p)</span>" +
  "<input type=submit id=@NAME@.assignbutton value='WhoRU?'" +
      " style='background-color:#888;color:#555;font-size:80%;border:2px outset;width:5em'" +
      " title='Please tell me who you are (upper-left).'>" +
  "</form>";


var add_user_to_whoami = function(whoami, user_key, user_name) {

  log("adding " + user_key + " " + user_name + " to whoami");

  // Create a canonical name used for sorting.  We hide this
  // in the "id" tag of the option.
  var canon_name = "whoami_sortkey_" + user_name.toLowerCase().replace(/[^a-z0-9]+/g, "");

  // Create an option element for the new user.
  var option = document.createElement('option');
  option.appendChild(document.createTextNode(user_name));
  option.id = canon_name;
  option.value = user_key;

  // Insert new option at its appropriately-sorted position.
  var i = 0;
  while (i < whoami.childNodes.length && whoami.childNodes[i].id < canon_name) {
    i++;
  }
  if (i == whoami.childNodes.length) {
    // past the last element
    whoami.appendChild(option);
  } else {
    whoami.insertBefore(option, whoami.childNodes[i]);
  }

  // Check the document cookies -- is this user_key the current user?
  if (user_key == cookies.get('whoami')) {
    option.selected = true;
    UpdateAssignButtons();
  }
};

var make_form = function(name) {
  // Makes a new form to represent a single puzzle.

  var tmp = document.getElementById("tmp");
  tmp.innerHTML = the_form_html.replace(/@NAME@/g, name);

  // deal with the assign button.
  var assignbutton = document.getElementById(name + '.assignbutton');
  assignbutton.onclick = function() {
    log('assignbutton for ' + name + ' clicked');
    var whoami = document.getElementById('whoami');
    var uid = whoami.options[whoami.selectedIndex].value;
    if (uid == "") {
      log('no valid name');
      alert("Please tell me who you are first! (upper-left of page)");
    } else {
      log('assigning uid ' + uid);
      UpdateStatus(gUsers[uid], gActivities[name],
                   (new Date()).valueOf(), true, null);
    }
  }

  var form = tmp.firstChild;
  form.onsubmit = on_submit_edit;
  // Move the newly minted form to the "unsorted" div for permanent storage.
  document.getElementById("unsorted").appendChild(form);
  bind_input(form.label, "");
  // One-line status.
  bind_input(form.status, "Click to enter puzzle status");
  bind_input(form.tags, "No tags");
  // Direct link to the puzzle on GC's site.
  bind_link(form, "puzzle", "Click to enter puzzle URL");
  // Link to the spreadsheet.
  bind_link(form, "sheet", "Click to enter spreadsheet URL");

  // Deal with the tooltip.
  //"<span style='cursor:pointer;cursor:hand;display:inline-block;width:2em' id=@NAME@.actives " +
  $("#" + name + "\\.actives").tooltip({
    items: "#" + name + "\\.actives",
    content: function() {
      return GetActives(name);
    }
  });

  UpdateActives(name);

  return form;
}

var on_label_change = function(form, value) {
  // Callback for changing the name of a puzzle.

  if (!value) {
    document.getElementById("items").removeChild(form);
    return;
  }

  var pad = function(str, pre, digits) {
    var zero = "00000000000000000000";
    return pre + zero.substr(digits.length) + digits;
  }

  var padded = value.replace(/(^|[^\d.].?)(\d+)/g, pad);
  form.czar_sortkey = padded.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (the_sort_timeout) window.clearTimeout(the_sort_timeout);
  the_sort_timeout = window.setTimeout(sort_forms, 0);
};

var UpdateActivityHack = function(aid) {
  UpdateActives(aid);
  UpdateAssignButtons();
  UpdateMyStatus();
  UpdateJobsToDisplay();
};

var UpdatePersonHack = function(uid) {
  for (a in gActivities) {
    if (LastSeenTime(uid, a)) {
      UpdateActives(a);
    }
  }
  UpdateAssignButtons();
  UpdateMyStatus();
  UpdateJobsToDisplay();
};

var UpdateMyStatus = function() {
  var mystatus = document.getElementById("mystatus");
  var whoami = document.getElementById('whoami');
  var uid = whoami.options[whoami.selectedIndex].value;
  if (!uid) {
    mystatus.style.backgroundColor = "#eee";
    mystatus.style.color = "#333";
    mystatus.innerHTML = "Unknown user: please select above.";
  } else {
    mystatus.style.color = "#000";
    mystatus.style.backgroundColor = "#FFF";
    var activity = null;
    var job = null;
    for (aid in gActivities) {
      if (IsActiveAssignment(uid, aid) && gActivities[aid].name) {
        if (gActivities[aid].IsJobToDisplay()) {
          if (job == null) {
            job = gActivities[aid].name;
          } else {
            job += "," + gActivities[aid].name;
          }
        }
      }
    }
    activity = GetCurrentActivity(uid);
    if (activity) { activity = gActivities[activity].name; }

    mystatus.innerHTML = "";
    if (activity) {
      mystatus.innerHTML += "Current activity: <b>" + activity + "</b><br>";
    } else {
      mystatus.innerHTML += '<b><font color="red">You are not assigned to ' +
        'an activity!  Please select a puzzle below or select an exclusive ' +
        'non-puzzle activity on <a href="who.html">Who</a>.<br>Consult with ' +
        'your local Puzzle Czar if you are unsure what you should be doing.' +
        '</font></b><br>';
    }
    if (job) {
      mystatus.innerHTML += "Current job: <b>" + job + "</b><br>";
    }
  }
};

var MakeJobForm = function(job_id, job_name) {
  var whoami = document.getElementById('whoami');
  var uid = document.getElementById('whoami').options[whoami.selectedIndex].value;
  var user_list = null;
  var activity = GetActivityByName(config.jobs_to_display[j]);
  if (activity) {
    for (u in gUsers) {
      if (gUsers[u].name && IsActiveAssignment(gUsers[u].id, activity.id)) {
        var name = gUsers[u].name;
        if (user_list) {
          user_list += "," + name;
        } else {
          user_list = name;
        }
      }
    }
  }
  if (!user_list) {
    user_list = '<b><font color="red">NONE</font></b>';
  }

  var html = "<form name=@ID@ id=@ID@ class=jobform>" +
             "  <b>@JOB@</b>: @USERS@<input type=submit id=@ID@.jobbutton>" +
             "</form>";
  html = html.replace(/@JOB@/g, job_name);
  html = html.replace(/@ID@/g, job_id);
  html = html.replace(/@USERS@/g, user_list);

  var tmp = document.getElementById("tmp");
  tmp.innerHTML = html;

  var jobbutton = document.getElementById(job_id + ".jobbutton");
  jobbutton.style.fontSize = '80%';
  jobbutton.style.border = '2px outset';
  jobbutton.onclick = function() {
    if (uid == "") {
      alert("Please tell me who you are first! (upper-left of page)");
    } else {
      if (!activity) {
        activity = InternalUpdateActivity(-1, job_name);
      }
      if (IsActiveAssignment(uid, activity.id)) {
        $(".ui-tooltip").remove();
        UpdateStatus(gUsers[uid], activity, (new Date()).valueOf(),
            false, true);          
      } else {
        $(".ui-tooltip").remove();
        // Start the job
        UpdateStatus(gUsers[uid], activity, (new Date()).valueOf(),
            true, false);
      }
    }
  };
  var now = (new Date()).valueOf();
  if (!uid) {
    // Disabled the buttons.
    jobbutton.style.backgroundColor = "#888";
    jobbutton.style.color = "#555";
    jobbutton.value = "WhoRU?";
    jobbutton.title = "Please tell me who you are (upper-left)."
  } else if (activity && IsActiveAssignment(uid, activity.id)) {
    if (IsExclusiveAssignment(uid, activity.id)) {
      // Exclusive and Active == "green" on who
      jobbutton.style.backgroundColor = "#0F0";
      jobbutton.style.color = "#000";
    } else {
      // Non-exclusive, but assigned == "purple" on who
      jobbutton.style.backgroundColor = "#C3F";
      jobbutton.style.color = "#000";      
    }
    jobbutton.value = "Stop";
    jobbutton.title = "Click here to indicate that you are leaving this job.";
  } else {
    // not engaged == "gray" on who
    jobbutton.style.backgroundColor = "#EEE";
    jobbutton.style.color = "#000";
    jobbutton.value = "Start";
    jobbutton.title = "Click here to indicate you are starting this job.";
  }
  var form = tmp.firstChild;
  form.onsubmit = function() {
    return false;
  }
  return form;
}

var UpdateJobsToDisplay = function() {
  if (config.jobs_to_display == null ||
      config.jobs_to_display.length == 0) {
    return;
  }
  
  var jobs = document.getElementById("jobs");
  while (jobs.hasChildNodes() ) {
    jobs.removeChild(jobs.lastChild);
  }

  for (j in config.jobs_to_display) {
    var job_id = "job" + j;
    var job_name = config.jobs_to_display[j];
    form = MakeJobForm(job_id, job_name);
    document.getElementById("jobs").appendChild(form);
  }
};

var GetActives = function(name) {
  log('GetActives for ' + name);
  var actives = [];
  var activesDurations = [];
  var activesWithDurations = [];
  var inactives = [];
  var inactivesDurations = [];
  var inactivesWithDurations = [];

  for (u in gUsers) {
    if (gUsers[u].name && IsActiveAssignment(gUsers[u].id, name)) {
      actives.push(gUsers[u].name);
      activesDurations.push(LastSeenDurationString(gUsers[u].id, name));
      activesWithDurations.push(gUsers[u].name + '(' + LastSeenDurationString(gUsers[u].id, name) + ')');
    } else if (gUsers[u].name && LastSeenTime(gUsers[u].id, name)) {
      inactives.push(gUsers[u].name);
      inactivesDurations.push(DurationString(gUsers[u].id, name));
      inactivesWithDurations.push(gUsers[u].name + '(' + DurationString(gUsers[u].id, name) + ')');
    }
  }

  var result = "";
  if (actives.length == 0) {
    result = "Nobody is working on this task.";
  } else if (actives.length == 1) {
    result = actives[0] + " has been working on this task for " + activesDurations[0] + ".";
  } else {
    result = actives.length + " people are working on this task:<br>&nbsp;&nbsp;" 
                 + activesWithDurations.join('<br>&nbsp;&nbsp;');
  }

  if (inactives.length == 1) {
    result += "<br>" + inactives[0] + " worked on this task for " + inactivesDurations[0] + ".";
  } else if (inactives.length > 1) {
    result += "<br>" + inactives.length + " people worked on this task:<br>&nbsp;&nbsp;" 
                             + inactivesWithDurations.join('<br>&nbsp;&nbsp;');
  }

//  result += "<br>" + (new Date()).valueOf();  // for debugging

  return result;
};

var UpdateActives = function(name) {
  log('UpdateActives for ' + name);
  var actives = [];
  for (u in gUsers) {
    if (gUsers[u].name && IsActiveAssignment(gUsers[u].id, name)) {
      actives.push(gUsers[u].name);
    }
  }
  var span = document.getElementById(name + '.actives');
  if (span) {
    span.innerHTML = '(' + actives.length + 'p)';
  }
};

var WhoAmIChanged = function() {
  // Store this user identity in a cookie.
  var whoami = document.getElementById('whoami');
  var uid = document.getElementById('whoami').options[whoami.selectedIndex].value;
  cookies.set('whoami', uid);

  // Update the "Do this" buttons on each puzzle.
  UpdateAssignButtons();
  UpdateMyStatus();
  UpdateJobsToDisplay();
};

var UpdateAssignButtons = function() {
  var whoami = document.getElementById('whoami');
  var uid = document.getElementById('whoami').options[whoami.selectedIndex].value;

  // We don't really have a great way of iterating through all
  // the puzzles on the page without just looking at the HTML DOM.
  var itemList = document.getElementById('items');
  for (var i=0; i < itemList.childNodes.length; ++i) {
    // we should be checking that each item is really a form, but we'll be lazy.
 
    var assignbuttonName = itemList.childNodes[i].name + ".assignbutton";
    var assignbutton = document.getElementById(assignbuttonName);
    assignbutton.style.fontSize = '80%';
    assignbutton.style.border = '2px outset';

    var puzzle = assignbutton.id.split('.')[0];
    var now = (new Date()).valueOf();

    if (! uid) {
      // Disabled the buttons.
      assignbutton.style.backgroundColor = "#888";
      assignbutton.style.color = "#555";
      assignbutton.value = "WhoRU?";
      assignbutton.title = "Please tell me who you are (upper-left)."
    } else if (IsActiveAssignment(uid, puzzle) && IsExclusiveAssignment(uid, puzzle)) {
      // Exclusive and Active == "green" on who
      assignbutton.style.backgroundColor = "#0F0";
      assignbutton.style.color = "#000";
      assignbutton.value = MakeAgoString(now, LastSeenTime(uid, puzzle)) + ' ago';
      assignbutton.title = "Click here to indicate that you are still working on this puzzle."
    } else if (! IsExclusiveAssignment(uid, puzzle)) {
      // non-exclusive, but assigned == "purple" on who
      assignbutton.style.backgroundColor = "#C3F";
      assignbutton.style.color = "#000";
      assignbutton.value = MakeAgoString(now, LastSeenTime(uid, puzzle)) + ' ago';
      assignbutton.title = "Click here to indicate that you're still thinking of this puzzle."
    } else {
      // not engaged == "gray" on who
      assignbutton.style.backgroundColor = "#EEE";
      assignbutton.style.color = "#000";
      assignbutton.value = "Do This";
      assignbutton.title = "Click here to indicate you are moving to this puzzle."
    }

  }
};

var on_value = function(key, field, value) {
  // Called whenever key.field changes value.  key is the id of an HTML
  // form on this page.  field is any key, although some keys have special
  // significance.

  // Do we have information about a new user?  If so, update the "whoami" list.
  if (key[0] == "u" && field == "name" && value) {
    add_user_to_whoami(document.getElementById("whoami"), key, value);
  }

  // Care only about puzzles (key starts with p).
  if (key[0] != "p" && key[0] != "x") return;

  var form = document.forms[key];
  if (!form) {
    if (!value) return;
    form = make_form(key);
  }

  var node;
  if (field == "deadline") {
    form.czar_deadline = value;
    watch_deadline(form);
  }

  if ((node = form[field])) {
    if (node.className == "inflight")
      node.className = "";
    if (value != node.czar_oldvalue) {
      node.czar_oldvalue = value;
      if (!value) {
        node.className = "empty";
        node.value = node.czar_prompt;
        node.blur();
      } else {
        node.className = "";
        node.value = value;
      }

      if (field == "label") on_label_change(form, value);

      if (field == "status") {
        if (value && (value.toUpperCase() == value)) {
          // Make the status monospaced if it doesn't have lower-case letters
          // (and it isn't empty), since it's (by convention) a puzzle answer.
          node.setAttribute('style','width:32em;font-family:"Lucida Console", Monaco, Courier, monospace');
        } else {
          // Make the status non-monospaced if it does have lower-case letters or is empty.
          node.setAttribute('style','width:32em');
        }
      }
    }
  }

  if ((node = document.getElementById(form.name + "." + field))) {
    if (node.nodeName == "A") {
      if (value) {
        node.href = value;
        node.className = "";
      } else {
        if (node.href) node.href = null;
        node.className = "missing";
      }
    }
  }

  UpdateAssignButtons();
}

var send_value = function(form, field, value) {
  // Update form.field = value on the server and take immediate action for
  // this update.

  form = form.name ? form.name : form;
  field = field.name ? field.name : field;
  gStateServer.set(form + "." + field, value);
  on_value(form, field, value);
}

// Called on every update of a key=value pair.
var on_server = function(key, value) {

  var dot = key.indexOf(".");
  if (dot >= 0) {
    // Keys, apparently, have two parts: the part before the . and the part
    // after the dot.
    on_value(key.substring(0, dot), key.substring(dot + 1), value);
  }

  // From who-data.js.
  HandleUpdateFromStateserver(key, value);

  // For notifications.
  Notifications.HandleUpdateFromStateserver(key, value);

};


/////////// Tag Manipulation

var filter_tags = function() {
  // Selectively hide puzzles based on their tags.

  log('filter_tags called');

  var selected = GetSelectedTags();

  var odd = 1;
  // Examine each puzzle being displayed.  Take action only if all the
  // selected tags appear in the puzzle as well.  Note that "no tags selected"
  // selects all puzzles.
  for (var node=document.getElementById("items").firstChild; 
       node != null; node=node.nextSibling) {
    if (node.className == "deleted") continue;  // skip over deleted forms.
    if (TagsMatch(selected,
                  document.getElementById(node.name + ".tags").value)) {
      node.style.display = selected.invert ? "none" : "block";
    } else {
      node.style.display = selected.invert ? "block" : "none";
    }
    if (node.style.display == "block") {
      if (odd) {
        node.classList.add("shaded");
      } else {
        node.classList.remove("shaded");
      }
      odd = !odd;
    }
  }
};


var UpdateTagsSelector = function() {
  // Called when any puzzle has had its tags field changed.  Updates the
  // list of tags at the top of the page.

  log('UpdateTagsSelector called.');

  ResetTags();

  // Iterate through the list of puzzles, in order that they appear (items,
  // rather than unsorted).
  for (var node=document.getElementById("items").firstChild; 
       node != null; node=node.nextSibling) {

    log('node.name is [' + node.name + ']');

    UpdateTagCounts(document.getElementById(node.name + ".tags").value);
    MaybeRecolorSheet(node.name, document.getElementById(node.name + ".tags").value);
  }

  MakeTagSelector(document.getElementById("tags"), filter_tags);
};


/////////// end Tag Manipulation

var start_czar = function() {

  // Turn on JqueryUI tooltips.
  $(document).tooltip();
  $(".selector").tooltip("[title]",".actives");

  stateserver_url = config.server_url + config.hunt_id
  gStateServer = stateserver.open(stateserver_url, on_server);
  document.getElementById('whoami').onchange = WhoAmIChanged;
  document.getElementById('hunt_url').href = config.hunt_url;
  document.getElementById('hunt_info').innerHTML = config.hunt_info;
  document.getElementById('team_url').href = config.team_url;
  Notifications.Init(gStateServer);
}
