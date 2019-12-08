type Program = number[]

interface CommandResult {
  exit: boolean
  overwriteInstructionPointer?: number
  output?: number;
  overwriteMemory: [number, number][]
}

interface Command {
  cmdLen: number
  execute: (args: Arg[], state: number[], getInput: () => Promise<number>) => Promise<CommandResult>
}

interface Arg {
  immediate: boolean;
  value: number
}

const extractArgVal = (arg: Arg, state: Program) => {
  if (arg.immediate) return arg.value;
  return state[arg.value];
}

const addCommand: Command = {
  cmdLen: 4,
  execute: async (args, state) => {
    const p1 = extractArgVal(args[0], state)
    const p2 = extractArgVal(args[1], state)
    const dest = args[2].value;
    return {
      exit: false,
      overwriteMemory: [[dest, p1 + p2]]
    }
  }
}

const multiplyCommand: Command = {
  cmdLen: 4,
  execute: async (args, state) => {
    const p1 = extractArgVal(args[0], state)
    const p2 = extractArgVal(args[1], state)
    const dest = args[2].value;
    return {
      exit: false,
      overwriteMemory: [[dest, p1 * p2]]
    }
  }
}

const inputCommand: Command = {
  cmdLen: 2,
  execute: async (args, _state, getInput) => {
    const input = await getInput();
    if (input === undefined) {
      throw new Error('No inputs found!')
    }
    const dest = args[0].value;
    return {
      exit: false,
      overwriteMemory: [[dest, input]]
    }
  }
}

const outputCommand: Command = {
  cmdLen: 2,
  execute: async (args, state) => {
    const val = extractArgVal(args[0], state);
    return {
      exit: false,
      output: val,
      overwriteMemory: []
    }
  }
}

const jumpIfTrueCommand: Command = {
  cmdLen: 3,
  execute: async (args, state) => {
    const p1 = extractArgVal(args[0], state);
    const p2 = extractArgVal(args[1], state);
    return {
      exit: false,
      overwriteInstructionPointer: p1 !== 0 ? p2 : undefined,
      overwriteMemory: []
    }
  }
}

const jumpIfFalseCommand: Command = {
  cmdLen: 3,
  execute: async (args, state) => {
    const p1 = extractArgVal(args[0], state);
    const p2 = extractArgVal(args[1], state);
    return {
      exit: false,
      overwriteInstructionPointer: p1 === 0 ? p2 : undefined,
      overwriteMemory: []
    }
  }
}

const lessThanCommand: Command = {
  cmdLen: 4,
  execute: async (args, state) => {
    const p1 = extractArgVal(args[0], state);
    const p2 = extractArgVal(args[1], state);
    const dest = args[2].value
    return {
      exit: false,
      overwriteMemory: [
        [dest, p1 < p2 ? 1 : 0]
      ]
    }
  }
}

const equalsCommand: Command = {
  cmdLen: 4,
  execute: async (args, state) => {
    const p1 = extractArgVal(args[0], state);
    const p2 = extractArgVal(args[1], state);
    const dest = args[2].value
    return {
      exit: false,
      overwriteMemory: [
        [dest, p1 === p2 ? 1 : 0]
      ]
    }
  }
}

const exitCommand: Command = {
  cmdLen: 1,
  execute: async () => ({ exit: true, overwriteMemory: [] }),
}

const commands: {[cmd: number]: Command} = {
  99: exitCommand,
  1: addCommand,
  2: multiplyCommand,
  3: inputCommand,
  4: outputCommand,
  5: jumpIfTrueCommand,
  6: jumpIfFalseCommand,
  7: lessThanCommand,
  8: equalsCommand
}

const compute = async (
  prog: Program,
  getInput: () => Promise<number>,
  sendOutput?: (output: number) => void,
): Promise<number[]> => {
  let cmdPos = 0;
  let state = prog;
  const outputs: number[] = [];
  while (true) {
    const cmdParts = state[cmdPos].toString().padStart(5, '0');
    const cmdNum = parseInt(cmdParts.slice(3));
    const command = commands[cmdNum];
    if (!command) throw new Error(`Invalid command number: ${state[cmdPos]}`)
    const args: Arg[] = state.slice(cmdPos + 1, cmdPos + command.cmdLen).map((argVal, index) => ({
      value: argVal,
      immediate: cmdParts[cmdParts.length - 3 - index] === '1'
    }));

    const cmdRes = await command.execute(args, state, getInput);
    if (cmdRes.output !== undefined) {
      if (sendOutput) sendOutput(cmdRes.output);
      outputs.push(cmdRes.output);
    }
    if (cmdRes.exit) return outputs;

    state = [...state];
    for (const [dest, val] of cmdRes.overwriteMemory) {
      state[dest] = val;
    }

    cmdPos += command.cmdLen;

    if (cmdRes.overwriteInstructionPointer !== undefined) {
      cmdPos = cmdRes.overwriteInstructionPointer
    }
  }
}

/// question specific stuff

