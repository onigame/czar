// stateserver.js: Javascript browser client library for stateserver.py servers.
// Provides real-time synchronized access to key-value JSON storage.
//
// Individual "channels" (databases) are opened separately; when a channel is
// opened, every key/value in the channel is retrieved. Changes may be sent
// to the server; callbacks are invoked for changes received from the server.
// Internally, channels use script-tag-insertion long-polling, have no same-site
// restrictions, and automatically retry and reconnect as necessary.
//
// To use, import the JSON library followed by this file:
//
//   <script language="JavaScript" src="json2.js"></script>
//   <script language="JavaScript" src="stateserver.js"></script>
//
// Then, within your Javascript, open a channel to a running stateserver.py:
//
//   channel = stateserver.open("http://some.url:1234/your.channel");
//
// Register for updates on that channel:
//
//   channel.addListener(function(key, value) {
//     ... do something with update ...
//   });
//
// Once a connection is established to the server, registered listeners will
// be called for all existing key/value pairs in the channel. They will also be
// invoked later for any changes made by any client (including this one).
//
// Make updates using the channel object:
//
//   channel.set(some_key, some_value);
//
// Keys must be strings; values can be any legal JSON value (strings, numbers,
// null, lists, or maps of JSON values). Updates will be reflected by the
// server and listener callbacks invoked for all clients, including this one
// (which may be used as confirmation that it made it to the server).
//
// Setting null as a key's value deletes the key. When a key is deleted, the
// callback is invoked with the key's name and a null value.
//
// If multiple updates to the same key happen in succession, only the most
// recent value is guaranteed to be sent to any given client (intermediate
// values may be skipped).
//
// If a channel is no longer needed, it may be closed:
//
//   channel.close()
//
// After being closed, the server will no longer be polled for updates, and
// listener callbacks will no longer be invoked.

var stateserver = {
  R: [],

  open: function(url) {
    var head_tag = document.getElementsByTagName("head")[0];
    var script_tag = null;
    var timeout_id = null;
    var slot = stateserver.R.length;
    var current_version = 0;
    var request_version = 0;
    var queued_data = null;
    var sent_data = null;
    var listeners = [];

    var reset_request = function() {
      if (script_tag != null) head_tag.removeChild(script_tag);
      script_tag = null;

      if (timeout_id != null) window.clearTimeout(timeout_id);
      timeout_id = null;

      delete stateserver.R[slot];
    }

    var send_request = function() {
      reset_request();

      if (sent_data == null) {
        sent_data = queued_data;
      } else if (queued_data != null) {
        for (var key in queued_data) sent_data[key] = queued_data[key];
      }
      queued_data = null;

      var slotref = "stateserver.R[" + slot + "]";
      var jsonp = encodeURIComponent("if (" + slotref + ") " + slotref);
      request_url = url + "?v=" + current_version;
      request_url += "&jsona=" + request_version;
      request_url += "&jsonp=" + jsonp;

      // Add an extra CGI argument to change the URL, forcing cache bypass.
      request_url += "&now=" + (new Date()).valueOf();

      if (sent_data != null) {
        var set = encodeURIComponent(JSON.stringify(sent_data));
        request_url += "&time=0&set=" + set;
      } else {
        request_url += "&time=20";
      }

      stateserver.R[slot] = receive_data;

      script_tag = document.createElement("script");
      script_tag.type = "text/javascript";
      script_tag.src = request_url;
      head_tag.insertBefore(script_tag, head_tag.firstChild);

      timeout_id = window.setTimeout(send_request, 30000);
    };

    var receive_data = function(jsona, version, obj) {
      if (jsona != request_version) return;  // Obsolete request.

      sent_data = null;
      if (version > current_version) {
        current_version = version;
        request_version += 1;
        send_request();
        var copy = listeners.slice(0), num = listeners.length;
        for (var i = 0; i < num; ++i) for (k in obj) copy[i](k, obj[k]);
      } else {
        send_request();
      }
    };

    send_request();

    return {
      set: function(key, value) {
        if (queued_data == null) queued_data = {};
        queued_data[key] = value;
        request_version += 1;
        if (timeout_id != null) {
          window.clearTimeout(timeout_id);
          timeout_id = window.setTimeout(send_request, 0);
        }
      },

      addListener: function(callback) {
        listeners.push(callback);
      },

      removeListener: function(callback) {
        var i;
        while ((i = listeners.indexOf(callback)) >= 0) listeners.splice(i);
      },

      close: function() {
        reset_request();
        request_version = null;
        queued_data = null;
        sent_data = null;
        listeners = [];
      },
    };
  }
};
