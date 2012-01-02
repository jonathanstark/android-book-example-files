var hist = []; 
var startUrl = 'index.html'; 
$(document).ready(function(){
    loadPage(startUrl);
});
function loadPage(url) {
    $('body').append('<div id="progress">Loading...</div>'); 
    scrollTo(0,0); 
    if (url == startUrl) {
        var element = ' #header ul'; 
    } else {
        var element = ' #content';
    }
    $('#container').load(url + element, function(){
        var title = $('h2').html() || 'Hello!'; 
        $('h1').html(title); 
        $('h2').remove(); 
        $('.leftButton').remove(); 
        hist.unshift({'url':url, 'title':title}); 
        if (hist.length > 1) {
            $('#header').append('<div class="leftButton">'+hist[1].title+'</div>'); 
            $('#header .leftButton').click(function(e){
                $(e.target).addClass('clicked');
                var thisPage = hist.shift(); 
                var previousPage = hist.shift(); 
                loadPage(previousPage.url);
            });
        } 
        $('#container a').click(function(e){
            var url = e.target.href; 
            if (url.match(window.location.hostname)) {
                e.preventDefault(); 
                loadPage(url);
            }
        });
        $('#progress').remove();
    });
}
