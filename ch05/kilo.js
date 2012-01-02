var jQT = $.jQTouch({ 
    icon: 'kilo.png'
}); 
$(document).ready(function(){
    $('#settings form').submit(saveSettings);
    $('#settings').bind('pageAnimationStart', loadSettings);
});
function saveSettings() {
    localStorage.age = $('#age').val();
    localStorage.budget = $('#budget').val();
    localStorage.weight = $('#weight').val(); 
    jQT.goBack();
    return false;
}
function loadSettings() {
    if (!localStorage.age) {
        localStorage.age = ""; 
    }
    if (!localStorage.budget) { 
        localStorage.budget = "";
    }
    if (!localStorage.weight) {
        localStorage.weight = ""; 
    }
    $('#age').val(localStorage.age);
    $('#budget').val(localStorage.budget);
    $('#weight').val(localStorage.weight);
}
