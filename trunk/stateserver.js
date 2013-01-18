// stateserver.js: Javascript browser client library for stateserver.py servers.
// Provides real-time synchronized access to key-value JSON storage.
//
// Individual "channels" (databases) are opened separately; when a channel is
// opened, every key/value in the channel is retrieved.  Changes may be sent
// to the server; callbacks are invoked for changes received from the server.
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
// The server/port must be a running stateserver.py.  Once a connection is
// established to the server, your callback will be invoked in succession for
// all existing key/value pairs in the channel.  It will be invoked later for
// any changes made by any client (including this one).
//
// If the URL host includes a "*" -- e.g. "http://czar*.ofb.net:8888/mydata" --
// the * will be replaced with numbers to avoid the two-connection-per-host
// problem that otherwise blocks updates as stale connections slowly time out.
// This requires that all such hostnames are valid for the server, which
// implies that you should have a wildcard DNS record (as *.ofb.net does).
//
// The object returned by stateserver.open() can be used to make updates:
//
//   channel.set(some_key, some_value);
//
// Keys must be strings; values can be any legal JSON value (strings, numbers,
// null, lists, or maps of JSON values).  Updates will be reflected by the
// server and the callback re-invoked on all clients, including this one (which
// may be used as confirmation that it made it to the server).
//
// Setting null as a key's value deletes the key.  When a key is deleted, the
// callback is invoked with the key's name and a null value.
//
// If multiple updates to the same key happen in succession, only the most
// recent value is guaranteed to be sent to any given client (intermediate
// values may be skipped).
//
// When a channel is no longer needed, it must be closed:
//
//   channel.close()
//
// After being closed, the server will no longer be polled for updates, and the
// channel's callback will not be invoked.  Clients may have multiple channels
// open at once, though this is not necessary or common.  Internally, channels
// use script-tag-insertion long-polling, have no same-site restrictions, and
// automatically retry and reconnect as necessary.

var stateserver = {
  R: [],

  open: function(url, callback) {
    var head_tag = document.getElementsByTagName("head")[0];
    var script_tag = null;
    var timeout_id = null;
    var slot = stateserver.R.length;
    var saved_tokens = [];
    var current_token = null;
    var current_version = 0;
    var queued_data = null;
    var sent_data = null;
 
    var reset = function() {
      if (script_tag != null) head_tag.removeChild(script_tag);
      script_tag = null;

      if (timeout_id != null) window.clearTimeout(timeout_id);
      timeout_id = null;

      delete stateserver.R[slot];
      current_token = null;
    }

    var send_request = function() {
      reset();

      if (sent_data == null) {
        sent_data = queued_data;
      } else if (queued_data != null) {
        for (var key in queued_data) sent_data[key] = queued_data[key];
      }
      queued_data = null;

      current_token = saved_tokens.pop();
      if (!current_token) current_token = Math.floor(Math.random() * 10000) + 1;
      var request_url = url.replace(/\*/, current_token);

      var slotref = "stateserver.R[" + slot + "]";
      var jsonp = encodeURIComponent("if (" + slotref + ") " + slotref);
      request_url += "?v=" + current_version;
      request_url += "&jsonp=" + jsonp;
      request_url += "&jsona=" + current_token;
      // Is Chrome not honoring the cache headers?  Add an extra CGI arg
      // to change the URL.
      request_url += "&now=" + (new Date()).valueOf();

      if (sent_data != null) {
        var set = encodeURIComponent(JSON.stringify(sent_data));
        request_url += "&time=0&set=" + set;
      } else {
        request_url += "&time=20";
      }

      script_tag = document.createElement("script");
      script_tag.type = "text/javascript";
      script_tag.src = request_url;
      head_tag.insertBefore(script_tag, head_tag.firstChild);

      timeout_id = window.setTimeout(send_request, 30000);

      stateserver.R[slot] = receive_data;
    };

    var receive_data = function(token, version, obj) {
      saved_tokens.push(token);
      if (token != current_token) return;

      sent_data = null;
      if (version > current_version) {
        current_version = version;
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

      make_boolean: function(v) {
        if (v) { return 't'; } else { return 'f'; }
      },

      parse_boolean: function(v) {
        return v == 't';
      },
    };
  }
};
