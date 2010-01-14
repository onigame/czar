// Each puzzle is represented by a <form> object.  The form has fields
// for the puzzle name, status, etc.  <form>s are stored in a hidden div
// on the host HTML page.

// Data is stored in stateserver as form.field = value.

var gStateServer = null;
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
      if (!input.value && input.czar_oldvalue && input.name == "label") {
        input.value = input.czar_oldvalue;
        send_value(this, "deadline", new Date().getTime() + 20000);
      } else {
        if (input.name == "tags") {
          input.value = SanitizeTagList(input.value);
        }
        send_value(this, input, input.value);
        if (input.name == "tags") {
          UpdateTagsSelector();
        }
        if (!input.className)
          input.className = "inflight";
      }
    }
  }
  return false;
}

var on_submit_create = function() {
  // Callback for creating a new puzzle by means of the link at the top
  // of the page.

  if (this.label.className == "dirty") {
    var label = this.label.value;
    this.label.className = "empty";
    this.label.value = this.label.czar_prompt;
    this.label.blur();

    if (label) {
      var name = null;
      // p is for puzzle.
      do name = "p" + Math.floor(Math.random() * 10000);
      while (document.forms[name]);

      send_value(name, "label", label);
      var form = document.forms[name];
      if (this.label.className != "dirty")
        form.label.className = "inflight";

      sort_forms();
      form.status.focus();
    }
  }
  return false;
}

var watch_deadline = function(form) {
  // Dunno what this is all about.

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
    form.status.value = "DELETED in " + secs + " seconds (click to undo)";
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
}

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
  for (var i = 0; i < forms.length; ++i) {
    var form = forms[i];
    if (form && form.name != "create" && form.czar_sortkey) {
      while (next != null && next != form) next = next.nextSibling;
      if (next == form)
        next = next.nextSibling;
      else
        parent.insertBefore(form, next);
    }
  }
  UpdateTagsSelector();
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
  "<input type=text name=label size=35 style='font-weight: bold'>" +
  "<a class=missing target=@NAME@.puzzle id=@NAME@.puzzle>puzzle</a>" +
  "<span class=tooltip><input type=text name=puzzle size=30></span>" +
  "<a class=missing target=@NAME@.sheet id=@NAME@.sheet>sheet</a>" +
  "<span class=tooltip><input type=text name=sheet size=30></span>" +
  "<input type=text name=status size=50>" +
  "<input type=text id=@NAME@.tags name=tags size=20>" +
  "<select id=@NAME@.assign><option disabled>Assign</option></select>" +
  "<span style='cursor:pointer;cursor:hand;display:inline-block;width:2em' id=@NAME@.actives " +
      "title='Nobody is working on this task.'>(0p)</span>" +
  "</form>";

var add_users_to_select = function(select) {
  //var select = document.createElement('select');

  // Get a sorted list of users.
  var compare_by_name = function(id1, id2) {
    if (id1 == id2) return 0;
    // If item 2 doesn't have a name then item 1 wins by default.  And vice
    // versa.
    if (!gUsers[id2] || !gUsers[id2].name) return -1;
    if (!gUsers[id1] || !gUsers[id1].name) return 1;

    // TODO(corin): precompute this key.
    var name1 = gUsers[id1].name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    var name2 = gUsers[id2].name.toLowerCase().replace(/[^a-z0-9]+/g, "");

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
  sorted_users.sort(compare_by_name);

  select.innerHTML = '';
  var option = document.createElement('option');
  option.appendChild(document.createTextNode('Assign'));
  option.disabled = true;
  select.appendChild(option);

  for (var i = 0; i < sorted_users.length; i++) {
    var user = gUsers[sorted_users[i]];
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(user.name));
    option.value = user.id;
    select.appendChild(option);
  }
};

var make_form = function(name) {
  // Makes a new form to represent a single puzzle.

  var tmp = document.getElementById("tmp");
  tmp.innerHTML = the_form_html.replace(/@NAME@/g, name);

  var assign = document.getElementById(name + '.assign');
  //add_users_to_select(assign);
  assign.onfocus = function() { log('onfocus'); add_users_to_select(assign); };
  assign.onchange = function() {
    var uid = assign.options[assign.selectedIndex].value;
    log('uid is ' + uid);
    UpdateStatus(gUsers[uid], gActivities[name],
		 (new Date()).valueOf(), true, true);
  };

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

var UpdateAssignmentHack = function(uid, aid, when, active, exclusive) {
  UpdateActives(aid);
};

var UpdateActives = function(name) {
  log('UpdateActives for ' + name);
  var actives = [];
  for (u in gUsers) {
    if (IsActiveAssignment(gUsers[u].id, name)) {
      actives.push(gUsers[u].name);
    }
  }
  var span = document.getElementById(name + '.actives');
  if (span) {
    span.innerHTML = '(' + actives.length + 'p)';
    if (actives.length == 0) {
      span.title = "Nobody is working on this task.";
    } else if (actives.length == 1) {
      span.title = actives[0] + " is the only person working on this task.";
    } else {
      span.title = "There are " + actives.length + " people working on this task: " + actives.join(', ');
    }
  }
};

var on_value = function(key, field, value) {
  // Called whenever key.field changes value.  key is the id of an HTML
  // form on this page.  field is any key, although some keys have special
  // significance.

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
};


/////////// Tag Manipulation

var filter_tags = function() {
  // Selectively hide puzzles based on their tags.

  log('filter_tags called');

  var selected = GetSelectedTags();

  // Examine each puzzle being displayed.  Take action only if all the
  // selected tags appear in the puzzle as well.  Note that "no tags selected"
  // selects all puzzles.
  for (var node=document.getElementById("items").firstChild; 
       node != null; node=node.nextSibling) {
    if (TagsMatch(selected,
		  document.getElementById(node.name + ".tags").value)) {
      node.style.display = IsSelectionInverted() ? "none" : "block";
    } else {
      node.style.display = IsSelectionInverted() ? "block" : "none";
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
  }

  MakeTagSelector(document.getElementById("tags"), filter_tags);
};


/////////// end Tag Manipulation

var start_czar = function(stateserver_url) {
  gStateServer = stateserver.open(stateserver_url, on_server);
  bind_input(document.forms.create.label, "Click to enter new puzzle name");
  document.forms.create.label.czar_autosubmit = false;
  document.forms.create.onsubmit = on_submit_create;
}

