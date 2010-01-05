var the_server = null;
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
  for (var i = 0; i < this.length; ++i) {
    var input = this.elements[i];
    if (input.className == "dirty") {
      input.className = "";
      if (!input.value && input.czar_oldvalue && input.name == "label") {
        input.value = input.czar_oldvalue;
        send_value(this, "deadline", new Date().getTime() + 20000);
      } else {
        if (input.name == "tags") {
          input.value = tag_cleanup(input.value);
        }
        send_value(this, input, input.value);
        if (input.name == "tags") {
          update_tags();
        }
        if (!input.className)
          input.className = "inflight";
      }
    }
  }
  return false;
}

var on_submit_create = function() {
  if (this.label.className == "dirty") {
    var label = this.label.value;
    this.label.className = "empty";
    this.label.value = this.label.czar_prompt;
    this.label.blur();

    if (label) {
      var name = null;
      do name = "x" + Math.floor(Math.random() * 10000);
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
  update_tags();
}

var bind_input = function(input, prompt) {
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
  "</form>";

var make_form = function(name) {
  var tmp = document.getElementById("tmp");
  tmp.innerHTML = the_form_html.replace(/@NAME@/g, name);

  var form = tmp.firstChild;
  form.onsubmit = on_submit_edit;
  document.getElementById("unsorted").appendChild(form);
  bind_input(form.label, "");
  bind_input(form.status, "Click to enter puzzle status");
  bind_input(form.tags, "No tags");
  bind_link(form, "puzzle", "Click to enter puzzle URL");
  bind_link(form, "sheet", "Click to enter spreadsheet URL");
  return form;
}

var on_label_change = function(form, value) {
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
}

var on_value = function(key, field, value) {
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
  form = form.name ? form.name : form;
  field = field.name ? field.name : field;
  the_server.set(form + "." + field, value);
  on_value(form, field, value);
}

var on_server = function(key, value) {
  var dot = key.indexOf(".");
  if (dot >= 0) {
    on_value(key.substring(0, dot), key.substring(dot + 1), value);
  }
};


/////////// Tag Manipulation

var tag_cleanup = function(str) {
  return str.toLowerCase().replace(/[^a-z0-9\,]/g,"")
     .replace(/\,+/g,",").replace(/\,$/,"");
};

var counter = 0;
var inverted = false;
var tag_count = 0;
var tag_list = "";

var all_checkboxes_unchecked = function() {
  for (var i=0; i<tag_count; ++i) {
    if (document.getElementById("checkbox." + i).checked)
      return false;
  }
  return true;
}; 

var invert_box = function() {
  inverted = document.getElementById("invert").checked;
  filter_tags();
}

var filter_tags = function() {
  var keep = new Hash();
  for (var node=document.getElementById("items").firstChild; 
       node != null; node=node.nextSibling) {
    keep.addItem(node.name);
  }

  for (var i in tag_list.items) {
    if (document.getElementById("checkbox." + i).checked) {
      var tag_group = tag_list.items[i].split(',');
      for (var j in tag_group) {
        if (keep.hasItem(tag_group[j]))
          keep.addItem(tag_group[j]);
      }
      keep.subtractOneOfEachItem();
    }
  }
  for (var node=document.getElementById("items").firstChild; 
       node != null; node=node.nextSibling) {
    node.style.display = inverted ? "block" : "none";
  }
  for (var i in keep.items) {
    document.forms[i].style.display = inverted ? "none" : "block";
  }
};

var update_tags = function() {
  var result = "";
  // result = counter++;

  tag_list = new Hash();

  for (var node=document.getElementById("items").firstChild; 
       node != null; node=node.nextSibling) {
    var tag_group = document.getElementById(node.name + ".tags").value.split(',');
    for (var i in tag_group) {
      if (tag_list.hasItem(tag_group[i])) {
        tag_list.setItem(tag_group[i], tag_list.items[tag_group[i]] + "," + node.name);
      } else {
        tag_list.setItem(tag_group[i], node.name);
      }
    }
  }
  for (var i in tag_list.items) {
    // result += i + " : " + tag_list.items[i] + "<br>";
    result += "<strong>" + i + "</strong>(" + (tag_list.items[i].replace(/[^\,]/g,"").length + 1) + ")";
    result += '<input type="checkbox" onchange="filter_tags()" id="checkbox.' 
               + i + '" value="' + i + '"> ';
  }
  result += 'invert <input type="checkbox" onchange="invert_box()" id="invert">';
  document.getElementById("tags").innerHTML = result;
};

/////////// end Tag Manipulation

var start_czar = function(stateserver_url) {
  the_server = stateserver.open(stateserver_url, on_server);
  bind_input(document.forms.create.label, "Click to enter new puzzle name");
  document.forms.create.label.czar_autosubmit = false;
  document.forms.create.onsubmit = on_submit_create;
}
