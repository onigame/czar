// stateserver.js: Javascript browser client library for stateserver.py servers.
// Provides real-time synchronized access to key-value JSON storage.
//
// Individual "channels" (databases) are opened separately; when a channel is
// opened, every key/value in the channel is retrieved. Changes may be sent
// to the server; callbacks are invoked for changes received from the server.
//
// Multiple channels may be open at once, but this is not necessary or common.
// Internally, channels use script-tag-insertion long-polling, have no same-site
// restrictions, and automatically retry and reconnect as necessary.
//
// To use, import the JSON library followed by this file:
//
//   <script language="JavaScript" src="json2.js"></script>
//   <script language="JavaScript" src="stateserver.js"></script>
//
// Then, within your Javascript, open a channel:
//
//   var callback = function(key, value) {
//     ... do something with update ...
//   };
//   channel = stateserver.open("http://some.url:1234/your.channel", callback);
//
// The server/port must be a running stateserver.py. Once a connection is
// established to the server, your callback will be invoked in succession for
// all existing key/value pairs in the channel. It will be invoked later for
// any changes made by any client (including this one).
//
// The object returned by stateserver.open() can be used to make updates:
//
//   channel.set(some_key, some_value);
//
// Keys must be strings; values can be any legal JSON value (strings, numbers,
// null, lists, or maps of JSON values). Updates will be reflected by the
// server and the callback re-invoked on all clients, including this one (which
// may be used as confirmation that it made it to the server).
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
// After being closed, the server will no longer be polled for updates, and the
// channel's callback will not be invoked.

var stateserver = {
  R: [],

  open: function(url, callback) {
    var head_tag = document.getElementsByTagName("head")[0];
    var script_tag = null;
    var timeout_id = null;
    var slot = stateserver.R.length;
    var current_version = 0;
    var request_version = 0;
    var queued_data = null;
    var sent_data = null;
 
    var reset = function() {
      if (script_tag != null) head_tag.removeChild(script_tag);
      script_tag = null;

      if (timeout_id != null) window.clearTimeout(timeout_id);
      timeout_id = null;

      delete stateserver.R[slot];
    }

    var send_request = function() {
      reset();

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
        for (var key in obj) callback(key, obj[key]);
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

      close: function() {
        reset();
        queued_data = null;
        sent_data = null;
      },
    };
  }
};
