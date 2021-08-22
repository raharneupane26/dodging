/*

REVISITING-SEVERAL-WEEKS-LATER EDIT: 
--made small changes to addRock and gameEnd (see for details)
--simplified the paddle event handling (but not the actual handler function, unfortunately)
--randomized rock border radius for each corner to add variety
--changed button cursor to pointer
Looking at this now I see more ways in which it might be improved, for example changing some of those dreaded (pseudo-)global variables into closures, arguments that get passed around, or even enclosing the entire game in a module, but those would require larger overhauls, and I'd rather just save those ideas for the next thing I make (and probably use GitHub...).
It's also not the prettiest-looking thing, but that was never my concern here.

-----

A rock dodging game using jQuery. Read this "development" info if you'd like, but you don't have to.


This is somewhat informed by the Flatiron School's final bootcamp prep JavaScript project (which I don't think was well-implemented pedagogically, but that's another story), except structured around jQuery's .animate instead of getAnimationFrame. This involved a few key changes:

First, the movement of the rocks is not done incrementally, but set from the beginning with the final position being the bottom of the game. The collision detection is then done with the step property of .animate's options object. 

Second, the paddle movement is also not done incrementally. I set the final .animate position upon each keydown to the corresponding arrow key's edge of the game frame. However, the speed parameter had to be dynamic in order to keep the movement speed constant, as it's more like a duration than a "speed"--setting it constant would have led to slower movement when coming from close to the target side and faster from farther away. I used percentages of how far across the frame the paddle was in either direction.

Another feature I added is dynamic game difficulty. The speed at which the rocks fall increases over time, as does the rate at which they appear. You can't dynamically change a preexisting setInterval, so instead I used a setTimeout that dropped the new rock like normal and then re-called itself with decreased rate and speed parameters.

Other additional features:
-Scoring system
-Loss/restart screen
-Randomized rock shape/size
*/


$(document).ready(function() {
  let gameCycle = null, score = 0,
      rateMin = 700, rate,
      speedMin = 1200, speed,
      paddle = $("#paddle"), game = $("#gameframe"); // No idea if that's bad practice...
  
  function gameStart() {
    let centerPaddleLeft = (game.width() - paddle.width()) / 2;
    $("[id$=screen]").css("visibility", "hidden");
    paddle.css({"left": centerPaddleLeft, "visibility": "visible"});
    rate = 1800;
    speed = 3300;
    // basically functions as a setInterval, since dynamicInterval re-setTimeouts itself with the same callbacks (but with a possibly updated rate) at its end:
    gameCycle = setTimeout(dynamicInterval, rate, addRock, increaseDifficulty);
  }
  
  function gameEnd() {
    clearTimeout(gameCycle);
    $(".rocks").stop(true).remove(); //EDIT: added .stop(true), see addRock for details
    paddle.css({"visibility": "hidden"});
    $("#scorescreen").css("visibility", "visible");
    $("#score").text(score);
    score = 0;
  }
  
  function testCollision(elem1, pos1, elem2, pos2) {
    let paddlePos = game.height() - paddle.height();
    if (pos1.top + elem1.height() >= paddlePos && 
        pos1.left + elem1.width() >= pos2.left &&
        pos2.left + elem2.width() >= pos1.left) {
      gameEnd();
    }
  }
  
  function increaseDifficulty() {
    // To de-globalize speed and rate variables without module-izing the whole game, surround this in a higher-order function, put the variables in that, then return this function. It will be assigned upon gameStart to a variable (and thereby resets every start, obviating both the begin/current separation and the resetting in gameEnd that uses it)
    // Other differences exist re: things that use those persisting globals
    if (rate > rateMin) {
      rate *= 0.98;
    }
    if (speed > speedMin) {
      speed *= 0.985;
    }
  }
  
  function dynamicInterval(...callbacks) {
    for (let callback of callbacks) {
      //Just in case I add/remove any callbacks later
      callback();
    }
    //re-call itself to basically act like an interval
    gameCycle = setTimeout(dynamicInterval, rate, ...callbacks);
  }
  
  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
        
  function addRock() {
    let randHeight = randomRange(40, 70),
        randWidth = randomRange(40, 70),
        randRadius = () => randomRange(40, 50), //just syntactic DRYing
        rock = $(document.createElement('div'));
    rock.appendTo("#gameframe")
    .css({
      height: randHeight,
      width: randWidth,
      position: "absolute",
      top: -randHeight,
      left: randomRange(0, 350 - randWidth),
      backgroundColor: "#444",
      borderRadius: `${randRadius()}% ${randRadius()}% ${randRadius()}% ${randRadius()}%`
    })
    .addClass("rocks")
    .animate({top: "500px"}, {
      duration: speed,
      easing: "linear",
      step: function() {
        testCollision(rock, rock.position(), paddle, paddle.position());
      },
      complete: function() { 
        score++;
        rock.remove();
      }
      // EDIT SEVERAL WEEKS LATER:
      //In order to use the options object's complete method above I realized I had to add .stop(true) to the rock-removal in gameEnd, because otherwise it fails to actually dequeue and immediately "complete"s the animation, carrying out score++ for any rocks still on-screen at loss-time. Previously I'd worked around this by using .queue to separate it from .animate entirely, which I'll keep commented out to show how I did it, but using complete makes more sense.
    })
    /*.queue(function() { 
      score++;
      $(this).remove()
        .dequeue();
    })*/;
  }
  
  function movePaddle({type, key}) {
    let fullRight = game.width() - paddle.width(),
        percentLeft = paddle.position().left / fullRight,
        moveLeftDuration = percentLeft * 2000,
        moveRightDuration = (1 - percentLeft) * 2000;
    
    if (type === "keydown" && key === "ArrowLeft") {
      paddle.stop().animate({left: 0}, moveLeftDuration, "linear");
    } else if (type === "keydown" && key === "ArrowRight") {
      paddle.stop().animate({left: fullRight}, moveRightDuration, "linear");
    } else if (type === "keyup") {
      paddle.stop();
    }
  }
  
  
  $(".button").click(gameStart);
  
  $(window).on('keyup keydown', movePaddle);
})