// See README.md for configuration directions.

var localhost_config = {
  stateserver_url: "http://localhost:8888/localhost",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",  // "Czar Test Folder"
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://en.wikipedia.org/wiki/Puzzlehunt",
  hunt_info: "LOCALHOST TEST",
  team_url: "http://en.wikipedia.org/wiki/Team",
};

var czartest_config = {
  stateserver_url: "http://czartest.ofb.net:8888/czartest",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",  // "Czar Test Folder"
  template_doc_id: "1-fo_BrxgngvleyL2I9t91q4jNvcMUAzDHx9fp0nBvIo",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://en.wikipedia.org/wiki/Puzzlehunt",
  hunt_info: "TEST CZAR INSTANCE",
  team_url: "http://en.wikipedia.org/wiki/Team",
  sheet_url_wrapper: "/czarchat/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2021.
var leftout21_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2021",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "1i2WvyhMLNkL0rCsRk7O9Dc6nyKrq_3jd",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "https://yewlabs.mit.edu/",
  hunt_info: "TBD",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2021/",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
};

// Modify this to use a different config.
var config = leftout21_config
