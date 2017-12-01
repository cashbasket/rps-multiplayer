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
var chatRef = database.ref('/chat');

var game = {
	playerNum: '',
	playerName: '',
	playerChoice: '',
	opponentNum: '',
	opponentChoice: '',
	wins: 0,
	losses: 0,
	ties: 0,
	oppWins: 0,
	oppLosses: 0,
	oppTies: 0,
	winState: '',
	initGame: function() {
		//load other player's current stats (if there is another player logged in)
		player1Ref.once('value', function(snapshot) {
			if(snapshot.val() != null) {
				$('#player-1-wins').text(snapshot.val().wins);
				$('#player-1-losses').text(snapshot.val().losses);
				$('#player-1-ties').text(snapshot.val().ties);
			}
		});
		player2Ref.once('value', function(snapshot) {
			if(snapshot.val() != null) {
				$('#player-2-wins').text(snapshot.val().wins);
				$('#player-2-losses').text(snapshot.val().losses);
				$('#player-2-ties').text(snapshot.val().ties);
			}
		});

		database.ref().on('value', function(snapshot) {
			if (snapshot.child('players').numChildren() === 2) {
				if(!snapshot.child('turn').exists()) {
					database.ref().child('turn').set(1);
				}
				$('#chat').removeClass('hidden');
			} else {
				$('#status').empty().addClass('hidden');

				//reset chat stuff if there aren't 2 players
				$('#chat').addClass('hidden');
				$('#chatDisplay').empty();
				if (snapshot.child('chat').exists()) {
					database.ref().child('chat').remove();
				}

				//remove turn
				if (snapshot.child('turn').exists()) {
					database.ref().child('turn').remove();
				}

				//remove player choices
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

				// reset opponent stats
				game.oppWins = 0;
				game.oppLosses = 0;
				game.oppTies = 0;
				$('#player-' + game.opponentNum + '-wins').text(game.oppWins);
				$('#player-' + game.opponentNum + '-losses').text(game.oppLosses);
				$('#player-' + game.opponentNum + '-ties').text(game.oppTies);

				// hide player's buttons until another player enters game
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
				$('#status').removeClass('hidden');
				if(game.playerNum === '1') {
					if(turnSnap.val() === 1) {
						$('#status').text('It\'s your turn!');
					} else {
						$('#status').text('Waiting for ' + $('#player-2-name').text() + ' to choose.');
					}
				} else if (game.playerNum === '2') {
					if(turnSnap.val() === 2) {
						$('#status').text('It\'s your turn!');
					} else {
						$('#status').text('Waiting for ' + $('#player-1-name').text() + ' to choose.');
					}
				}
				game.playerReady(turnSnap.val());
			}
			else {
				$('#status').addClass('hidden');
				playersRef.once('value', function(snap) {
					if(snap.numChildren() === 2) {
						//we have two players logged in, so it's safe to process
						game.processSelections();
					}
				});
			}
		});

		chatRef.orderByChild('timestamp').limitToLast(1).on('child_added', function(msgSnap) {
			if(msgSnap.val()) {
				$('#chatDisplay').append('<strong>' + msgSnap.val().sender + '</strong> (' +  moment.unix(msgSnap.val().timestamp).format('hh:mm:ss A') + '): ' + msgSnap.val().message + '<br />');
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
							player1Ref.once('value', function(p1Snap) {
								if(p1Snap.val() != null) {
									game.oppWins = p1Snap.val().wins;
									game.oppLosses = p1Snap.val().losses;
									game.oppTies = p1Snap.val().ties;
								}
							});
						} else {
							game.playerNum = '1';
							game.opponentNum = '2';
							player2Ref.once('value', function(p2Snap) {
								if(p2Snap.val() != null) {
									game.oppWins = p2Snap.val().wins;
									game.oppLosses = p2Snap.val().losses;
									game.oppTies = p2Snap.val().ties;
								}
							});
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
		$('#player-' + this.playerNum + '-choice').removeClass('hidden')
			.text(this.playerChoice);

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
		//since round is over, show what opponent chose
		$('#player-' + this.opponentNum + '-choice').removeClass('hidden')
			.text(this.opponentChoice);

		if (this.playerChoice === 'Rock') {
			if(this.opponentChoice == 'Paper') {
				this.winState = 'lose';
			}
			else if(this.opponentChoice == 'Scissors') {
				this.winState = 'win';
			}
			else {
				this.winState = 'tie';
			}
		} else if (this.playerChoice === 'Paper') {
			if(this.opponentChoice == 'Scissors') {
				this.winState = 'lose';
			}
			else if(this.opponentChoice == 'Rock') {
				this.winState = 'win';
			}
			else {
				this.winState = 'tie';
			}
		} else if (this.playerChoice === 'Scissors') {
			if(this.opponentChoice == 'Rock') {
				this.winState = 'lose';
			}
			else if(this.opponentChoice == 'Paper') {
				this.winState = 'win';
			}
			else {
				this.winState = 'tie';
			}
		}

		//update wins/losses/ties for player
		if (this.winState == 'win') {
			this.wins++;
			this.oppLosses++;
			$('#results').text($('#player-' + this.playerNum + '-name').text() + ' wins!')
				.show();
		}
		else  if (this.winState == 'lose') {
			this.losses++;
			this.oppWins++;
			$('#results').text($('#player-' + this.opponentNum + '-name').text() + ' wins!')
				.show();
		}
		else {
			this.ties++;
			this.oppTies++;
			$('#results').text('You tied!')
				.show();
		}

		playersRef.child(this.playerNum).update({
			wins: this.wins,
			losses: this.losses,
			ties: this.ties
		}, function(error) {
			if (!error) {
				game.updateStatsDisplay(game.playerNum);
			}
		});
		
		setTimeout(function() {
			database.ref().update({
				turn: 1
			});
			$('#results').hide();
			$('#player-1-choice, #player-2-choice').empty().addClass('hidden');
		}, 3000);
	},
	updateStatsDisplay: function(playerNum) {
		if (playerNum === '1') {
			$('#player-1-wins').text(game.wins);
			$('#player-1-losses').text(game.losses);
			$('#player-1-ties').text(game.ties);
			$('#player-2-wins').text(game.oppWins);
			$('#player-2-losses').text(game.oppLosses);
			$('#player-2-ties').text(game.oppTies);
		} else {
			$('#player-2-wins').text(game.wins);
			$('#player-2-losses').text(game.losses);
			$('#player-2-ties').text(game.ties);
			$('#player-1-wins').text(game.oppWins);
			$('#player-1-losses').text(game.oppLosses);
			$('#player-1-ties').text(game.oppTies);
		}
	},
	sendMessage: function(message) {
		var tmp = $('<div>');
		tmp.text(message);
		var strippedMessage = tmp.text();

		var chatMessage = {
			sender: this.playerName,
			message: strippedMessage,
			timestamp: moment().format('X')
		};
		chatRef.push(chatMessage);
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

	$('#msgForm').on('submit', function(event) {
		event.preventDefault();
		game.sendMessage($('#message').val().trim());
		$('#message').val('');
	});
});