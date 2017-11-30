// Initialize Firebase
var config = {
	apiKey: 'AIzaSyCqS6PORnPjshYHiutBMncJDi4qu7HtC6Y',
	authDomain: 'rps-multiplayer-1859a.firebaseapp.com',
	databaseURL: 'https://rps-multiplayer-1859a.firebaseio.com',
	projectId: 'rps-multiplayer-1859a',
	storageBucket: '',
	messagingSenderId: '397423141718'
};
firebase.initializeApp(config);
var turn = 1;
var database = firebase.database();
var playersRef = database.ref('/players');
var player1Ref = database.ref('/players/1');
var player2Ref = database.ref('/players/2');
var turnRef = database.ref('/turn');

var game = {
	playerNum: '',
	playerName: '',
	playerChoice: '',
	wins: 0,
	losses: 0,
	ties: 0,
	winState: '',
	initGame: function() {
		playersRef.on('value', function(snapshot) {
			if (snapshot.numChildren() === 2) {
				database.ref().child('turn').set(turn);
				//maybe???
				game.playerReady(turn);
			} else {
				game.turn = 1;
				database.ref().child('turn').remove();
			}

			if (snapshot.hasChild('1')) {
				player1Ref.once('value', function(p1Snap) {
					$('#player-1-name').text(p1Snap.val().name);
				});
				$('#player-1').removeClass('hidden');
				$('#wait-1').addClass('hidden');
			} else {
				$('#player-1').addClass('hidden');
				$('#wait-1').removeClass('hidden');
			}

			if (snapshot.hasChild('2')) {
				player2Ref.once('value', function(p2Snap) {
					$('#player-2-name').text(p2Snap.val().name);
				});
				$('#player-2').removeClass('hidden');
				$('#wait-2').addClass('hidden');
			} else {
				$('#player-2').addClass('hidden');
				$('#wait-2').removeClass('hidden');
			}

		});
	},
	initPlayer: function() {
		database.ref('.info/connected').on('value', function(snapshot) {
			game.playerName = $('#name').val().trim();
			//if user is connected...
			if(snapshot.val() === true) {
				//check to see which player (1 or 2) needs to be added
				playersRef.once('value', function(players) {
					if (players.numChildren() < 2) {
						if(players.hasChild('1')) {
							game.playerNum = '2';
						} else {
							game.playerNum = '1';
						}

						playersRef.child(game.playerNum).set({
							name: game.playerName,
							wins: 0,
							losses: 0,
							ties: 0
						});
						$('#startDiv').hide();
						$('#playerInfo').removeClass('hidden')
							.text('Hi, ' + game.playerName + '! You are player ' + game.playerNum + '.');					
	
						//remove player data when player disconnects.
						playersRef.child(game.playerNum).onDisconnect().remove();
					} else {
						alert('Sorry, there are already two players playing!');
					}
				});
			}
		});	
	},
	playerReady: function(turn) {
		if(this.playerNum === '1' && turn === 1) {
			$('#player-1 > .buttons').removeClass('hidden');
		} else if (this.playerNum === '2' && turn === 2) {
			$('#player-2 > .buttons').removeClass('hidden');
		}
	},
	processSelection: function(selection) {
		this.playerChoice = selection;

		// set player's choice in database
		playersRef.child(this.playerNum).child('choice').set(selection);

		// if player 2 has answered, it means both players have answered, so we can figure out the winner
		if(this.playerNum === '2') {
			//first, set turn back to player 1's turn
			this.turn = 1;
			database.ref().child('turn').set(this.turn);

			var otherPlayerChoice;
			if(this.playerNum == '1') {
				player2Ref.once('value', function(snap) {
					otherPlayerChoice = snap.val().choice;
				});
			} else {
				player1Ref.once('value', function(snap) {
					otherPlayerChoice = snap.val().choice;
				});
			}
			if (this.playerChoice === 'rock') {
				if(otherPlayerChoice == 'paper') {
					this.winState = 'lose';
				}
				else if(otherPlayerChoice == 'scissors') {
					this.winState = 'win';
				}
				else {
					this.winState = 'tie';
				}
			} else if (this.playerChoice === 'paper') {
				if(otherPlayerChoice == 'scissors') {
					this.winState = 'lose';
				}
				else if(otherPlayerChoice == 'rock') {
					this.winState = 'win';
				}
				else {
					this.winState = 'tie';
				}
			} else if (this.playerChoice === 'scissors') {
				if(otherPlayerChoice == 'rock') {
					this.winState = 'lose';
				}
				else if(otherPlayerChoice == 'paper') {
					this.winState = 'win';
				}
				else {
					this.winState = 'tie';
				}
			}
	
			if (this.winState == 'win') {
				this.wins++;
				playersRef.child(this.playerNum).child('wins').update(this.wins);
			}
			else  if (this.winState == 'lose') {
				this.losses++;
				playersRef.child(this.playerNum).child('losses').update(this.losses);
			}
			else {
				this.ties++;
				playersRef.child(this.playerNum).child('ties').set(this.ties);
			}
		} else {
			// it is now player 2's turn
			turn = 2;
			database.ref().update({
				turn: turn
			});
			turnRef.once('value', function(snapshot) {
				console.log(snapshot.val());
			});
			this.playerReady(turn);
		}
	}
};

$(document).ready(function() {
	game.initGame();
	$('#loginForm').on('submit', function(event) {
		event.preventDefault();
		game.initPlayer();
	});

	$('body').on('click', '.selection', function() {
		game.processSelection($(this).data('value'));
	});
});