// from https://stackoverflow.com/a/37580979
const permute = <T>(permutation: T[]): T[][] => {
  var length = permutation.length,
      result = [permutation.slice()],
      c = new Array(length).fill(0),
      i = 1, k, p;

  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = permutation[i];
      permutation[i] = permutation[k];
      permutation[k] = p;
      ++c[i];
      i = 1;
      result.push(permutation.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
}



const testAmpConfig = async (ampConfig: number[], prog: Program) => {
  let ampInput = 0;
  for (const ampSetting of ampConfig) {
    const inputs = [ampSetting, ampInput]
    let inputCnt = 0;
    const getInput = async () => {
      const input = inputs[inputCnt];
      inputCnt += 1
      return input;
    }
    const outputs = await compute(prog, getInput);
    ampInput = outputs[0];
  }
  return ampInput;
}

const findBestConfig = async (prog: Program) => {
  const permutations = permute([0, 1, 2, 3, 4]);
  const results = await Promise.all(permutations.map(config => testAmpConfig(config, prog)));
  return Math.max.apply(Math, results);
}

const assertEqual = (test: any, expected: any) => {
  if (test !== expected) {
    throw new Error(`Expected ${test} to equal ${expected}`)
  }
  console.log('test passed!')
}

const run1 = async () => {

  // tests
  assertEqual(await findBestConfig([3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0]), 43210);
  assertEqual(await findBestConfig([3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0]), 54321);
  assertEqual(await findBestConfig([3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0]), 65210);
  
  const realProg = [3,8,1001,8,10,8,105,1,0,0,21,46,67,88,101,126,207,288,369,450,99999,3,9,1001,9,5,9,1002,9,5,9,1001,9,5,9,102,3,9,9,101,2,9,9,4,9,99,3,9,102,4,9,9,101,5,9,9,102,5,9,9,101,3,9,9,4,9,99,3,9,1001,9,3,9,102,2,9,9,1001,9,5,9,102,4,9,9,4,9,99,3,9,102,3,9,9,1001,9,4,9,4,9,99,3,9,102,3,9,9,1001,9,3,9,1002,9,2,9,101,4,9,9,102,3,9,9,4,9,99,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,1002,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,101,1,9,9,4,9,99,3,9,101,1,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,1001,9,1,9,4,9,3,9,1002,9,2,9,4,9,99,3,9,101,1,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,1001,9,1,9,4,9,3,9,1001,9,2,9,4,9,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,1001,9,1,9,4,9,99,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,101,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,1,9,9,4,9,3,9,101,1,9,9,4,9,3,9,101,1,9,9,4,9,99,3,9,101,1,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,1,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,99]
  console.log(await findBestConfig(realProg));
}


////////////// part 2! ////////////

const testAmpConfig2 = async (ampConfig: number[], prog: Program) => {
  const waitingAmpInputResolves: ((val: number | Promise<number>) => void)[] = [];
  const ampInputBacklogs: number[][] = ampConfig.map(ampSetting => [ampSetting]);
  ampInputBacklogs[0].push(0) // give A its initial 0 input

  const ampOutputs = ampConfig.map((_setting, i) => {
    const getInput = async () => {
      if (ampInputBacklogs[i].length > 0) {
        return ampInputBacklogs[i].shift();
      }

      return new Promise<number>((resolve) => {
        waitingAmpInputResolves[i] = resolve;
      })
    }
    const sendOutput = (output: number) => {
      const nextAmpIndex = i === ampConfig.length - 1 ? 0 : i + 1;
      if (waitingAmpInputResolves[nextAmpIndex]) {
        const nextInputResolve = waitingAmpInputResolves[nextAmpIndex]
        waitingAmpInputResolves[nextAmpIndex] = undefined;
        nextInputResolve(output);
      } else {
        ampInputBacklogs[nextAmpIndex].push(output);
      }
    }
    return compute(prog, getInput, sendOutput);
  })
  const finalOutputs = await Promise.all(ampOutputs)
  const lastOutputs = finalOutputs[finalOutputs.length - 1];
  return lastOutputs[lastOutputs.length - 1];
}

const findBestConfig2 = async (prog: Program) => {
  const permutations = permute([5,6,7,8,9]);
  const results = await Promise.all(permutations.map(config => testAmpConfig2(config, prog)));
  return Math.max.apply(Math, results);
}

const run2 = async () => {

  // tests
  assertEqual(await findBestConfig2([3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5]), 139629729);
  assertEqual(await findBestConfig2([3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10]), 18216);

  const realProg = [3,8,1001,8,10,8,105,1,0,0,21,46,67,88,101,126,207,288,369,450,99999,3,9,1001,9,5,9,1002,9,5,9,1001,9,5,9,102,3,9,9,101,2,9,9,4,9,99,3,9,102,4,9,9,101,5,9,9,102,5,9,9,101,3,9,9,4,9,99,3,9,1001,9,3,9,102,2,9,9,1001,9,5,9,102,4,9,9,4,9,99,3,9,102,3,9,9,1001,9,4,9,4,9,99,3,9,102,3,9,9,1001,9,3,9,1002,9,2,9,101,4,9,9,102,3,9,9,4,9,99,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,1002,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,101,1,9,9,4,9,99,3,9,101,1,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,1001,9,1,9,4,9,3,9,1002,9,2,9,4,9,99,3,9,101,1,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,102,2,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,1001,9,1,9,4,9,3,9,1001,9,2,9,4,9,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,1001,9,1,9,4,9,99,3,9,101,2,9,9,4,9,3,9,101,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,2,9,9,4,9,3,9,1001,9,1,9,4,9,3,9,101,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,1,9,9,4,9,3,9,101,1,9,9,4,9,3,9,101,1,9,9,4,9,99,3,9,101,1,9,9,4,9,3,9,102,2,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,101,1,9,9,4,9,3,9,1002,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,1002,9,2,9,4,9,3,9,1001,9,2,9,4,9,3,9,102,2,9,9,4,9,99]
  console.log(await findBestConfig2(realProg));
}

(async () => {
  console.log('part 1:')
  await run1();

  console.log('part 2:')
  await run2();
})();