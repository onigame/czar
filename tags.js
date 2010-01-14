// Functions for filtering items by tags.  A tag is an alphanumeric identifier,
// lowercase, and a taglist is a comma-separated string of tags.  It's up to
// a client to decide what to do in response to filtering items.  See czar.js
// for an example client usage.

// TODOs
// x Selector should look okay when there's lots of tags.

var SanitizeTagList = function(str) {
  // Sanitize the list of tags the user gave us.

  // Lowercase.
  str = str.toLowerCase()

  // Allow only a-z0-9 for each tag.
  str = str.replace(/[^a-z0-9\,]/g,"");

  // Don't allow repeat tags.
  var tags = str.split(/\s*,\s*/);
  var tag_set = {};
  var uniq_tags = [];
  for (var i = 0; i < tags.length; i++) {
    if (tags[i] && !tag_set[tags[i]]) {
      tag_set[tags[i]] = true;
      uniq_tags.push(tags[i]);
    }
  }
  
  str = uniq_tags.join(',');

  return str;
};

// When true show only those items that do _not_ match the selected tags.
//var gInvertTags = false;

// Array of all known tags, in order as shown to users.
var gTags = [];
var gTagCounts = {};

var GetSelectedTags = function() {
  // Query the page elements created by MakeTagSelector in order to determine
  // which tags have been selected.  Returns an object that's needed by
  // TagsMatch.

  var selected = {};
  selected.tags = {};
  selected.num = 0;

  // What tags are selected?
  for (var i = 0; i < gTags.length; i++) {
    if (document.getElementById('checkbox.Tag' + i).checked) {
      selected.tags[gTags[i]] = true;
      selected.num++;
    }
  }

  return selected;
};

var TagsMatch = function(selected, taglist) {
  // Given an object returned by GetSelectedTags and a taglist for an item,
  // returns true iff that item's taglist is a superset of the selected tags.

  var tags = taglist.split(',');
  var num_tags_match = 0;
  for (var i = 0; i < tags.length; i++) {
    if (selected.tags[tags[i]]) {
      num_tags_match++;
    }
  }

  return num_tags_match == selected.num;
};

var IsSelectionInverted = function() {
  return document.getElementById('invert').checked;
};

var ResetTags = function() {
  // Forget all existing tags.  Create the permanent tag "solved."

  gTags = [];
  gTagCounts = {};

  // Always have a Solved tag.
  gTags.push('solved');
  gTagCounts['solved'] = 0;
};

var UpdateTagCounts = function(taglist) {
  // Update our list of tags and tag counts given an item with this taglist.

  var tags = taglist.split(',');

  for (var i = 0; i < tags.length; i++) {
    if (gTagCounts[tags[i]] != null) {
      gTagCounts[tags[i]]++;
    } else {
      gTagCounts[tags[i]] = 1;
      gTags.push(tags[i]);
    }
  }
};


var MakeTagSelector = function(parent, filter_tags) {
  // Create an HTML widget for selecting tags.  The widget is a collection of
  // checkboxes, one for each tag, and one final one for inverting the
  // selection.  Toggling any box will fire filter_tags.

  if (!parent) {
    return;
  }

  parent.innerHTML = '';
  gTags.sort();

  var span = document.createElement('span');
  span.style.backgroundColor = '#ffffcc';
  span.style.border = 'thin solid #ffcc00';
  parent.style.padding = '10px';
  span.style.padding = '8px';

  var table = document.createElement('table');
  table.style.backgroundColor = '#ffffcc';
  table.style.border = 'thin solid #ffcc00';
  parent.style.padding = '10px';
  table.style.padding = '8px';

  var tr = document.createElement('tr');
  var td = document.createElement('td');
  td.style.verticalAlign = 'top';
  td.innerHTML = 'Filter by tags:';
  tr.appendChild(td);

  td = document.createElement('td');
  td.style.verticalAlign = 'top';

  for (var i = 0; i < gTags.length; i++) {
    var tag = gTags[i];
    var count = gTagCounts[tag];
    var id = 'checkbox.Tag' + i;

    var label = document.createElement('label');
    label.htmlFor = id;
    label.appendChild(document.createTextNode(tag));
    var s = document.createElement('span');
    s.style.fontSize = '68%';
    s.appendChild(document.createTextNode('(' + count + ')'));
    label.appendChild(s);
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.onchange = filter_tags;
    input.id = id;
    input.value = i;
    label.style.paddingRight = '0.5em';
    label.appendChild(input);

    td.appendChild(label);

    if (i % 8 == 7) {
      td.appendChild(document.createElement('br'));
    }
  }

  var label = document.createElement('label');
  label.htmlFor = 'invert';
  label.appendChild(document.createTextNode('invert'));
  var input = document.createElement('input');
  input.type = 'checkbox';
  input.onchange = filter_tags;
  input.id = 'invert';
  label.appendChild(input);
  td.appendChild(label);

  tr.appendChild(td);
  table.appendChild(tr);

  parent.appendChild(table);
};
