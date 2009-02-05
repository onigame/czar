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
      }
    };
  }
};
