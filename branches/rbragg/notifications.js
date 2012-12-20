// Methods for displaying and managing notifications.

/*
 * Each notification is a new <div>  We create them dynamically here.
 * Put each notification in a z-index higher than all other notifications.
 * Clicking "okay" in a notification dismisses it.
 * Notifications are displayed only if they've been posted within the last
 * minute. 
 */

var Notifications = {
  Send: function(message, type) {
    // Sends "message" as a notification.

    var now = (new Date()).valueOf();
    this._stateserver.set('n' + now + '.' + type, now + '#' + message);
  },

  HandleUpdateFromStateserver: function(key, value) {
    // Notification messages have IDs that start with 'n'.
    if (key == null || key[0] != 'n') {
      return;
    }

    // Assume puzzle type unless otherwise specified for backward compatibility.
    var type = 'puzzle';
    var dot = key.indexOf(".");
    if (dot != -1) {
      type = key.substring(dot+1)
    }
    	
    // Value is posted#message.  Message may contain any symbols.
    // Posted is moment when notification was created, as a string
    // representing milliseconds since epoch.
    var hash = value.indexOf("#");
    if (hash < 0) {
      return;
    }
    var posted = parseInt(value.substring(0, hash));
    var message = value.substring(hash+1);

    log('Notification [' + message + '] @ ' + posted);
    this._MaybeDisplayNotification(posted, message, type);
  },


  Init: function(stateserver) {
    this._stateserver = stateserver;
    this._windows = new Array;
  },

  _stateserver: null,
  _windows: null,
  _sounds_loaded: new Object(),
  
  _MaybeDisplayNotification: function(posted, message, type) {
    // Notifications are shown for only one minute.  Don't show stale
    // notifications.
    var now = (new Date()).valueOf();
    if (posted + 60*1000 < now) {
      log('Stale notification.');
      return;
    }

    // Store a list of notifications in a cookie.  This cookie will prevent
    // us from showing the same notification twice (say, czar, then click to
    // the who page).
    var notifications = cookies.get('notifications');
    log('notifications is ' + notifications);
    if (notifications) {
      notifications = notifications.split(',');
      log('notifications is now ' + notifications + ' and posted is ' + posted);
      if (notifications.indexOf(String(posted)) != -1) {
        // We've already seen this notification; pass.
        log('Seen this notification before.');
	    return;
      } else {
	    // Append this notification to those seen.
	    notifications[notifications.length] = posted;
	    cookies.set('notifications', notifications.join(','));
      }
    } else {
      cookies.set('notifications', posted);
    }

    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.height = 200;
    div.style.width = 600;
    div.style.left = document.body.clientWidth / 2 - 300;
    div.style.top = 200;
    var zIndex = 1;
    for (var i = 0; i < this._windows.length; i++) {
      var d = this._windows[i];
      if (d.style.zIndex > zIndex) {
        zIndex = d.style.zIndex + 1;
      }
    }
    div.style.zIndex = zIndex;
    div.style.backgroundColor = '#f60';
    div.style.border = 'thin solid black';
    div.style.textAlign = 'center';
    div.style.padding = '20px';

    var span = document.createElement('span');
    span.style.fontSize = '24pt';
    span.innerHTML = message;
    div.appendChild(span);
    div.appendChild(document.createElement('br'));
    div.appendChild(document.createElement('br'));

    var p = new Date(posted);
    var when = p.toLocaleTimeString() + ' ' + p.toLocaleDateString();
    div.appendChild(document.createTextNode('Posted ' + when));
    div.appendChild(document.createElement('br'));

    var btn = document.createElement('button');
    btn.innerHTML = 'okay';
    btn.onclick = function() { Notifications._Dismiss(div); };
    div.appendChild(btn);

    if (this._windows.length > 0) {
      // Permit hiding all the windows.
      var btn = document.createElement('button');
      btn.innerHTML = 'dismiss all';
      btn.onclick = function() {
	    while (Notifications._windows.length > 0) {
	      // _Dismiss will remove the div from _windows.
	      Notifications._Dismiss(Notifications._windows[0]);
	    }
      };
      div.appendChild(btn);
    }

    var body = document.getElementsByTagName('body')[0];
    body.appendChild(div);
    this._windows.push(div);
    
    // Always play the applause sound.
    this._PlaySound('applause.mp3');
    if (type == 'meta') {
      // Play an extra, simultaneous sound for an added thrill for meta solves.
      this._PlaySound('hooray.mp3');
    }
  },

  _PlaySound: function(file_name) {
    if (!(file_name in this._sounds_loaded)) {
      if (soundManager.createSound(file_name, file_name)) {
        this._sounds_loaded[file_name] = 1;
      }
    }
    soundManager.play(file_name);
  },
  
  _Dismiss: function(div) {
    var body = document.getElementsByTagName('body')[0];
    body.removeChild(div);
    this._windows.splice(this._windows.indexOf(div), 1);
  },
};
