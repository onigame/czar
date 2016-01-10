// For "gapi_client_id" values, visit the Google Developers Console:
// https://console.developers.google.com/apis/credentials?project=api-project-368612528023
// You may need permission; ask one of onigame/egnor/rbragg as needed.
// (You could also make your own independent project and keys.)

// Configuration for localhost testing:
//   ./stateserver.py :8888            # serve stateserver on port 8888
//   python -m SimpleHTTPSErver 8080   # Serve HTML on port 8080
//   ... now go to http://localhost:8080/
var localhost_config = {
  server_url: "http://localhost:8888/",
  hunt_id: "localtest",
  gapi_client_id: "368612528023.apps.googleusercontent.com",  // localhost:8080
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",  // "Czar Test Folder"
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://en.wikipedia.org/wiki/Puzzlehunt",
  hunt_info: "LOCALHOST TEST",
  team_url: "http://en.wikipedia.org/wiki/Team",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2013.
var leftout13_config = {
  server_url: "http://czar.emagino.net:433/",
  hunt_id: "mh2013",
  gapi_client_id: "368612528023-n65vkgeithp9k7ch3nr2e9rubnjqj5ib.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6TTE2LXpwYk16QzA",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://enigmavalley.com/",
  hunt_info: "user:leftout pass:leftierthanthou",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2013/hunt",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2014.
var leftout14_config = {
  server_url: "http://czar.emagino.net:433/",
  hunt_id: "mh2014",
  gapi_client_id: "368612528023-n65vkgeithp9k7ch3nr2e9rubnjqj5ib.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6TWtoVFJUSXZ4bzQ",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://www.aliceshrugged.com/",
  hunt_info: "user:teamleftout pass:leftierthanthou",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2014/hunt",
};

// Configuration for Objects in Mirror, Microsoft Puzzle Hunt 2014.
var msph2014_config = {
  server_url: "http://czar.emagino.net:433/",
  hunt_id: "msph2014",
  gapi_client_id: "368612528023-n65vkgeithp9k7ch3nr2e9rubnjqj5ib.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUbHliWTZNSFZvRkU",
  jobs_to_display: [],
  hunt_url: "http://puzzlehunt/15/",
  hunt_info: "user:<unknown> pass:<unknown>",
  team_url: "http://www.pavelspuzzles.com/",
};

// Configuration for W&T, Puzzle Boat 2.
var puzzleboat2_config = {
  server_url: "http://wczar.emagino.net:434/",
  hunt_id: "puzzleboat2",
  gapi_client_id: "368612528023-smkrhidhace7o0gsvta4mjk6mpcgjflk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUbWs5YXo0b1hKdm8",
  jobs_to_display: [],
  hunt_url: "http://www.pandamagazine.com/island2/index.php?f=PlayPB2",
  hunt_info: "",
  team_url: "",
};

// Configuration for Wei-Hwa's testing before the MITMH 2015.
var wh2015test_config = {
  server_url: "http://wczar.emagino.net:434/",
  hunt_id: "wh2015test",
  gapi_client_id: "368612528023-smkrhidhace7o0gsvta4mjk6mpcgjflk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUbWs5YXo0b1hKdm8",
  jobs_to_display: ["Love", "Marriage"],
  hunt_url: "http://www.pandamagazine.com/island2/index.php?f=PlayPB2",
  hunt_info: "",
  team_url: "",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2015.
var leftout15_config = {
  server_url: "http://czar.teamleftout.org:433/",
  hunt_id: "mh2015",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUNG1sX2FOTTY4ODQ",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "http://www.mit.edu/~puzzle/currhunt.html",
  hunt_info: "user:teamleftout pass:leftierthanthou",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2015/hunt",
  chat_domain: 'x.czar.teamleftout.org',
  chat_js: 'static/loadstub.js',
  chat_cachebuster: '4',
};

// Configuration for Team Left Out, MIT Mystery Hunt 2016.
var leftout16_config = {
  server_url: "http://czar.teamleftout.org:433/",
  hunt_id: "mh2016",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0B7WUjr1PseBmajBZcDhYcjFQR2s",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "http://www.mit.edu/~puzzle/currhunt.html",
  hunt_info: "Unknown yet!",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2016/hunt",
}

// Modify this to use a different config.
// var config = localhost_config
var config = leftout16_config
