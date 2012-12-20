var scopes = 'https://www.googleapis.com/auth/drive.file';

function loadGoogleApis() {
  window.setTimeout(checkAuth, 1);
}

function checkAuth() {
  gapi.auth.authorize({client_id: config.gapi_client_id,
    scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthClick() {
  gapi.auth.authorize({client_id: config.gapi_client_id,
    scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    document.forms.create.style.display = "inline";
    bind_input(document.forms.create.label, "Click to enter new puzzle name");
    document.forms.create.label.czar_autosubmit = false;
    document.forms.create.onsubmit = on_submit_create;
    document.getElementById("auth_button").style.display = "none";
  } else {
    if (authResult && authResult.error) {
      alert("Error: " + authResult.error);
    }
    document.forms.create.style.display = "none";
    document.getElementById("auth_button").style.display = "inline";
  }
}

function createNewSpreadsheet(czar_id, title) {
  var url = "";
  gapi.client.load('drive', 'v2', function() {
    var request = gapi.client.request({
      'path': '/drive/v2/files',
      'method': 'POST',
      'body': {
        'title': title,
        'mimeType':'application/vnd.google-apps.spreadsheet',
        'parents': [{"id": config.doc_folder_id}],
      }
    });
    request.execute(function(response) {
      send_value(czar_id, "sheet", response.alternateLink);
    });
  });
}
