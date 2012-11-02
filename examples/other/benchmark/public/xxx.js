var page = require('webpage').create();
var url = 'http://localhost:3000';
page.open(url, function (status) {
    console.log("XXX", status);
});
