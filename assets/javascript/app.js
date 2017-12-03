/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

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

// This was the best (and coolest) way I could find to make sure malicious code was not entered into the chat. Borrwed from http://locutus.io/php/strip_tags/
function strip_tags (input, allowed) { // eslint-disable-line camelcase
	//  discuss at: http://locutus.io/php/strip_tags/
	// original by: Kevin van Zonneveld (http://kvz.io)
	// improved by: Luke Godfrey
	// improved by: Kevin van Zonneveld (http://kvz.io)
	//    input by: Pul
	//    input by: Alex
	//    input by: Marc Palau
	//    input by: Brett Zamir (http://brett-zamir.me)
	//    input by: Bobby Drake
	//    input by: Evertjan Garretsen
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Eric Nagel
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Tomasz Wesolowski
	// bugfixed by: Tymon Sturgeon (https://scryptonite.com)
	//  revised by: Rafał Kukawski (http://blog.kukawski.pl)
  
	// making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
  
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
	var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  
	var before = input;
	var after = input;
	// recursively remove tags to ensure that the returned string doesn't contain forbidden tags after previous passes (e.g. '<<bait/>switch/>')
	while (true) {
		before = after;
		after = before.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
			return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		});
  
		// return once no more tags are removed
		if (before === after) {
			return after;
		}
	}
}

var game = {
	playerNum: '',
	playerName: '',
	playerChoice: '',
	opponentNum: '',
	opponentName: '',
	opponentChoice: '',
	wins: 0,
	losses: 0,
	winState: '',
	initGame: function() {
		// update stat displays as wins & losses are updated in firebase
		player1Ref.child('wins').on('value', function(p1wins) {
			if (p1wins.val() != null) {
				$('#player-1-wins').text(p1wins.val());
			}
		});
		player1Ref.child('losses').on('value', function(p1losses) {
			if (p1losses.val() != null) {
				$('#player-1-losses').text(p1losses.val());
			}
		});
		player2Ref.child('wins').on('value', function(p2wins) {
			if (p2wins.val() != null) {
				$('#player-2-wins').text(p2wins.val());
			}
		});
		player2Ref.child('losses').on('value', function(p2losses) {
			if (p2losses.val() != null) {
				$('#player-2-losses').text(p2losses.val());
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
				} else {
					$('#playerInfo').removeClass('hidden');
					$('#playerInfo > .well').text('Two players are already in the game. You can wait for someone to leave if you want.');
				}
			} else {
				$('#startDiv').removeClass('hidden');
				if (!game.playerNum.length) {
					$('#playerInfo').addClass('hidden');
				}

				if (snapshot.child('chat').exists()) {
					database.ref().child('chat').remove();
				}

				$('#results').html('&mdash; vs &mdash;');

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
					$('#player-1-choice').removeClass('hidden')
						.text('Waiting for Player ' + game.opponentNum + ' to join...');
				} else if (game.playerNum === '2') {
					player2Ref.once('value', function(snap) {
						if (snap.val()) {
							player2Ref.child('choice').remove();
						}
					});
					$('#player-2-choice').removeClass('hidden')
						.text('Waiting for Player ' + game.opponentNum + ' to join...');
				}

				if(!game.playerNum.length) {
					$('#chatDisplay').empty();
				}

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
								$('#player-2-choice').html('<i class="fa fa-gear fa-spin"></i> Choosing...');
							}
						} else if (game.playerNum === '2') {
							if(turn === 2) {
								$('#player-1-choice').text('Waiting...');
							} else {
								$('#player-2-choice').empty().addClass('hidden');
								$('#player-1-choice').removeClass('hidden')
									.html('<i class="fa fa-gear fa-spin"></i> Choosing...');
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
						$('#results').html('<i class="fa fa-long-arrow-left fa-4x bounce-left"></i>');
					} else if (turn === 2) {
						$('#player-2').removeClass('panel-default')
							.addClass('panel-success');
						$('#player-1').removeClass('panel-success')
							.addClass('panel-default');
						$('#results').html('<i class="fa fa-long-arrow-right fa-4x bounce-right"></i>');
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
			game.playerName = strip_tags($('#name').val().trim());
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
							losses: 0
						});

						$('#startDiv').hide();
						$('#playerInfo').removeClass('hidden');
						$('#playerInfo > .well').html('<strong>Hi, ' + game.playerName + '!</strong> You are Player ' + game.playerNum + '.');					
	
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
			.html('<img src="assets/images/' + this.playerChoice + '.png" class="img-responsive" alt="' + this.playerChoice + ' icon" />');

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
		$('#player-' + this.opponentNum + '-choice').html('<img src="assets/images/' + this.opponentChoice + '.png" class="img-responsive" alt="' + this.opponentChoice + ' icon" />');

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
		});
		
		setTimeout(function() {
			$('#results').html('<i class="fa fa-long-arrow-left fa-4x"></i>');
			database.ref().update({
				turn: 1
			});
		}, 3000);
	},
	sendMessage: function() {
		var message = $('#message').val().trim();
		var tmp = $('<span>');
		tmp.text(message);
		if (message.trim().length) {
			var strippedMessage = strip_tags($('#message').val().trim());
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