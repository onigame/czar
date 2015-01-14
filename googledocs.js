var scopes = 'https://www.googleapis.com/auth/drive';
var logged_in = false;
var debug = true;

function loadGoogleApis() {
  window.setTimeout(checkAuth, 1);
}

function checkAuth() {
  gapi.auth.authorize({client_id: config.gapi_client_id,
    scope: scopes, immediate: true}, handleAuthResultSilent);
}

function handleAuthClick() {
  gapi.auth.authorize({client_id: config.gapi_client_id,
    scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

function handleAuthResultSilent(authResult) {
  handleAuthResult(authResult, true);
}

function handleAuthResult(authResult, silent) {
  if (authResult && !authResult.error) {
    if (debug) console.log('Authentication successful.');
    checkFolderAccess(silent);
  } else {
    if (authResult && authResult.error && !silent) {
      alert("Authentication failed: " + authResult.error);
    }
    handleNotLoggedIn();
  }
}

function checkFolderAccess(silent) {
  gapi.client.load('drive', 'v2', function() {
    var request = gapi.client.request({
      'path': '/drive/v2/files/' + config.doc_folder_id,
      'method': 'GET',
      });
    request.execute(function(resp) {
      if (!resp.error) {
        if (debug) console.log('Verified access to shared folder.');
        handleLoggedIn();
      } else {
        if (!silent) {
          alert('Access to shared folder denied!\nAsk someone else on the team with access to add you.\n\n' +
            '\nDetails: ' + resp.error.code + ': ' + resp.error.message);
        }
        handleNotLoggedIn();
      }
    });
  });
} 

function handleLoggedIn() {
  logged_in = true;
  document.forms.create.style.display = "inline";
  bind_input(document.forms.create.label, "Click to enter new puzzle name");
  document.forms.create.label.czar_autosubmit = false;
  document.forms.create.onsubmit = on_submit_create;
  document.getElementById("auth_button").style.display = "none";
}

function handleNotLoggedIn() {
  logged_in = false;
  document.forms.create.style.display = "none";
  document.getElementById("auth_button").style.display = "inline";
}

function createSpreadsheet(title, callback) {
  if (!logged_in) {
    alert('To add new puzzles, authenticate with Google using the button above.');
    return false;
  }
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
  return true;
}

function renameSpreadsheet(id, title) {
  if (!logged_in) {
    alert('To edit puzzle names, authenticate with Google using the button above.');
    return false;
  }
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
  return true;
}
