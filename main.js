 // initialize context
kaboom({debug: true});

loadSprite("flappy", "sprites/flappy.png");
loadSprite("bg", "sprites/bg long.png");
loadSprite("pipe", "sprites/long pipe.png");
loadSound("woosh", "sounds/sounds_wooosh.mp3");
loadSound("pop", "sounds/pop.mp3");
loadSound("ohno", "sounds/ohno.mp3");
loadSound("OtherworldlyFoe", "sounds/OtherworldlyFoe.mp3");
const music = play("OtherworldlyFoe", { loop: true, volume:0.5 });

// let highScore = 0;
scene("game", () => 
  const SPEED = 1.2;
  const PIPE_RANGE = 30;
  const PIPE_OPEN = 150;
  const PIPE_SCALE = 0.8;
  const PIPE_HEIGHT = 1000 * PIPE_SCALE
  gravity(-1500);
  
  let score = 0;

  layers(["bg", "ui", "game"]);

  add([
    sprite("bg", {width: width()*4, height: height()}),
    pos(0, 0),
    "bg",
    layer("bg")
  ])

  const scoreLabel = add([
    text(score, 26),
    pos(12, 12),
    "ui",
    layer("ui")
  ])

  const player = add([
    // list of components
    sprite("flappy"),
    scale(2),
    pos(80, height() / 2),
    area(),
    "player",
    layer("game")
  ]);

  const nPipes = 6;
  for (let i = 0; i < nPipes; i += 1) {
    addPipe(i * 220 + 480)
  }

  function addPipe(offset = nPipes * 220 + 480){
    const center = height() / 2;
    lowerBound = center - PIPE_OPEN/2 - PIPE_RANGE;
    upperBound = center - PIPE_OPEN/2 + PIPE_RANGE;
    if (lowerBound > upperBound) {
      throw new Error("lowerBound must be lower than upperBound");
    }
    const TOP_PIPE_BOTTOM = rand(lowerBound, upperBound);

    add([
      sprite("pipe", {flipY: true}),
      scale(PIPE_SCALE),
      area(),
      body(),
      // pos(width() + offset, TOP_PIPE_BOTTOM - PIPE_HEIGHT),
      pos(offset, TOP_PIPE_BOTTOM - PIPE_HEIGHT),
      "pipe",
      layer("game"),
      { passed: false }
    ])

    add([
      sprite("pipe"),
      scale(PIPE_SCALE), 
      area(),
      body(),
      // pos(width() + offset, TOP_PIPE_BOTTOM + PIPE_OPEN),
      pos(offset, TOP_PIPE_BOTTOM + PIPE_OPEN),
      "pipe",
      layer("game")
    ])
  }

  loop(1.5/SPEED, () => {
    addPipe();
  });

  keyPress("f", () => {
    pipes = get("pipe");

    pipes.forEach(pipe => {
      pipe.jump(-350);
    })
    play("woosh", {volume: 0.5});
  })
 
  action("bg", (bg) => {
    bg.move(-40*SPEED, 0);
    if (bg.pos.x < -4*width()){
      destroy(bg);
    }
    if (bg.pos.x < -2*width() && !bg.passed){
      bg.passed = true;
      add([
        sprite("bg", {width: width()*4, height: height()}),
        pos(width(), 0),
        "bg",
        layer("bg")
      ])
    }
  })

  action("pipe", (pipe) => {
    pipe.move(-160*SPEED, 0);

    if (pipe.passed === false && pipe.pos.x < player.pos.x) {
      const topPipeBottom = pipe.pos.y + PIPE_HEIGHT;
      const bottomPipeTop = topPipeBottom + PIPE_OPEN;
      pipe.passed = true;
      if (topPipeBottom - 20 < player.pos.y && player.pos.y < bottomPipeTop + 20) {
        play("pop");
        score += 1;
        scoreLabel.text = score;
      } else {
        go("lose", score);
      }
    }
    if (pipe.pos.x < -50) {      
      destroy(pipe);
    }
  });

  player.collides("pipe", () => {
    go("lose", score);
  });

  player.action(() => {
    if (player.pos.y > height() || player.pos.y < -80) {
      go("lose", score);
    }
  })

})

scene("lose", (score) => {
  add([
    sprite("bg", {width: width()*4, height: height()}),
    "bg",
    {passed: false},
  ])

  play("ohno", {volume: 0.2});
  const scoreTextTemplate = "score:" + score + " - high score: ";
  const highScoreText = add([
    text("score:" + score + " - high score: " , 20),
    pos(12, 12)
  ]);

  db.getUserData("score", score).then((val) => {
		if (score > val) {
			val = score;
			db.setUserData("score", val);
		}
    highScoreText.text = scoreTextTemplate + val;
	}).catch(() => {
		highScoreText.text = scoreTextTemplate + "login";
	});

	const ghigh = add([
		text("", 16),
		pos(width() / 2, 90),
		origin("top"),
	]);

	db.getData("score", {}).then((scores) => {
		const rank = Object.values(scores);
		rank.sort((a, b) => b.data - a.data);
		ghigh.text = rank
			.slice(0, 10)
			.map(({ data, user }, n) => `${n + 1} ${user.name} ${data}`)
			.join("\n");
	});

  if (!replit.authed()) {
    const auth = add([
      text("login", 18),
      pos(width() - 12, height() - 12),
      origin("botright"),
      area(),
      color(),
    ]);

    auth.action(() => {
      if (auth.isHovered()) {
        auth.color = rgb(rand(), rand(), rand());
        cursor("pointer");
      } else {
        auth.color = rgb(1, 1, 1);
        cursor("default");		
      }
    });

    auth.clicks(() => {
      replit.auth().then((user) => {
        go("lose", score);
      })
    });
  }

  const textSize = 18
  add([
    text("press f", textSize),
    pos(12, height() - 12 - textSize)
  ]);

  keyPress("f", () => {
    go("game");
  })
})

go("game");
