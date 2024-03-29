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
  stateserver_url: "https://czartest.teamleftout.org/stateserver/czartest",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",  // "Czar Test Folder"
  template_doc_id: "1-fo_BrxgngvleyL2I9t91q4jNvcMUAzDHx9fp0nBvIo",
  jobs_to_display: ["Puzzle Czar", "Comm Czar"],
  hunt_url: "http://en.wikipedia.org/wiki/Puzzlehunt",
  hunt_info: "TEST CZAR INSTANCE",
  team_url: "http://en.wikipedia.org/wiki/Team",
  sheet_url_wrapper: "/czarchat/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
  video_room_prefix: "%F0%9F%91%88czartest",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2021.
var leftout21_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2021",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "1i2WvyhMLNkL0rCsRk7O9Dc6nyKrq_3jd",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "https://perpendicular.institute/",
  hunt_info: "teamleftout / left1erthanthout",
  team_url: "https://sites.google.com/teamleftout.org/mh2021/",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
  video_room_prefix: "OzvhGzaoJpo",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2022.
var leftout22_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2022",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "1hagdpYEFDgQnMvmVFmhKReOdmeeSevbo",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "https://www.starrats.org/",
  hunt_info: "teamleftout / left1erthanthout",
  team_url: "https://sites.google.com/view/mh2022/2022-hunt",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
  video_room_prefix: "%F0%9F%91%88leftout",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2023.
var leftout23_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2023",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "1_0ODgW07y09YyMdR5RymlPn-rbZvGSQk",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "https://interestingthings.museum/",
  hunt_info: "login username : LeftOut ; Team Password : leftierthanthou",
  team_url: "https://sites.google.com/view/mh2023/",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
  video_room_prefix: "%F0%9F%91%88leftout",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2024.
var leftout24_config = {
  stateserver_url: "https://czar.teamleftout.org/stateserver/mh2024",
  gapi_client_id: "368612528023-s8093hetppbt833d5fr9cegmmvaon9gk.apps.googleusercontent.com",
  doc_folder_id: "13XWyvIwA7-hXX7JvhnVkp0yY4IkoD2c_",
  template_doc_id: "13aL5kga4BUCSiaEyfFtwJvubpNrUlvoClyEdaiyEyUQ",
  jobs_to_display: ["Puzzle Czar", "RC East", "RC West"],
  activities_to_display: ["Away", "Sleeping", "Mothing"],
  hunt_url: "https://mitmh2024.com/",
  hunt_info: "Hunt Info TBD",
  team_url: "https://sites.google.com/view/mh2024/",
  sheet_url_wrapper: "https://czarchat.teamleftout.org/czarchat/index.html?channelName=@CHANNEL@&URL=@URL@&title=@TITLE@",
  video_room_prefix: "%F0%9F%91%88leftout",
};

// Modify this to use a different config.
var config = leftout24_config;
