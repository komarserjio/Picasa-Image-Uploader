var PIU = {

    targetImage: {},

    filesystem: {},

    progressIntervalId: null,
    
    googleUsername: '',

    options: {
        filesize: 5242880, // 5 MB
        picasaIndexUrl: 'http://picasaweb.google.com/',
        picasaApiUrl: 'https://picasaweb.google.com/data/feed/api/user/'
    },

    init: function() {
        chrome.browserAction.onClicked.addListener(function(tab) {
            // show options
        });
        this.initFileSystem();
        this.initContextMenu();
        this.initTitle();
    },

    initFileSystem: function() {
        window.requestFileSystem(window.PERSISTENT, this.options.filesize, this.onInitFileSystem, this.errorHandler);
    },

    initContextMenu: function() {
        chrome.contextMenus.create({
            "title" : "Save in Picasa",
            "type" : "normal",
            "contexts" : ["image"],
            "onclick" : function(info, tab) {
                var image = info.srcUrl;
                PIU.prepareTargetImage(image);
                PIU.process();
            }
        });
    },

    initTitle: function() {
        chrome.browserAction.setTitle({title: 'Picasa Image Uploader'})
    },

    onInitFileSystem: function(fs) {
        console.log('Opened file system: ' + fs.name);
        PIU.filesystem = fs;                  
    },

    errorHandler: function(e) {
      var msg = '';
      console.log(e);
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
    },
                      
    findGoogleUsername: function(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.options.picasaIndexUrl, true);
        xhr.onload = function(e) {
            // brutal method to find username :)
            var pos = this.response.search('[a-zA-Z0-9.]+@gmail.com');
            if (pos < 0) {
                // XXX replace alert with popup
                alert('You are not logined');
                PIU.stopProgressBar();
                return;
            }
            var substring = this.response.substr(pos, 100);
            var atPosition = substring.indexOf('@');
            var username = substring.substr(0, atPosition);

            console.log(username);

            PIU.googleUsername = username;
            callback(PIU.saveImageOnPicasa);
        }
        xhr.send();
    },

    saveImageLocally: function(callback) {
        var fs = PIU.filesystem;
        fs.root.getFile(PIU.targetImage.name, {
            create: true
        }, function(fileEntry) {
            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function(fileWriter) {

                fileWriter.onwriteend = function(e) {
                    console.log('Write completed.');
                    callback();
                };

                fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString());
                };

                var bb = new window.WebKitBlobBuilder();
                
                var xhr = new XMLHttpRequest();
                xhr.open('GET', PIU.targetImage.path, true);
                xhr.responseType = 'arraybuffer';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        var bb = new window.WebKitBlobBuilder();
                        bb.append(this.response); 
                        console.log(this.response);
                        var blob = bb.getBlob(PIU.targetImage.contentType);
                        console.log(blob);
                        fileWriter.write(blob);
                    }
                };
                xhr.send();

            }, PIU.errorHandler);

        }, PIU.errorHandler);
    },

    saveImageOnPicasa: function() {
        var fs = PIU.filesystem;
        fs.root.getFile(PIU.targetImage.name, {}, function(fileEntry) {
            fileEntry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function(e) {
                    var binaryImage = this.result;
                    console.log(this.result);
                    var xhr = new XMLHttpRequest();    
                    xhr.open('POST', PIU.options.picasaApiUrl + PIU.googleUsername + '/', true);
                    xhr.setRequestHeader("Content-Type", PIU.targetImage.contentType);
        
                    xhr.onload = function(e) {
                        console.log(this.status);
                        console.log(this.responseText);
                        PIU.stopProgressBar();
                    };

                    var bb = new window.WebKitBlobBuilder();
                    bb.append(this.result);
                    console.log(bb);
                    
                    xhr.send(bb.getBlob());
                };

                reader.readAsArrayBuffer(file);
            }, PIU.errorHandler);

        }, PIU.errorHandler);
                       
    },

    process: function() {
        this.startProgressBar();
        // chain of callbacks started here
        this.findGoogleUsername(this.saveImageLocally);
    },

    prepareTargetImage: function (image) {
        var name = image.split('/').pop();
        var nameParts = name.split(".");
        var contentType = '';
        switch (nameParts[1]) {
            case 'png':
                contentType = 'image/png';
                break;
            case 'gif':
                contentType = 'image/gif';
                break;
            case 'bmp':
                contentType = 'image/bmp';
                break;
            default: 
                contentType = 'image/jpeg';
                break;
        }
        this.targetImage = {
            path: image,
            name: name,
            contentType: contentType
        }
    },

    startProgressBar: function() {
        var progress = 0;
        var intervalId = setInterval(function() {
            switch (progress) {
                case 0:
                    var text = '.  ';
                    progress++
                break;
                case 1:
                    var text = ' . ';
                    progress++;
                break;
                default:
                    var text = '  .';
                    progress = 0;
                break;
            }
            chrome.browserAction.setBadgeText({text: text});
        }, 500);

        this.progressIntervalId = intervalId;
    },

    stopProgressBar: function() {
        chrome.browserAction.setBadgeText({text: 'Done'});
        setTimeout(function(){
            chrome.browserAction.setBadgeText({text: ''});
        }, 2000);
        clearInterval(this.progressIntervalId);
    }

}
PIU.init();

