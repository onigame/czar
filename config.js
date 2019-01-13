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

// Configuration for W&T, Puzzle Boat 2.
var puzzleboat2_config = {
  stateserver_url: "http://wczar.emagino.net:434/puzzleboat2",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUbWs5YXo0b1hKdm8",
  jobs_to_display: [],
  hunt_url: "http://www.pandamagazine.com/island2/index.php?f=PlayPB2",
  hunt_info: "",
  team_url: "",
};

// Configuration for Objects in Mirror, Microsoft Puzzle Hunt 2016.
var msph2016_config = {
  stateserver_url: "http://czar.emagino.net:433/msph2016",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUQjZ2c2p0aDRVZHM",
  jobs_to_display: [],
  hunt_url: "https://puzzlehunt.research.microsoft.com/17/Team.aspx",
  hunt_info: "",
  team_url: "http://www.pavelspuzzles.com/",
};

// Configuration for Berkeley Mystery Hunt, 2016.
var berk2016_config = {
  stateserver_url: "http://emagino.net:587/berk2016",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUeWx6a2hGdndYc2c",
  jobs_to_display: [],
  hunt_url: "https://oskibearin.space/",
  hunt_info: "",
  team_url: "",
};

// Configuration for WIT, SUMS.
var sums2016_config = {
  stateserver_url: "http://wczar.emagino.net:434/sums2016",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0BwXGC8wDbipUVHNab0Q4Q3ZLLW8",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Away"],
  hunt_url: "http://www.maths.usyd.edu.au/ub/sums/puzzlehunt/2016/solve",
  hunt_info: "Username: House of WIT  Password: fgd",
  team_url: "",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2017.
var leftout17_config = {
  stateserver_url: "http://czar.teamleftout.org:433/mh2017",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6bmNHNE4tc1lDY1U",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "http://www.mit.edu/~puzzle/currhunt.html",
  hunt_info: "Unknown yet!",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2017/hunt",
  sheet_url_wrapper: "/czarchat/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2018.
var leftout18_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2018",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "1_t7GcS_PAnAZs1GfWv0C8wEzBas1nk1c",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "https://head-hunters.org/",
  hunt_info: "username: teamleftout; password: leftierthanthou",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2018/hunt",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2019.
var leftout19_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2019",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "1IM8h1fMcAppP6n1ZTCPSHlcALfkeoyEO",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "TBD",
  hunt_info: "TBD",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2019/",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
};

// Modify this to use a different config.
var config = leftout19_config
