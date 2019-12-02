const program = [1,0,0,3,1,1,2,3,1,3,4,3,1,5,0,3,2,9,1,19,1,5,19,23,2,9,23,27,1,27,5,31,2,31,13,35,1,35,9,39,1,39,10,43,2,43,9,47,1,47,5,51,2,13,51,55,1,9,55,59,1,5,59,63,2,6,63,67,1,5,67,71,1,6,71,75,2,9,75,79,1,79,13,83,1,83,13,87,1,87,5,91,1,6,91,95,2,95,13,99,2,13,99,103,1,5,103,107,1,107,10,111,1,111,13,115,1,10,115,119,1,9,119,123,2,6,123,127,1,5,127,131,2,6,131,135,1,135,2,139,1,139,9,0,99,2,14,0,0];

const compute = (input) => {
  let cmdPos = 0;
  let state = input;
  while (true) {
    const cmd = state[cmdPos];
    if (cmd === 99) return state;
    if (state[cmdPos + 1] >= state.length) throw new Error('Invalid param');
    if (state[cmdPos + 2] >= state.length) throw new Error('Invalid param');
    const p1 = state[state[cmdPos + 1]]
    const p2 = state[state[cmdPos + 2]]
    const dest = state[cmdPos + 3];
    if (cmd !== 1 && cmd !== 2) throw Error('OMG bad input');

    const res = cmd === 1 ? p1 + p2 : p1 * p2;
    state = [...state];
    state[dest] = res;

    cmdPos += 4;
  }
}

const findAns = () => {
  const target = 19690720

  for (let n = 0; n < 100; n++) {
    for (let v = 0; v < 100; v++) {
      const trialProgram = [...program]
      trialProgram[1] = n;
      trialProgram[2] = v;
      const res = compute(trialProgram)[0]
      if (res === target) {
        return 100 * n + v;
      }
    }
  }
}

findAns();