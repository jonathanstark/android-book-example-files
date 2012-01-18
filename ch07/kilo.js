var db;
var jQT = $.jQTouch({
    icon: 'kilo.png'
});
$(document).ready(function(){

    $('#createEntry form').submit(createEntry);
    $('#settings form').submit(saveSettings);
    $('#settings').bind('pageAnimationStart', loadSettings);
    $('#dates li a').bind('click touchend', function() {
        var dayOffset = this.id;
        var date = new Date();
        date.setDate(date.getDate() - dayOffset);
        sessionStorage.currentDate = date.getMonth() + 1 + '/' + 
                                     date.getDate() + '/' + 
                                     date.getFullYear();
        refreshEntries();
    });
var shortName = 'Kilo';
var version = '1.1';
var displayName = 'Kilo';
var maxSize = 65536; 
db = openDatabase(shortName, '', displayName, maxSize);
if (db.version == '1.0') {
    db.changeVersion('1.0', version,
        function(transaction) {
            transaction.executeSql(
                'ALTER TABLE entries ' +
                '  ADD COLUMN longitude TEXT');
            transaction.executeSql(
                'ALTER TABLE entries ' +
                '  ADD COLUMN latitude TEXT');
        },
        function(e) {
            alert('DB upgrade error: ' + e.message);
        }
    );
} else if (db.version == '') {
  db.changeVersion('', version);
}

db.transaction(
    function(transaction) {
        transaction.executeSql(
            'CREATE TABLE IF NOT EXISTS entries ' +
            '  (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
            '   date DATE NOT NULL, food TEXT NOT NULL, ' +
            '   calories INTEGER NOT NULL, ' +
            '   longitude TEXT, latitude TEXT);'
        );
    }
);
$('#date').bind('pageAnimationEnd', function(e, info){
    if (info.direction == 'in') {
        startWatchingShake();
    }
});
$('#date').bind('pageAnimationStart', function(e, info){
    if (info.direction == 'out') {
        stopWatchingShake();
    }
});

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
function refreshEntries() {
    var currentDate = sessionStorage.currentDate;
    $('#date h1').text(currentDate);
    $('#date ul li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM entries WHERE date = ? ORDER BY food;', 
                [currentDate], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#entryTemplate').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#date ul');
                        newEntryRow.find('.label').text(row.food);
                        newEntryRow.find('.calories').text(row.calories);
                        newEntryRow.find('.delete').click(function(e){
                            var clickedEntry = $(this).parent();
                            var clickedEntryId = clickedEntry.data('entryId');
                            deleteEntryById(clickedEntryId);
                            clickedEntry.slideUp();
                            e.stopPropagation();
                            
                        });
                        newEntryRow.click(entryClickHandler);

                    }
                }, 
                errorHandler
            );
        }
    );
}
function createEntry() {
    navigator.geolocation.getCurrentPosition(
        function(position){
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            insertEntry(latitude, longitude);
        },
        function(){
            insertEntry();
        } 
    );
    return false;
}
function insertEntry(latitude, longitude) {
    var date = sessionStorage.currentDate;
    var calories = $('#calories').val();
    var food = $('#food').val();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO entries (date, calories, food, latitude, longitude) ' + 
                    'VALUES (?, ?, ?, ?, ?);',
                [date, calories, food, latitude, longitude],
                function(){
                    refreshEntries();
                    checkBudget();
                    jQT.goBack();
                }, 
                errorHandler
            );
        }
    );
}

function errorHandler(transaction, error) {
    alert('Oops. Error was '+error.message+' (Code '+error.code+')');
    return true;
}
function deleteEntryById(id) {
    db.transaction(
        function(transaction) {
            transaction.executeSql('DELETE FROM entries WHERE id=?;', 
              [id], null, errorHandler);
        }
    );
}

function checkBudget() {
    var currentDate = sessionStorage.currentDate;
    var dailyBudget = localStorage.budget;
    db.transaction(
        function(transaction) {
          transaction.executeSql(
            'SELECT SUM(calories) AS currentTotal FROM entries WHERE date = ?;', 
            [currentDate], 
            function (transaction, result) {
                var currentTotal = result.rows.item(0).currentTotal;
                if (currentTotal > dailyBudget) {
                    var overage = currentTotal - dailyBudget;
                    var message = 'You are '+overage+' calories over your '
                        + 'daily budget. Better start jogging!';
                    try {
                        navigator.notification.beep(1);
                        navigator.notification.vibrate(200);
                    } catch(e){
                        // No equivalent in web app
                    }
                    try {
                        navigator.notification.alert(message,
                                null, 'Over Budget', 'Dang!');
                    } catch(e) {
                        alert(message);
                    }
                }
            }, 
            errorHandler
          );
        }
    );
}
function entryClickHandler(e){
    sessionStorage.entryId = $(this).data('entryId');
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM entries WHERE id = ?;', 
                [sessionStorage.entryId], 
                function (transaction, result) {
                    var row = result.rows.item(0);
                    var food = row.food;
                    var calories = row.calories;
                    var latitude = row.latitude;
                    var longitude = row.longitude;
                    $('#inspectEntry input[name="food"]').val(food);
                    $('#inspectEntry input[name="calories"]').val(calories);
                    $('#inspectEntry input[name="latitude"]').val(latitude);
                    $('#inspectEntry input[name="longitude"]').val(longitude);
                    $('#mapLocation').click(function(){
                        window.location = 'http://maps.google.com/maps?z=15&q='+
                            food+'@'+latitude+','+longitude;
                    });
                    jQT.goTo('#inspectEntry', 'slideup');
                }, 
                errorHandler
            );
        }
    );
}
function dupeEntryById(entryId) {
  if (entryId == undefined) {
    alert('You have to have at least one entry in the list to shake a dupe.');
  } else {
    db.transaction(
        function(transaction) {
          transaction.executeSql(
            'INSERT INTO entries (date, food, calories, latitude, longitude) ' +
              'SELECT date, food, calories, latitude, longitude ' +
              'FROM entries WHERE id = ?;', 
            [entryId], 
            function() {
                 refreshEntries();
            }, 
            errorHandler
          );
        }
    );
  }
  startWatchingShake();
}
function startWatchingShake() {
    var lastReading = null;
    var threshold = 10;
    var success = function(coords){
        var current = coords.x + coords.y + coords.z;
        if (lastReading != null) {
            if (Math.abs(current - lastReading) > threshold) {
                var entryId = $('#date ul li:last').data('entryId');
                stopWatchingShake();
                dupeEntryById(entryId);
            }
        }
        lastReading = current;
    };
    var error = function(){};
    var options = {};
    options.frequency = 250;
    sessionStorage.watchId = 
      navigator.accelerometer.watchAcceleration(success, error, options);
}
function stopWatchingShake() {
    navigator.accelerometer.clearWatch(sessionStorage.watchId);
}
