$(document).ready(function(){ 
    loadPage();
});
function loadPage(url) {
    if (url == undefined) {
        $('#container').load('index.html #header ul', hijackLinks);
    } else {
        $('#container').load(url + ' #content', hijackLinks);
    } 
}
function hijackLinks() {
    $('#container a').click(function(e){ 
        e.preventDefault(); 
        loadPage(e.target.href);
    }); 
}