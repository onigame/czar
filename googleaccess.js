// googleaccess.js: Handles Google sign-in and access to Google Docs.
//
// To use, import the Google API library and this file into the page:
//
//   <script src="https://apis.google.com/js/api.js" async defer></script>
//   <script src="googleaccess.js"></script>
//
// Then, within Javascript, call startGoogleAccess(), passing in the
// Google API Client ID (from https://console.developers.google.com/):
//
//   var goog = startGoogleAccess({
//     gapi_client_id: "blah.blah.googleusercontent.com"
//   });
//
// See if anyone's signed in (will be null if not):
//
//   alert("Logged in user: " + goog.getUserEmail());
//
// Register for changes in login state:
//
//   goog.addListener(function() { ... });
//
// When a user is not logged in, a modal dialog is created (blocking input
// to the page) with a button to sign in with Google.
// Once a user has logged in, you can manage docs:
//
//   goog.createSheet("title", function (docid, url) { ... });
//   goog.renameSheet(docid, "new title");
//
// These functions currently fail silently.

var startGoogleAccess = function(config) {
  // Creates the modal popup with the sign-in prompt.
  var setupModal = function() {
    var modalDiv = document.createElement("div");
    document.body.appendChild(modalDiv);
    modalDiv.style.position = "fixed";
    modalDiv.style.zIndex = 1;
    modalDiv.style.left = 0;
    modalDiv.style.top = 0;
    modalDiv.style.width = "100%";
    modalDiv.style.height = "100%";
    modalDiv.style.overflow = "auto";
    modalDiv.style.backgroundColor = "rgba(0,0,0,0.6)";

    var logo_w = 150, logo_h = 113;
    var button_w = 191, button_h = 46;
    var spinner_w = 50, spinner_h = 50;

    var boxDiv = document.createElement("div");
    modalDiv.appendChild(boxDiv);
    boxDiv.style.position = "fixed";
    boxDiv.style.top = "50%";
    boxDiv.style.left = "50%";
    boxDiv.style.transform = "translate(-50%, -50%)";
    boxDiv.style.minWidth = "40%";
    boxDiv.style.textAlign = "center";
    boxDiv.style.backgroundColor = "#eee";
    boxDiv.style.border = "2px solid #888";

    var logoImg = document.createElement("img");
    boxDiv.appendChild(logoImg);
    logoImg.src = "/images/czar_small.jpeg";
    logoImg.width = 150;
    logoImg.height = 113;
    logoImg.style.margin = 20;

    var statusP = document.createElement("p");
    boxDiv.appendChild(statusP);
    statusP.style.font = "100% sans-serif";
    statusP.style.margin = "0 20 20 20";

    var detailP = document.createElement("p");
    boxDiv.appendChild(detailP);
    detailP.style.font = "80% sans-serif";
    detailP.style.margin = "0 20 20 20";

    var spinnerImg = document.createElement("img");
    boxDiv.appendChild(spinnerImg);
    spinnerImg.src = "/images/spinner.gif";
    spinnerImg.width = spinner_w;
    spinnerImg.height = spinner_h;
    spinnerImg.style.margin = "0 20 20 20";

    var buttonImg = document.createElement("img");
    boxDiv.appendChild(buttonImg);
    buttonImg.src = "/images/google_signin.png";
    buttonImg.width = button_w;
    buttonImg.height = button_h;
    buttonImg.style.margin = "0 20 20 20";
    buttonImg.style.cursor = "pointer";

    // Modal dialog interface (internal to the google access module).
    out = {
      showSpinner: function() {
        // Leave the modal hidden if it was already.
        spinnerImg.style.display = "inline";
        buttonImg.style.display = "none";
      },

      showButton: function(onclick) {
        modalDiv.style.display = "block";
        spinnerImg.style.display = "none";
        buttonImg.style.display = "inline";
        buttonImg.onclick = onclick;
      },

      hide: function() {
        modalDiv.style.display = "none";
      },

      setStatusMessage: function(text, detail, url) {
        if (!url) {
          statusP.textContent = text;
        } else {
          var a = document.createElement("a");
          a.textContent = text;
          a.href = url;
          statusP.textContent = null;
          statusP.appendChild(a);
        }
        statusP.style.fontWeight = null;
        statusP.style.color = null;
        detailP.textContent = detail;
      },

      setErrorMessage: function(text, detail, url) {
        out.setStatusMessage(text, detail, url);
        statusP.style.fontWeight = "bold";
        statusP.style.color = "red";
      },
    }

    out.showSpinner();
    return out;
  };

  var listeners = [];
  var modal = setupModal();
  var authInstance = null;
  var lastUserId = null;
  var triedReloadingAuth = false;

  // Re-loads, re-initializes and re-authenticates Google Client APIs as needed.
  // Calls registered listeners if the logged in user (lastUserId) changes.
  // Shows or hides the modal dialog as needed, and updates its contents.
  var checkClient = function() {
    console.log("googleaccess: >> checkClient");

    if (authInstance == null) {
      modal.showSpinner();
      modal.setStatusMessage("Welcome to Czar.");

      var loadSuccess = function() {
        console.log("googleaccess: gapi.client.init() ...");
        gapi.client.init({
          clientId: config.gapi_client_id,
          scope: "profile email https://www.googleapis.com/auth/drive",
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        }).then(initSuccess, initFailure);
      }

      var initSuccess = function() {
        console.log("googleaccess: gapi.client.init() successful");
        authInstance = gapi.auth2.getAuthInstance();
        authInstance.currentUser.listen(checkClient);

        // Refresh the auth token (if any) every 30 minutes. 
        window.setInterval(function() {
          if (authInstance.isSignedIn.get()) {
            console.log("googleaccess: >> reloadAuthResponse() ... (periodic)");
            authInstance.currentUser.get().reloadAuthResponse();
          } else {
            console.log("googleaccess: (no user for periodic refresh)");
          }
        }, 30 * 60 * 1000);
          
        checkClient();  // Now, authInstance isn't null.
      }

      var initFailure = function(reason) {
        console.log("googleaccess: gapi.client.init() failed");
        modal.showButton(checkClient);  // TODO(egnor): Different button?
        modal.setErrorMessage(
            "Can't access Google", reason.details);
      }

      // TODO(egnor): How to tell if gapi.load() fails?
      console.log("googleaccess: gapi.load() ...");
      gapi.load("client:auth2", loadSuccess);
      return;
    }

    var checkFolder = function() {
      var folderSuccess = function() {
        console.log("googleaccess: gapi.client.drive.files.get() successful!");
        modal.hide();
        modal.setStatusMessage("This is Czar.");  // For next time.
        triedReloadingAuth = false;  // After success, be willing to try again.
      }

      var folderFailure = function(reason) {
        var user = authInstance.currentUser.get();
        if (user && reason.result.error.code == 401 && !triedReloadingAuth) {
          triedReloadingAuth = true;  // If it fails, don't keep trying.
          console.log("googleaccess: gapi.client.drive.files.get() => 401");
          console.log("googleaccess: reloadAuthResponse() ... (repair)");
          // reloadAuthResponse() seems to trigger checkClient (via listener)
          // anyway, but we can't count on that; give an explicit callback.
          user.reloadAuthResponse().then(checkFolder, checkFolder);
        } else {
          console.log("googleaccess: gapi.client.drive.files.get() failed");
          console.log("googleaccess: authInstance.signOut() ...");
          authInstance.signOut();
          modal.setErrorMessage(
              "Can't access Google Drive folder", reason.result.error.message,
              "https://drive.google.com/drive/folders/" + config.doc_folder_id);
        }
      }

      if (config.doc_folder_id) {
        // Don't declare victory until we verify folder access!
        modal.showSpinner();
        modal.setStatusMessage("Checking Google Drive access...");
        console.log("googleaccess: gapi.client.drive.files.get() ... (probe)");
        gapi.client.drive.files.get({fileId: config.doc_folder_id}).then(
            folderSuccess, folderFailure);
      } else {
        folderSuccess();
      }
    }

    var currentUserId;
    if (authInstance.isSignedIn.get()) {
      console.log("googleaccess: authInstance.isSignedIn.get() => true");
      checkFolder();
      currentUserId = authInstance.currentUser.get().getId();
    } else {
      console.log("googleaccess: authInstance.isSignedIn.get() => false");
      modal.showButton(function() { authInstance.signIn(); });
      currentUserId = null;
    }

    if (lastUserId != currentUserId) {
      lastUserId = currentUserId;
      var copy = listeners.slice(0), num = listeners.length;
      for (var i = 0; i < num; ++i) copy[i]();
    }
  };

  checkClient();

  // Public interface for other modules within Czar to use.
  return {
    getUserEmail: function() {
      if (!authInstance) return null;
      if (!authInstance.isSignedIn.get()) return null;
      return authInstance.currentUser.get().getBasicProfile().getEmail();
    },

    signOut: function() {
      if (authInstance != null) authInstance.disconnect();
    },

    addListener: function(callback) { listeners.push(callback); },

    removeListener: function(callback) {
      var i = listeners.indexOf(callback);
      if (i >= 0) listeners.splice(i);
    },

    createSheet: function(title, callback) {
      if (!authInstance || !authInstance.isSignedIn.get()) {
        console.log("createSheet(\"" + title + "\") without user login!");
        return;  // The dialog should prevent this, but there could be races...
      }

      if (config.template_doc_id) {
        console.log("googleaccess: gapi.client.drive.files.copy()");
        gapi.client.drive.files.copy({
          fileId: config.template_doc_id,
          name: title,
          fields: "id,webViewLink",
          parents: config.doc_folder_id ? [config.doc_folder_id] : null,
        }).then(function (r) { callback(r.result.id, r.result.webViewLink); });
      } else {
        console.log("googleaccess: gapi.client.drive.files.create()");
        gapi.client.drive.files.create({
          name: title,
          mimeType: "application/vnd.google-apps.spreadsheet",
          fields: "id,webViewLink",
          parents: config.doc_folder_id ? [config.doc_folder_id] : null,
        }).then(function (r) { callback(r.result.id, r.result.webViewLink); });
      }
    },

    renameSheet: function(docid, title) {
      if (!authInstance || !authInstance.isSignedIn.get()) {
        console.log("renameSheet(\"" + title + "\") without user login!");
        return;  // The dialog should prevent this, but there could be races...
      }

      gapi.client.drive.files.update({fileId: docid, name: title}).then();
    },
  };
}
