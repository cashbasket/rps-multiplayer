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
var database = firebase.database();
var playersRef = database.ref('/players');
var player1Ref = database.ref('/players/1');
var player2Ref = database.ref('/players/2');
var turnRef = database.ref('/turn');

var game = {
	playerNum: '',
	playerName: '',
	playerChoice: '',
	opponentNum: '',
	opponentChoice: '',
	wins: 0,
	losses: 0,
	ties: 0,
	winState: '',
	initGame: function() {
		database.ref().on('value', function(snapshot) {
			if (snapshot.child('players').numChildren() === 2) {
				if(!snapshot.child('turn').exists()) {
					database.ref().child('turn').set(1);
				}
			} else {
				if (snapshot.child('turn').exists()) {
					database.ref().child('turn').remove();
				}

				if(game.playerNum === '1') {
					player1Ref.once('value', function(snap) {
						if (snap.val()) {
							player1Ref.child('choice').remove();
						}
					});
				} else if (game.playerNum === '2') {
					player2Ref.once('value', function(snap) {
						if (snap.val()) {
							player2Ref.child('choice').remove();
						}
					});
				}

				$('#player-' + game.playerNum + '-buttons').addClass('hidden');
			}

			if (snapshot.child('players').hasChild('1')) {
				player1Ref.once('value', function(p1Snap) {
					$('#player-1-name').text(p1Snap.val().name);
				});
				$('#player-1').removeClass('hidden');
				$('#wait-1').addClass('hidden');
			} else {
				$('#player-1').addClass('hidden');
				$('#wait-1').removeClass('hidden');
			}

			if (snapshot.child('players').hasChild('2')) {
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

		// checks to see if the value of "turn" has changed
		// 1 = player 1's turn
		// 2 = player 2's turn
		// 0 = both players have taken a turn
		turnRef.on('value', function(turnSnap) {
			if(turnSnap.val() != 0) {
				game.playerReady(turnSnap.val());
			}
			else {
				playersRef.once('value', function(snap) {
					if(snap.numChildren() === 2) {
						//we have two players logged in, so it's safe to process
						game.processSelections();
					}
				});
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
							game.opponentNum = '1';
						} else {
							game.playerNum = '1';
							game.opponentNum = '2';
						}

						// initialize new player object in db
						playersRef.child(game.playerNum).set({
							name: game.playerName,
							wins: 0,
							losses: 0,
							ties: 0
						});
						$('#loginForm').hide();
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
		if(this.playerNum === '1') {
			if (turn === 1) {
				$('#player-1-buttons').removeClass('hidden');
			} 
		} else if (this.playerNum === '2') {
			if (turn === 2) {
				$('#player-2-buttons').removeClass('hidden');
			}
		}
	},
	addSelection: function(selection) {
		this.playerChoice = selection;

		// set player's choice in database
		playersRef.child(this.playerNum).update({choice: selection}, function(error) {
			// if the choice was updated successfully...
			if (!error) {
				turnRef.once('value', function(turnSnap) {
					if(turnSnap.val() < 2) {
						// it is now player 2's turn, so don't process yet
						database.ref().update({
							turn: 2
						});
					} else {
						//player 2 just answered, so set turn to 0, which will trigger processing
						database.ref().update({
							turn: 0
						});						
					}
				});
			}
		});
	},
	processSelections: function() {
		if(this.playerNum === '1') {
			player2Ref.once('value', function(snap) {
				game.opponentChoice = snap.val().choice;
			});
		} else {
			player1Ref.once('value', function(snap) {
				game.opponentChoice = snap.val().choice;
			});
		}

		if (this.playerChoice === 'rock') {
			if(this.opponentChoice == 'paper') {
				this.winState = 'lose';
			}
			else if(this.opponentChoice == 'scissors') {
				this.winState = 'win';
			}
			else {
				this.winState = 'tie';
			}
		} else if (this.playerChoice === 'paper') {
			if(this.opponentChoice == 'scissors') {
				this.winState = 'lose';
			}
			else if(this.opponentChoice == 'rock') {
				this.winState = 'win';
			}
			else {
				this.winState = 'tie';
			}
		} else if (this.playerChoice === 'scissors') {
			if(this.opponentChoice == 'rock') {
				this.winState = 'lose';
			}
			else if(this.opponentChoice == 'paper') {
				this.winState = 'win';
			}
			else {
				this.winState = 'tie';
			}
		}

		//update wins/losses/ties for player
		if (this.winState == 'win') {
			this.wins++;
			playersRef.child(this.playerNum).update({
				wins: this.wins
			});
			$('#results').text($('#player-' + this.playerNum + '-name').text() + ' wins!')
				.show();
		}
		else  if (this.winState == 'lose') {
			this.losses++;
			playersRef.child(this.playerNum).update({
				losses: this.losses
			});
			$('#results').text($('#player-' + this.opponentNum + '-name').text() + ' wins!')
				.show();
		}
		else {
			this.ties++;
			playersRef.child(this.playerNum).update({
				ties: this.ties
			});
			$('#results').text('You tied!')
				.show();
		}

		setTimeout(function() {
			database.ref().update({
				turn: 1
			});
			$('#results').hide();
		}, 3000);
	}
};

$(document).ready(function() {
	game.initGame();
	$('#loginForm').on('submit', function(event) {
		event.preventDefault();
		game.initPlayer();
	});

	$('body').on('click', '.selection', function() {
		$(this).parent('div').addClass('hidden');
		game.addSelection($(this).data('value'));
	});
});