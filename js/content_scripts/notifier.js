chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    $.jGrowl(request.message, {
        header: 'Picasa Image Uploader',
        life: 3000
    });
});
