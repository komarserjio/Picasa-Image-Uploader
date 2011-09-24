var PIU = {

    targetImage: null,

    progressIntervalId: null,
    
    googleUsername: null,
    
    isUploadingNow: false,

    options: {
        picasaIndexUrl: 'http://picasaweb.google.com/',
        picasaApiUrl: 'https://picasaweb.google.com/data/feed/api/user/',
        loginNotifierDelay: 3000,
        waitNotifierDelay: 3000,
        successNotifierDelay: 1500,
        errorNotifierDelay: 4000
    },

    init: function() {
        this.initOnClickHandler();
        this.initContextMenu();
        this.initTitle();
    },

    initOnClickHandler: function () {
        chrome.browserAction.onClicked.addListener(function(tab) {
            chrome.tabs.create({
                url: PIU.options.picasaIndexUrl    
            });
        });
    },


    initContextMenu: function() {
        chrome.contextMenus.create({
            "title" : chrome.i18n.getMessage("menuItemName"),
            "type" : "normal",
            "contexts" : ["image"],
            "onclick" : function(info, tab) {
                if (PIU.isUploadingNow) {
                    PIU.showNotifier({
                        message: chrome.i18n.getMessage("waitMessage"),
                        delay: PIU.options.notifierDelay
                    });
                    return;
                }
                var image = info.srcUrl;
                PIU.prepareTargetImage(image);
                PIU.process();
            }
        });
    },

    initTitle: function() {
        chrome.browserAction.setTitle({title: chrome.i18n.getMessage("extensionName")})
    },

    showNotifier: function(notifyData) {
        chrome.tabs.getSelected(null, function(tab) {
            // send request to content script
            chrome.tabs.sendRequest(tab.id, notifyData, function(response) {});
        });
    },
                      
    findGoogleUsername: function(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.options.picasaIndexUrl, true);
        xhr.onload = function(e) {
            // brutal method to find username :)
            var pos = this.response.search('[a-zA-Z0-9.]+@gmail.com');
            if (pos < 0) {
                PIU.showNotifier({
                    message: chrome.i18n.getMessage("loginMessage"),
                    delay: PIU.options.loginNotifierDelay
                });
                PIU.stopProgressBar(false);
                return;
            }
            var substring = this.response.substr(pos, 100);
            var atPosition = substring.indexOf('@');
            var username = substring.substr(0, atPosition);

            PIU.googleUsername = username;
            callback();
        }
        xhr.send();
    },

    sendToPicasa: function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', PIU.targetImage.path, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function(e) {
            if (this.status == 200) {
                
                var xhr = new XMLHttpRequest();    
                xhr.open('POST', PIU.options.picasaApiUrl + PIU.googleUsername + '/', true);
                xhr.setRequestHeader("Content-Type", PIU.targetImage.contentType);
    
                xhr.onload = function(e) {
                    PIU.analyzeResponse(this);
                };
                
                xhr.send(this.response);
            } else {
                // show notify about fail
            }
        };
        xhr.send();
    },

    analyzeResponse: function(response) {
        var isSuccess;
        if (response.status == 201) {
            isSuccess = true;
            PIU.showNotifier({
                message: chrome.i18n.getMessage("successMessage"),
                delay: PIU.options.successNotifierDelay        
            });
        } else {
            isSuccess = false;
            PIU.showNotifier({
                message: chrome.i18n.getMessage("errorMessage"),
                delay: PIU.options.errorNotifierDelay        
            });
        }

        PIU.stopProgressBar(isSuccess);
    },

    process: function() {
        this.startProgressBar();
        // chain of callbacks started here
        this.findGoogleUsername(this.sendToPicasa);
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
        this.isUploadingNow = true;
    },

    stopProgressBar: function(success) {
        // show success title only if operation was successfull 
        if (success) {
            chrome.browserAction.setBadgeText({text: 'Done'});
        };
        setTimeout(function(){
            chrome.browserAction.setBadgeText({text: ''});
        }, 2000);
        clearInterval(this.progressIntervalId);
        this.isUploadingNow = false;
    }

}
PIU.init();

