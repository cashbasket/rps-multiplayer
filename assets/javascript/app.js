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

database.ref().on('value', function(snapshot) {
	
}, function(errorObject) {
	console.log('The read failed: ' + errorObject.code);
});