var scopes = 'https://www.googleapis.com/auth/drive';
var debug = true;

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
      alert("Authentication failed: " + authResult.error);
    }
    document.forms.create.style.display = "none";
    document.getElementById("auth_button").style.display = "inline";
  }
}

function createSpreadsheet(title, callback) {
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
    request.execute(function(resp) {
      if (!resp.error) {
        if (debug) console.log('Created spreadsheet: ' + title);
        callback(resp.id, resp.alternateLink);
      } else {
        alert('Spreadsheet not created!\nError ' + resp.error.code + ': ' + resp.error.message);
      }
    });
  });
}

function renameSpreadsheet(id, title) {
  gapi.client.load('drive', 'v2', function() {
    var request = gapi.client.request({
      'path': '/drive/v2/files/' + id,
      'method': 'PUT',
      'body': {
        'title': title,
      }
    });
    request.execute(function(resp) {
      if (!resp.error) {
        if (debug) console.log('Renamed spreadsheet: ' + title);
      } else {
        alert('Spreadsheet not renamed!\nError ' + resp.error.code + ': ' + resp.error.message);
      }
    });
  });
}
