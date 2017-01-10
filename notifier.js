// notifier.js: Watches stateserver updates for a Czar application and triggers
// sounds and system notifications (https://notifications.spec.whatwg.org/)
// for significant events.
//
// Import this file, and call startNotifier() with a stateserver channel:
//
//   startNotifier(my_stateserver_channel);
//
// (Do this just after the channel is opened.) No further interaction is needed.

var startNotifier = function(channel) {
  var items = {};  // Puzzle status, by ID (a### or p###).
  var names = {};  // User name, by ID (a### or u###).

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
      var body = "Solved!";
      for (var i = 0; i < solvers.length; ++i) {
        var sep = !i ? " (" : i < solvers.length - 1 ? ", " : " and ";
        body = body + sep + solvers[i];
        if (i == solvers.length - 1) body = body + ")";
      }

      new Notification(puzzle.label, {
          icon: "/images/cross_transparent.png",
          body: body,
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

    // User assignment to puzzles.
    if ((m = key.match(/^t\.(u\d+)\.(p\d+)\.active$/))) {
      var item = (items[m[2]] = items[m[2]] || {id: m[2]});
      item.people = item.people || {}; 
      item.people[m[1]] = value;
    }

    // Names of users.
    if ((m = key.match(/^(u\d+)\.name$/))) names[m[1]] = value;
  });
};
