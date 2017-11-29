// Initialize Firebase
var config = {
	apiKey: 'AIzaSyBPtH_QWjgfLxZMDATfy-SgUiMQOSBZTrA',
	authDomain: 'fir-project-f5098.firebaseapp.com',
	databaseURL: 'https://fir-project-f5098.firebaseio.com',
	projectId: 'fir-project-f5098',
	storageBucket: 'fir-project-f5098.appspot.com',
	messagingSenderId: '307263825343'
};
firebase.initializeApp(config);
var database = firebase.database();
var playersRef = database.ref('/players');

var playerNum;

$('#start').on('click', function(event) {
	event.preventDefault();
	//maybe put code below in here?
});

// When the client's connection state changes...
database.ref('.info/connected').on('value', function(snapshot) {
	var player;
	//if user is connected...
	if (snapshot.val() === true) {
		if(playersRef.hasChild('1')) {
			player = playersRef.push({
				2: {
					name: 'Testing',
					wins: 0,
					losses: 0
				}
			});
			playerNum = 2;
		} else {
			player = playersRef.push({
				1: {
					name: 'Testing',
					wins: 0,
					losses: 0
				}
			});
			playerNum = 1;
		}
		//remove connection if user disconnects
		player.onDisconnect().remove();
	}
});

//TODO: when connections list changes, do stuff
playersRef.on('value', function(snapshot) {
	if (snapshot.numChildren() < 2) {
		// we have an open spot
	} else {
		// we're ready to play
	}
});