// Configuration for localhost testing.
var localhost_config = {
  server_url: "http://localhost:8888/",
  hunt_id: "localtest",
  gapi_client_id: "368612528023.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6VEc0QW9LTHhWVUU",
  hunt_url: "http://en.wikipedia.org/wiki/Puzzlehunt",
  hunt_info: "no login necessary",
  team_url: "http://en.wikipedia.org/wiki/Team",
};

// Configuration for Team Left Out, MIT Mystery Hunt 2013.
var leftout13_config = {
  server_url: "http://czar.emagino.net:433/",
  hunt_id: "mh2013",
  gapi_client_id: "368612528023-n65vkgeithp9k7ch3nr2e9rubnjqj5ib.apps.googleusercontent.com",
  doc_folder_id: "0B5i1K9hv1-e6TTE2LXpwYk16QzA",
  hunt_url: "http://web.mit.edu/puzzle/www/",
  hunt_info: "user:teamleftout pass:leftierthanthou",
  team_url: "https://sites.google.com/a/teamleftout.org/mh2013/hunt",
};

// Modify this to use a different config.
var config = localhost_config;
