var s = 32;       // Map width and height
var cF = 4;       // Number of rooms per row & column
var w = "#";      // Wall char
var g = ".";      // Ground char
var d = "D";      // Door char
var k = "k";      // Key char
var npc = "X";    // NPC char
var exit = "\\";  // Exit char
var win = false;

// Generates map
function makeMap() {
    var map = new Array(s);
    var r = Math.random;
    var f = Math.floor;
    for (y = 0; y < s; y++) {
        map[y] = new Array(s);
        for (x = 0; x < s; x++) {
            map[y][x] = w;
        }
    }
    var c = f(s/cF);
    var oE = [];
    for (y = 0; y<f(s/c); y++) {
        kR = f(r()*f(s/c));
        for (x = 0; x<f(s/c); x++) {
            var rW = f(r()*(f(c/4))+f(c/2));
            var rH = f(r()*(f(c/4))+f(c/2));
            var rX = f(r()*(c-rW-1)+1)+c*x;
            var rY = f(r()*(c-rH-1)+1)+c*y;
            e = [];
            for (i=rY; i<rY+rH; i++) {
                e.push(i);
            }
            if (x > 0) {
                var cY;
                do {
                    cY = e[f(r() * e.length)];
                } while (oE.indexOf(cY) == -1);
                var xx = rX;
                do {
                    map[cY][xx] = g
                    xx--;
                    if (xx < 0) {
                        break;
                    }
                } while(map[cY][xx] == w);
            }
            var kX = rX+1;
            var kY = rY+1;
            for (yy = rY; yy < rY+rH; yy++) {
                for (xx = rX; xx < rX+rW; xx++) {
                    map[yy][xx] = g;
                    if (x == kR && xx == kX && yy == kY) {
                        map[yy][xx] = k;
                    }
                }
            }
            oE = e;
        }
    }
    for (i = 0; i<f(s/c)-1; i++) {
        var doorPlaced = false;
        var yMap = i*c+f(c/2);
        var x, y = yMap;
        do {
            x = f(r()*(s-c))+c;
        } while (map[yMap][x] == w);
        do {
            y++;
        } while (map[y][x] == g);
        do {
            map[y][x] = g;
            if (map[y][x-1] == w && map[y][x+1] == w && !doorPlaced) {
                doorPlaced = true;
                map[y][x] = d;
            }
            y++;
        } while (map[y][x] == w);
    }

    placeExit(map);

    return map;
}

function placeExit(map) {
  var x,y;
  do {
      y = Math.floor(Math.random()*(s/cF))+Math.floor(((cF-1)/cF)*s);
      x = Math.floor(Math.random()*s);
  } while(map[y][x] == w)
  map[y][x] = exit;
}

// Draws map by placing characters with different colors
function drawMap(gameState, gameConfig) {
    var mapString = "<div contenteditable>";
    for (y = 0; y < s; y++) {
        var row = "";
        for (x = 0; x < s; x++) {
            if (gameState.fog[y][x] > 0 || gameConfig.disableFog) {
                switch (gameState.map[y][x]) {
                    case w:
                        row += "<span style='color: #ae4457'>";
                        break;
                    case g:
                        row += "<span style='color: #96bc46'>";
                        break;
                    case k:
                        row += "<span style='color: #4ec4af'>";
                        break;
                    case d:
                        row += "<span style='color: #7c56cb'>";
                        break;
                    case npc:
                        row += "<span style='color: #999'>";
                        break;
                    default:
                        row += "<span style='color: #FFF'>";
                        break;
                }
                row += gameState.map[y][x];
                row += "</span>";
            } else {
                row += "<span style='color: #666'>~</span>";
            }
        }
        mapString += row+"<br>";
    }
    $("#game").html(mapString+"</div>");
}

function moveCharacter(map,character,dir) {
    var newX;
    var newY;

    map[character.y][character.x] = g;  // Remove character from map

    // Update character coordinates
    switch(dir) {
        case 0:
            newY = character.y+1;
            newX = character.x;
            break;
        case 1:
            newY = character.y;
            newX = character.x+1;
            break;
        case 2:
            newY = character.y-1;
            newX = character.x;
            break;
        case 3:
            newY = character.y;
            newX = character.x-1;
            break;
    }

    character.steps += 1; // Update steps even if cannot move.

    var movePoint = map[newY][newX];
    var canMove = false;

    // Determine if character can move
    if (movePoint == g) {
        canMove = true;
    } else if (character.player) {
        // Player can move on keys, doors and exits.
        if (movePoint == k || (movePoint == d && character.keys > 0) || movePoint == exit) {
            canMove = true;
        }
    }

    // Player specific functions
    if (character.player && canMove) {
        // Place key to inventory
        if (movePoint == k) {
            character.keys++;
            $("#log").prepend("You picked up a key.<br>");
        }
        // Remove key from inventory
        if (movePoint == d) {
            character.keys = character.keys-1;
            $("#log").prepend("You unlocked a door.<br>");
        }
        // Win a game
        if (movePoint == exit) {
            win = true;
        }
    }

    if (canMove) {
        character.y = newY;
        character.x = newX;
    }

    // Place character back to map
    map[character.y][character.x] = character.char;

}

