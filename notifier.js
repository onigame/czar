// notifier.js: Watches stateserver updates for a Czar application and triggers
// sounds and system notifications (https://notifications.spec.whatwg.org/)
// for significant events.
//
// Import this file, and call notifier.start() with a stateserver channel:
//
//   notifier.start(my_stateserver_channel);
//
// (Do this just after the channel is opened.) No further interaction is needed.

var notifier = {
  start: function(channel) {
    var items = {};  // Puzzle and activity status, by ID (a### or p###).
    var names = {};  // User and activity name, by ID (a### or u###).

    // Prompts the user to allow (or explicitly block) web notifications,
    // and returns true once they're allowed.
    var checkNotificationPermission = function() {
      if (!window.Notification) return false;  // No browser support!
      if (window.Notification.permission == "default")
        window.Notification.requestPermission();
      return (window.Notification.permission == "granted");
    };

    // Deliver notifications as appropriate for puzzle status changes.
    //   puzzle - puzzle status (collected by the channel listener below).
    var checkPuzzle = function(puzzle) {
      if (!puzzle.label) return;

      // The puzzle-solved-notified flag is sent to *all* the clients 5sec after
      // notification, so reconnecting clients don't get stale notifications.
      var tags = puzzle.tags || "";
      var solved = (tags.split(",").indexOf("solved") >= 0);
      if (solved == Boolean(puzzle.notified)) return;  // No action needed.
      puzzle.notified = solved;
      window.setTimeout(
          function() { channel.set(puzzle.id + ".notified", puzzle.notified); },
          solved ? 5 * 1000 : 0);  // Delay when the puzzle *is* solved.

      // Web notifications (text window) for solved puzzles.
      if (solved && checkNotificationPermission()) {
        var solvers = [];
        for (u in (puzzle.people || [])) if (names[u]) solvers.push(names[u]);

        solvers.sort();
        var body = "Solved";
        for (var i = 0; i < solvers.length; ++i) {
          var sep = i == 0 ? " by " : i < solvers.length - 1 ? ", " : " and ";
          body = body + sep + solvers[i];
        }

        new Notification(puzzle.label, {
            icon: "/images/cross_transparent.png",
            body: body + "!",
            tag: puzzle.id,  // One notification for multiple windows.
          }).onclick = function() { window.focus(); };
      }

      // Audio (applause, etc) for solved puzzles.
      if (solved && window.Audio) {
        var applause = new window.Audio("/sounds/applause.mp3");
        if (tags.split(",").indexOf("meta") < 0) {
          applause.play();
        } else {
          new window.Audio("/sounds/hooray.mp3").play();
          window.setTimeout(function() { applause.play(); }, 2000);
        }
      }
    };

    // Deliver notifications as appropriate for activity/role status changes.
    //   activity - activity status (collected by the channel listener below).
    var checkActivity = function(activity) {
      var name = names[activity.id];
      if (!name) return;

      var active = [];
      for (u in (activity.people || []))
        if (activity.people[u] && names[u]) active.push(names[u]);
      active.sort();

      var text = name + ": ";
      if (active.length == 0) {
        text = text + "(nobody)";
      } else {
        for (var i = 0; i < active.length; ++i) {
          var sep = i == 0 ? "" : i < active.length - 1 ? ", " : " and ";
          text = text + sep + active[i];
        }
      }

      // Only notify when an activity's membership is seen *changing*.
      // Note, the last_text property is only local (not sent to the server).
      if (!activity.last_text) activity.last_text = text;
      if (activity.last_text == text) return;
      activity.last_text = text;

      if (checkNotificationPermission()) {
        new Notification(text, {
            icon: "/images/czar_small.jpeg",
            tag: activity.id,
          }).onclick = function() { window.focus(); };
      }
    }

    checkNotificationPermission();  // Prompt for permissions at startup.

    channel.addListener(function(key, value) {
      var m;

      // Puzzle status updates.
      if ((m = key.match(/^(p\d+)\.(\w+)$/))) {
        var puzzle = (items[m[1]] = items[m[1]] || {id: m[1]});
        if (m[2] == "label") puzzle.label = value;
        if (m[2] == "notified") puzzle.notified = value;
        if (m[2] == "tags") {
          puzzle.tags = value;  // Check asynchronously to get the whole batch.
          window.setTimeout(function() { checkPuzzle(puzzle, value); }, 0);
        }
      }

      // User assignment to puzzles *and* activities.
      if ((m = key.match(/^t\.(u\d+)\.([ap]\d+)\.active$/))) {
        var item = (items[m[2]] = items[m[2]] || {id: m[2]});
        item.people = item.people || {}; 
        item.people[m[1]] = value;
        if (m[2].startsWith("a"))
          window.setTimeout(function() { checkActivity(item); }, 0);
      }

      // Names of users *and* activities.
      if ((m = key.match(/^([au]\d+)\.name$/))) names[m[1]] = value;
    });
  }
};
