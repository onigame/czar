// See README.md for configuration directions.

var localhost_config = {
  stateserver_url: "http://localhost:8888/localhost",
  gapi_client_id: "368612528023.apps.googleusercontent.com",  // localhost:8080
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",  // "Czar Test Folder"
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://en.wikipedia.org/wiki/Puzzlehunt",
  hunt_info: "LOCALHOST TEST",
  team_url: "http://en.wikipedia.org/wiki/Team",
};

var czartest_config = {
  stateserver_url: "http://czartest.ofb.net:8888/czartest",
  gapi_client_id: "100113902549-umetccnfbpm0irmivj03lknl7lbq08j0.apps.googleusercontent.com",
  // gapi_client_id: "368612528023-h585b3do0p04h52dmodnmibqv3v2i799.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",  // "Czar Test Folder"
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://www.mit.edu/~puzzle/currhunt.html",
  hunt_info: "TEST CZAR INSTANCE",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2016/hunt",
  sheet_url_wrapper: "http://hawku.com/leftout/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@",
};

// Configuration for W&T, Puzzle Boat 2.
var puzzleboat2_config = {
  stateserver_url: "http://wczar.emagino.net:434/puzzleboat2",
  gapi_client_id: "368612528023-smkrhidhace7o0gsvta4mjk6mpcgjflk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUbWs5YXo0b1hKdm8",
  jobs_to_display: [],
  hunt_url: "http://www.pandamagazine.com/island2/index.php?f=PlayPB2",
  hunt_info: "",
  team_url: "",
};

// Configuration for Wei-Hwa's testing before the MITMH 2015.
var wh2015test_config = {
  stateserver_url: "http://wczar.emagino.net:434/mh2015test",
  gapi_client_id: "368612528023-smkrhidhace7o0gsvta4mjk6mpcgjflk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUbWs5YXo0b1hKdm8",
  jobs_to_display: ["Love", "Marriage"],
  hunt_url: "http://www.pandamagazine.com/island2/index.php?f=PlayPB2",
  hunt_info: "",
  team_url: "",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2016.
var leftout16_config = {
  stateserver_url: "http://czar.teamleftout.org:433/mh2016",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0B7WUjr1PseBmajBZcDhYcjFQR2s",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "http://www.mit.edu/~puzzle/currhunt.html",
  hunt_info: "Unknown yet!",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2016/hunt",
}

// Modify this to use a different config.
var config = czartest_config
