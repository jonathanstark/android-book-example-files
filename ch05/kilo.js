var jQT = $.jQTouch({ 
    icon: 'kilo.png'
}); 
$(document).ready(function(){
    $('#settings form').submit(saveSettings);
});
function saveSettings() {
    localStorage.age = $('#age').val();
    localStorage.budget = $('#budget').val();
    localStorage.weight = $('#weight').val(); 
    jQT.goBack();
    return false;
}