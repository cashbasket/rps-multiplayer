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
	opponentName: '',
	opponentChoice: '',
	wins: 0,
	losses: 0,
	oppWins: 0,
	oppLosses: 0,
	winState: '',
	initGame: function() {
		//load other player's current stats (if there is another player logged in)
		player1Ref.once('value', function(snapshot) {
			if(snapshot.val() != null) {
				$('#player-1-wins').text(snapshot.val().wins);
				$('#player-1-losses').text(snapshot.val().losses);
			}
		});
		player2Ref.once('value', function(snapshot) {
			if(snapshot.val() != null) {
				$('#player-2-wins').text(snapshot.val().wins);
				$('#player-2-losses').text(snapshot.val().losses);
			}
		});

		database.ref().on('value', function(snapshot) {
			if (snapshot.child('players').numChildren() === 2) {
				
				if(game.playerNum === '1') {
					player2Ref.once('value', function(p2Snap) {
						game.opponentName = p2Snap.val().name;
					});
				} else if (game.playerNum === '2') {
					player1Ref.once('value', function(p1Snap) {
						game.opponentName = p1Snap.val().name;
					});
				}

				$('#startDiv').addClass('hidden');
				if(!snapshot.child('turn').exists()) {
					database.ref().child('turn').set(1);
				}
				
				if (game.playerNum.length) {
					$('#chat').removeClass('hidden');
					$('.input-row').removeClass('hidden');
					$('.panel-footer').show();
				} else {
					$('#playerInfo').removeClass('hidden');
					$('#playerInfo > .well').text('Sorry, two players are already playing.');
					$('.panel-footer').hide();
				}
			} else {
				$('#startDiv').removeClass('hidden');
				if (!game.playerNum.length) {
					$('#playerInfo').addClass('hidden');
				}

				$('.panel-footer').hide();

				if 
				(snapshot.child('chat').exists()) {
					database.ref().child('chat').remove();
				}

				//remove turn
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

				if(!game.playerNum.length) {
					$('#chatDisplay').empty();
				}

				// reset opponent stats
				game.oppWins = 0;
				game.oppLosses = 0;
				$('#player-' + game.opponentNum + '-wins').text(game.oppWins);
				$('#player-' + game.opponentNum + '-losses').text(game.oppLosses);

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
			var turn = turnSnap.val();
			if(turn !== null) {
				if(game.playerNum.length) {
					if(turn != 0) {
						if(game.playerNum === '1') {
							if(turn === 1) {
								$('#player-1-choice').empty().addClass('hidden');
								$('#player-2-choice').removeClass('hidden').text('Waiting...');
							} else {
								$('#player-2-choice').text('Choosing...');
							}
						} else if (game.playerNum === '2') {
							if(turn === 2) {
								$('#player-1-choice').text('Waiting...');
							} else {
								$('#player-2-choice').empty().addClass('hidden');
								$('#player-1-choice').removeClass('hidden')
									.text('Choosing...');
							}
						}
						game.playerReady(turn);
					}
					else {
						playersRef.once('value', function(snap) {
							if(snap.numChildren() === 2) {
								//we have two players logged in, so it's safe to process
								game.processSelections();
							}
						});
					}

					if(turn === 1) {
						$('#player-1').removeClass('panel-default')
							.addClass('panel-success');
					} else if (turn === 2) {
						$('#player-2').removeClass('panel-default')
							.addClass('panel-success');
						$('#player-1').removeClass('panel-success')
							.addClass('panel-default');
					} else {
						$('#player-1, #player-2').removeClass('panel-success')
							.addClass('panel-default');
					}
				}
			} else {
				$('#player-1, #player-2').removeClass('panel-success')
					.addClass('panel-default');
				playersRef.once('value', function(snap) {
					if(snap.val() && game.playerNum.length && game.opponentName.length) {
						$('#chatDisplay').append('<span class="disconnected">' + game.opponentName + ' has disconnected.</span>');
					}
				});
			}
		});

		chatRef.orderByChild('timestamp').limitToLast(1).on('child_added', function(msgSnap) {
			if(game.playerNum.length) {
				if(msgSnap.val()) {
					var span = $('<span>');
					if(msgSnap.val().sender === game.playerName) {
						span.addClass('self');
					}
					$('#chatDisplay').append(span.append('<strong>' + msgSnap.val().sender + '</strong> (' +  moment.unix(msgSnap.val().timestamp).format('h:mm:ss A') + '): ' + msgSnap.val().message));
					$('#chatDisplay').scrollTop($('#chatDisplay')[0].scrollHeight);
				}
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
								}
							});
						} else {
							game.playerNum = '1';
							game.opponentNum = '2';
							player2Ref.once('value', function(p2Snap) {
								if(p2Snap.val() != null) {
									game.oppWins = p2Snap.val().wins;
									game.oppLosses = p2Snap.val().losses;
								}
							});
						}

						// initialize new player object in db
						playersRef.child(game.playerNum).set({
							name: game.playerName,
							wins: 0,
							losses: 0
						});

						$('#loginForm').hide();
						$('#playerInfo').removeClass('hidden');
						$('#playerInfo > .well').text('Hi, ' + game.playerName + '! You are Player ' + game.playerNum + '.');					
	
						//remove player data when player disconnects.
						playersRef.child(game.playerNum).onDisconnect().remove();
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
		$('#player-' + this.opponentNum + '-choice').text(this.opponentChoice);

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
			$('#results').text('You tied!')
				.show();
		}

		playersRef.child(this.playerNum).update({
			wins: this.wins,
			losses: this.losses,
		}, function(error) {
			if (!error) {
				game.updateStatsDisplay(game.playerNum);
			}
		});
		
		setTimeout(function() {
			$('#results').text('vs.');
			database.ref().update({
				turn: 1
			});
		}, 3000);
	},
	updateStatsDisplay: function(playerNum) {
		if (playerNum === '1') {
			$('#player-1-wins').text(game.wins);
			$('#player-1-losses').text(game.losses);
			$('#player-2-wins').text(game.oppWins);
			$('#player-2-losses').text(game.oppLosses);
		} else {
			$('#player-2-wins').text(game.wins);
			$('#player-2-losses').text(game.losses);
			$('#player-1-wins').text(game.oppWins);
			$('#player-1-losses').text(game.oppLosses);
		}
	},
	sendMessage: function(message) {
		var tmp = $('<div>');
		tmp.text(message.trim());
		if (message.trim().length) {
			var strippedMessage = tmp.text();
			var chatMessage = {
				sender: this.playerName,
				message: strippedMessage,
				timestamp: moment().format('X')
			};
			chatRef.push(chatMessage);
		} 
	}
};

$(document).ready(function() {
	game.initGame();
	$('#loginForm').on('submit', function(event) {
		event.preventDefault();
		if($('#name').val().trim().length) {
			game.initPlayer();
		} else {
			$('#name').val('');
		}
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