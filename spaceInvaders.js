/*
 Possible changes:
 	- Add sprites to simulate movement
 	- Add blokcs to hide behind
 	- Make the game more difficult as time passes or as aliens get closer
 	- Make the aliens shoot
 	- Make the player shoot
 	- Track the score
 	- Create a 3rd sprite for the aliens and insert it in the game
*/
(function() {

function Game() {
	/** Game params **/
	const fps = 60;
	const alienMargin = 10; // space between each alien
	const maxAliensPerRow = 10;
	const speed = 5; // horizontal speed
	const vJump = 20; // vertical jump each time the aliens go down
	const moveLimit = 0.01; // % of the screen where the aliens don't enter
	const framesDying = 20; // amounts of frames between being hit and disappearing

	/** Inits **/
	let realFps = 0;
	let lastCheckedFrame = 0;
	let playing = false;
	let currentFrame = 0;
	let aliens = []; // it has the array of aliens and two properties: rightMostAlein and leftMostAlien
	let direction = 1; // start going right. Left would be -1
	let context = null;
	let input = null;
	let size = {width: null, height: null}; // size of the canvas. maybe better if game.size??
	let player = null;


	/** Internal game functions **/
	const win = () => {
		// the player wins
		game.end();
		console.log('Player wins!');
	};

	const lose = () => {
		// the player loses
		game.end();
		console.log('Player loses!');
	};

	const tick = () => {
		// update to the next game frame
		console.log('-> ticks; direction: ' + direction);
		currentFrame++;

		// Game logic - updates
			// if the pack of aliens reach the last 10% of the canvas (both sides),
			// they jump down
			if ((aliens.rightMost >= size.width * (1-moveLimit) && direction > 0) ||
					(aliens.leftMost <= size.width * moveLimit && direction < 0)) {
				for (let alien of aliens) {
					alien.position.y += vJump;

				}
				// change direction
				direction *= -1;

			} else if (currentFrame % waitFramesToMove == 0) {
				// move all aliens horizontally
				for (let alien of aliens) {
					// update horizontal position
					alien.position.x += speed * direction;

					// when going right, update leftMost & rightMost to the biggest.
					// when going left update to the smallest 
					if (direction > 0) {
						if (alien.position.x + alien.size.width > aliens.rightMost) {
							aliens.rightMost = alien.position.x + alien.size.width;
						}
						if (alien.position.x > aliens.leftMost) {
							aliens.leftMost = alien.position.x;
						}
					} else {
						if (alien.position.x + alien.size.width < aliens.rightMost) {
							aliens.rightMost = alien.position.x + alien.size.width;
						} 
						if (alien.position.x < aliens.leftMost) {
							aliens.leftMost = alien.position.x;
						}
					}
					
				}
			}

			// move the player if a movement key is pressed
			if (input.left && !input.right && player.position.x > 0) {
				player.position.x -= 2;
			} else if (input.right && !input.left &&
					player.position.x + player.size.width < size.width) {
				player.position.x += 2;
			}

		// Render
			fillStyle = "#000000";
			context.fillRect(0, 0, size.width, size.height);
			for (let alien of aliens) {
				alien.render(context, currentFrame, waitFramesToMove);
			}

			if (player) {
				player.render(context);
			}

		// Call tick again
			if (playing) {
				setTimeout(tick, 1000/fps);
			}
	}


	/** Shared game functions **/
	const game = {};

	game.start = (ctx) => {
		// start the game
		playing = true;
		context = ctx;
		size.width = ctx.canvas.width;
		size.height = ctx.canvas.height;
		input = UserInput();


		// generate the aliens
			// calculate how many aliens fit there horizontally
		let alien = Alien(); // to avoid creating several closures
		// The amount of aliens that fit is not exact. No problem
		// fHA = floor(validWidth / (alienWidth+margin)) * 0.8 -> to allow 20%
		// space for the aliens to move
		let fitHorizontalAliens = Math.floor((
			size.width*(1-2*moveLimit) / (alien.size.width + alienMargin)) * 0.8);
		fitHorizontalAliens = Math.min(fitHorizontalAliens, maxAliensPerRow);
		let fitVerticalAliens = 4;

		let y = 0;
		let x;
		let newAlien;
		leftMostAlien = size.width; // initial value to be overwriten
		rightMostAlein = 0; // initial value to be overwriten
		for (let i = 0; i < fitVerticalAliens; i++) {
			y += alien.size.height + alienMargin;
			x = size.width * moveLimit - alien.size.width - alienMargin;
			for (let j = 0; j < fitHorizontalAliens; j++) {
				x += alien.size.width + alienMargin;
				newAlien = Alien(x, y)
				aliens.push(newAlien);
				if (newAlien.position.x < leftMostAlien) {
					leftMostAlien = newAlien.position.x;
				}
				if (newAlien.position.x + alien.size.width > rightMostAlein) {
					rightMostAlein = newAlien.position.x + alien.size.width;
				}

			}
		}


		// generate the player
		player = Player(20, size.height - Player().size.height - 20);

		tick();
	};

	game.end = () => {
		// finish the game
		playing = false;
	};

	return game;
};

const Alien = (aX, aY) => {
	let imgLoaded = 0;
	const img1 = new Image();
	const img2 = new Image();
	const imgHit = new Image();
	img1.src = './assets/alien1.png';
	img1.onload = () => imgLoaded += 1;
	img2.src = './assets/alien2.png';
	img2.onload = () => imgLoaded += 1;
	imgHit.src = './assets/alienhit.png';
	imgHit.onload = () => imgLoaded += 1;


	const sprites = [img1, img2];

	const alien = {};

	alien.position = {x: aX, y: aY};

	alien.size = {width: 22, height: 16};

	let img;
	alien.render = (context, currentFrame, waitFramesToMove) => {
		if (imgLoaded == 2) {
			img = sprites[Math.floor(currentFrame/waitFramesToMove) % sprites.length];

			context.drawImage(img, alien.position.x, alien.position.y,
					alien.size.width, alien.size.height);
		}
	};

	return alien;
};

const Player = (pX, pY) => {
	let imgLoaded = false;
	const img = new Image();
	img.src = './assets/player.png';
	img.onload = () => imgLoaded = true;

	const player = {};

	player.position = {x: pX, y: pY};

	player.size = {width: 22, height: 12};

	player.render = (context) => {
		if (imgLoaded) {
			context.drawImage(img, player.position.x, player.position.y,
					player.size.width, player.size.height);
		}
	};

	player.moveRight = () => {
		player.position.x += 1;
	}

	player.moveLeft = () => {
		player.position.x -= 1;
	}

	return player;
}

const UserInput = () => {
	window.addEventListener('keydown', event => {
		switch (event.keyCode) {
			case 65: // 'a' or 'A'
			case 37: // ArrowLeft
				state.left = true;
				break;

			case 68: // 'd' or 'D'
			case 39: // ArrowRight
				state.right = true;
				break;

			default:
				// do nothing
		}
	});

	window.addEventListener('keyup', event => {
		switch (event.keyCode) {
			case 65: // 'a' or 'A'
			case 37: // ArrowLeft
				state.left = false;
				break;

			case 68: // 'd' or 'D'
			case 39: // ArrowRight
				state.right = false;
				break;

			default:
				// do nothing
		}
	});

	const state = {
		left: false,
		right: false,
	}

	return state;
}

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;

Game().start(context);

})()