function makeFog(map,value) {
    var fog = new Array(s);
    for (y = 0; y < s; y++) {
        fog[y] = new Array(s);
        for (x = 0; x < s; x++) {
            fog[y][x] = value;
        }
    }
    return fog;
}

// Updates fog of war around player.
function updateFog(gameState) {
    for (y = 0; y < s; y++) {
        for (x = 0; x < s; x++) {
            if (gameState.fog[y][x] == 2) {
                gameState.fog[y][x] = 1;
            }
        }
    }
    for (a = 0; a <= 2*Math.PI; a = a+0.01) {
        for (r = 0; r <= 5; r = r+0.5) {
            var dX = Math.cos(a)*r;
            var dY = Math.sin(a)*r;
            var x = Math.min(Math.max(0,Math.round(gameState.player.x+dX)),s-1);
            var y = Math.min(Math.max(0,Math.round(gameState.player.y+dY)),s-1);
            gameState.fog[y][x] = 2;
            if (gameState.map[y][x] == w) {
                break;
            }
        }
    }
}

// Moves every NPC to random direction.
function updateNpcs(gameState) {
    for (i=0; i < gameState.npcs.length; i++) {
        var randDir = Math.floor(Math.random()*4);
        moveCharacter(gameState.map,gameState.npcs[i],randDir);
    }
}

function placeCharacter(character, map) {
  do {
      // Player starts at the top of the map
      if (character.player) {
        character.y = Math.floor(Math.random()*(s/cF));
      } else {
        character.y = Math.floor(Math.random()*(s));
      }
      character.x = Math.floor(Math.random()*s);
  } while(map[character.y][character.x] != g)

  map[character.y][character.x] = character.char;
}

function submitScore(score) {
  var msg = {
    "messageType": "SCORE",
    "score": score.toString()
  };
  window.parent.postMessage(msg, "*");
}

function saveGame(gameState) {
  var msg = {
    "messageType": "SAVE",
    "gameState": gameState
  };
  window.parent.postMessage(msg, "*");
}

function drawIntro() {
  var introString = "<div contenteditable><center>"
  introString += "<h1>JSRL</h1>";
  introString += "<h3>JavaScript Roguelike</h3>";
  introString += "<p>Collect keys and reach further into the dungeon. Find the exit and win the game.</p>";
  introString += "<p>Use arrow keys to move.</p>";
  introString += "<p><b>Press any key to begin.</b></p>";
  $("#game").html(introString+"</center></div>");
}

$( document ).ready( function() {
    $("html, body").css({
        overflow: "hidden",
        height: "100%"
    });

    var message =  {
      messageType: "SETTING",
      options: {
        "width": 500, //Integer
        "height": 900 //Integer
        }
    };
    window.parent.postMessage(message, "*");

    var map = makeMap();

    var player = {
        player: true,
        x: 0,
        y: 0,
        char: "@",
        keys: 0,
        steps: 0
    };

    placeCharacter(player, map);

    var npcs = Array(Math.round(cF*cF/2)) // Make x amount npcs per room

    for (i=0; i < npcs.length; i++) {
        var npcA = {
          player: false,
          char: npc,
          steps: 0,
          x: 0,
          y: 0
        };
        placeCharacter(npcA, map)
        npcs[i] = npcA;
    }

    var fog = makeFog(map,0);

    // Bind all objects/arrays to one gameState object
    var gameState = {
        player: player,
        npcs: npcs,
        map: map,
        fog: fog,
        intro: true
    };

    var gameConfig = {
        disableFog: false,
        debug: true
    };

    if (gameState.intro) {
      drawIntro();
    } else {
      updateFog(gameState);
      drawMap(gameState, gameConfig);
    }

    // Load-event listener
    window.addEventListener("message", function(evt) {
      if(evt.data.messageType === "LOAD") {
        gameState = evt.data.gameState;
      } else if (evt.data.messageType === "ERROR") {
        alert(evt.data.info);
      }
    });

    // Start listening to keyup events and act accordingly.
    $( document ).keyup(function(e) {
        if (e.keyCode >= 37 && e.keyCode <= 40 && !win && !gameState.intro) {
            moveCharacter(map,player,40-e.keyCode);
            updateNpcs(gameState);
            if (win) {
                var score = Math.round(1000000/player.steps);
                $("#log").prepend("Score: "+score+"!<br>");
                $("#log").prepend("You win! Press F5 to load next level.<br>");
                submitScore(score);
            }
        }
        if (e.keyCode == 70 && gameConfig.debug) {
            gameConfig.disableFog = !gameConfig.disableFog;
        }

        if (e.keyCode == 90) {
            saveGame(gameState);
        }

        if (e.keyCode == 88) {
          var msg = {
            "messageType": "LOAD_REQUEST",
          };
          window.parent.postMessage(msg, "*");
        }

        updateFog(gameState);
        drawMap(gameState, gameConfig);

        gameState.intro = false;  // Remove intro-flag after first key press
    });
});
