chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    $.jGrowl(request.message, {
        header: chrome.i18n.getMessage("extensionName"),
        life: request.delay
    });
});
