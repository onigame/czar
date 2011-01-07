// Methods to save and store data in a cookie.

var cookies = {
  // Sets name=value.  Send "" or null for value to delete this cookie.
  set: function(name, value) {
    // All the settings will be forgotten in one month.
    expires = (new Date()).getDate() + 30;

    document.cookie = name + "=" + escape(value) + "; expires=" + expires;
  },

  // Fetches the value of the named cookie.  Returns null if none is found.
  get: function(name) {
    var m = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');

    if (m) {
      return unescape(m[2]);
    } else {
      return null;
    }
  },
};
