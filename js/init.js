chrome.browserAction.onClicked.addListener(function(tab) {
    alert("Clicked");
    initFs();
});

chrome.contextMenus.create({
    "title" : "Save in Picasa",
    "type" : "normal",
    "contexts" : ["image"],
    "onclick" : function(info, tab) {
        console.log(info, tab);
        alert("Saved");
    }
});

function onInitFs(fs) {
  console.log('Opened file system: ' + fs.name);
}

function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}

function initFs() {
    window.requestFileSystem(window.PERSISTENT, 5*1024*1024 /*5MB*/, onInitFs, errorHandler);
}