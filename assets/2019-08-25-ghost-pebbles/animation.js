// In html: <canvas id="c" width=800px></canvas>

let ctx = document.getElementById('c').getContext('2d');
let state = []
for (let i = 0; i < 63; i++) {
    state.push(0);
}
let maxPebbles = 0;
let steps = 0;
let title = "";

let GHOST = -1;
let ADD_PEBBLE = +1;
let CLEAR_PEBBLE = 0;

async function act(b, k) {
    if (b !== 0 && b !== 1 && b !== -1) {
        throw new Error(`Bad pebble state ${b}`);
    }
    if (k > 0 && b !== -1 && state[k - 1] != 1) {
        throw new Error(`Can't pebble at ${k}`);
    }
    if (b <= 0 && state[k] == 0) {
        throw new Error(`Already not pebbled ${k}`);
    }
    if (b == 1 && state[k] == 1) {
        throw new Error(`Already pebbled ${k}`);
    }
    if (b === -1 && Math.random() > 0.5) {
        b = 0;
    }
    state[k] = b;
    maxPebbles = Math.max(maxPebbles, state.reduce((a, b) => Math.max(a, 0) + Math.max(b, 0), 0));
    steps += 1;
    await draw();
    return state[k] !== 0;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function draw() {
    ctx.clearRect(0, 0, 500, 500);
    for (let i = 0; i < state.length; i++) {
    		ctx.beginPath();
				ctx.arc(i*11 + 6, 50, 5, 0, 6.28318);
        ctx.fillStyle = ['gray', 'white', 'black'][state[i] +1];
        ctx.fill();
				ctx.stroke();
    }
    ctx.fillStyle = 'black';
    ctx.font = '20pt sans-serif';
    ctx.fillText(title, 0, 40);
    ctx.fillText('SPACE: ' + maxPebbles, 0, 80);
    ctx.fillText('TIME: ' + steps, 200, 80);
    await timeout(10);
}

async function divideAndConquer(offset, length, action=ADD_PEBBLE) {
    // Base cases.
    if (length === 0) {
    	return;
    }
    if (length === 1) {
      await act(action, offset);
      return;
    }
    let h = (length+1) >> 1;
    // Recursively place pebble at midpoint.
    await divideAndConquer(offset, h, ADD_PEBBLE);
    // Recursively place pebble at endpoint from midpoint.
    await divideAndConquer(offset + h, length - h, action);
    // Recursively clear midpoint.
    await divideAndConquer(offset, h, CLEAR_PEBBLE);
}

async function divideGhostAndConquer(offset, length, action=ADD_PEBBLE) {
    // Base cases.
    if (length == 0) {
    	return;
    }
    if (length == 1) {
      await act(action, offset);
      return;
    }
    
    let h = (length+1) >> 1;
    // Recursively place pebble at midpoint.
    await divideGhostAndConquer(offset, h, ADD_PEBBLE);
    // Recursively place pebble at endpoint from midpoint.
    await divideGhostAndConquer(offset + h, length - h, action);
    // Ghost the midpoint.
    if (await act(GHOST, offset + h - 1)) {
    	  // Recursively clean up ghost only if needed.
        await divideGhostAndConquer(offset, h, CLEAR_PEBBLE);
    }
}

async function sweepAndClean(offset, length, action=ADD_PEBBLE) {
    // Base cases.
    if (length === 0) {
        return;
    }
    if (length === 1) {
        await act(action, offset);
        return;
    }
    if (length === 2) {
        await act(ADD_PEBBLE, offset);
        await act(action, offset + 1);
        await act(CLEAR_PEBBLE, offset);
        return;
    }
    
    // Slide pebble to mid point.
    let h = (length + 1) >> 1;
    for (let i = 0; i < h; i++) {
      await act(ADD_PEBBLE, offset+i);
      if (i > 0) {
          await act(GHOST, offset+i-1);
      }
    }
    
    // Recursively solve second half.
    await sweepAndClean(offset+h, length-h, action);
    
    // Ghost the midpoint pebble.
    await act(GHOST, offset+h-1);
    
    // Recursively clean up the first half.
    while (h > 0 && state[offset+h-1] === 0) {
        h -= 1;
    }
    await sweepAndClean(offset, h, CLEAR_PEBBLE);
}

async function constantSpace(_, length) {
    let remaining = length;

    while (remaining > 0) {
        // Slide pebble to just before the furthest space that needs to be modified.
        for (let i = 0; i < remaining - 1; i++) {
            await act(ADD_PEBBLE, i);
            if (i > 0) {
                await act(GHOST, i-1);
            }
        }
        
        // Fix furthest space.
        await act(remaining === length ? ADD_PEBBLE : CLEAR_PEBBLE, remaining - 1);        
        remaining -= 1;
        
        // Ghost earlier pebble and find next space that needs to be fixed.
        if (remaining > 0) {
            await act(GHOST, remaining - 1);
        }
        while (remaining > 0 && state[remaining - 1] === 0) {
            remaining -= 1;
        }
    }
}

async function loop(solver) {
  while (true) {
      for (let k = 0; k < state.length; k++) {
        state[k] = 0;
      }
      maxPebbles = 0;
      steps = 0;
      await solver(0, state.length);
      await timeout(2000);
  }
}

title = 'Constant Space'
loop(constantSpace);
