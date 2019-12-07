type Program = number[]

interface CommandResult {
  exit: boolean
  overwriteInstructionPointer?: number
  overwriteMemory: [number, number][]
}

interface Command {
  cmdLen: number
  execute: (args: Arg[], state: number[], inputs: number[]) => CommandResult
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
  execute: (args, state) => {
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
  execute: (args, state) => {
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
  execute: (args, _state, inputs) => {
    const input = inputs.shift();
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
  execute: (args, state) => {
    const val = extractArgVal(args[0], state);
    console.log(`output: ${val}`);
    return {
      exit: false,
      overwriteMemory: []
    }
  }
}

const jumpIfTrueCommand: Command = {
  cmdLen: 3,
  execute: (args, state) => {
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
  execute: (args, state) => {
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
  execute: (args, state) => {
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
  execute: (args, state) => {
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
  execute: () => ({ exit: true, overwriteMemory: [] }),
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

const compute = (prog: Program, inputs: number[]): Program => {
  let cmdPos = 0;
  let state = prog;
  while (true) {
    const cmdParts = state[cmdPos].toString().padStart(5, '0');
    const cmdNum = parseInt(cmdParts.slice(3));
    const command = commands[cmdNum];
    if (!command) throw new Error(`Invalid command number: ${state[cmdPos]}`)
    const args: Arg[] = state.slice(cmdPos + 1, cmdPos + command.cmdLen).map((argVal, index) => ({
      value: argVal,
      immediate: cmdParts[cmdParts.length - 3 - index] === '1'
    }));

    const cmdRes = command.execute(args, state, inputs);
    if (cmdRes.exit) return state;

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


console.log('test!')
const testProgram = [3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99]

console.log('Test with > 8')
compute(testProgram, [20]);
console.log('---')
console.log('Test with == 8')
compute(testProgram, [8]);
console.log('---')
console.log('Test with < 8')
compute(testProgram, [2]);
console.log('---')


const program: Program = [3,225,1,225,6,6,1100,1,238,225,104,0,1102,35,92,225,1101,25,55,225,1102,47,36,225,1102,17,35,225,1,165,18,224,1001,224,-106,224,4,224,102,8,223,223,1001,224,3,224,1,223,224,223,1101,68,23,224,101,-91,224,224,4,224,102,8,223,223,101,1,224,224,1,223,224,223,2,217,13,224,1001,224,-1890,224,4,224,102,8,223,223,1001,224,6,224,1,224,223,223,1102,69,77,224,1001,224,-5313,224,4,224,1002,223,8,223,101,2,224,224,1,224,223,223,102,50,22,224,101,-1800,224,224,4,224,1002,223,8,223,1001,224,5,224,1,224,223,223,1102,89,32,225,1001,26,60,224,1001,224,-95,224,4,224,102,8,223,223,101,2,224,224,1,223,224,223,1102,51,79,225,1102,65,30,225,1002,170,86,224,101,-2580,224,224,4,224,102,8,223,223,1001,224,6,224,1,223,224,223,101,39,139,224,1001,224,-128,224,4,224,102,8,223,223,101,3,224,224,1,223,224,223,1102,54,93,225,4,223,99,0,0,0,677,0,0,0,0,0,0,0,0,0,0,0,1105,0,99999,1105,227,247,1105,1,99999,1005,227,99999,1005,0,256,1105,1,99999,1106,227,99999,1106,0,265,1105,1,99999,1006,0,99999,1006,227,274,1105,1,99999,1105,1,280,1105,1,99999,1,225,225,225,1101,294,0,0,105,1,0,1105,1,99999,1106,0,300,1105,1,99999,1,225,225,225,1101,314,0,0,106,0,0,1105,1,99999,1008,677,677,224,1002,223,2,223,1005,224,329,101,1,223,223,7,677,677,224,102,2,223,223,1006,224,344,101,1,223,223,108,677,677,224,1002,223,2,223,1006,224,359,1001,223,1,223,7,677,226,224,1002,223,2,223,1005,224,374,1001,223,1,223,1107,677,226,224,1002,223,2,223,1005,224,389,1001,223,1,223,107,226,677,224,102,2,223,223,1005,224,404,1001,223,1,223,1108,226,677,224,1002,223,2,223,1006,224,419,101,1,223,223,107,226,226,224,102,2,223,223,1005,224,434,1001,223,1,223,108,677,226,224,1002,223,2,223,1006,224,449,101,1,223,223,108,226,226,224,102,2,223,223,1006,224,464,1001,223,1,223,1007,226,226,224,1002,223,2,223,1005,224,479,101,1,223,223,8,677,226,224,1002,223,2,223,1006,224,494,101,1,223,223,1007,226,677,224,102,2,223,223,1006,224,509,101,1,223,223,7,226,677,224,1002,223,2,223,1005,224,524,101,1,223,223,107,677,677,224,102,2,223,223,1005,224,539,101,1,223,223,1008,677,226,224,1002,223,2,223,1005,224,554,1001,223,1,223,1008,226,226,224,1002,223,2,223,1006,224,569,1001,223,1,223,1108,226,226,224,102,2,223,223,1005,224,584,101,1,223,223,1107,226,677,224,1002,223,2,223,1005,224,599,1001,223,1,223,8,226,677,224,1002,223,2,223,1006,224,614,1001,223,1,223,1108,677,226,224,102,2,223,223,1005,224,629,1001,223,1,223,8,226,226,224,1002,223,2,223,1005,224,644,1001,223,1,223,1107,677,677,224,1002,223,2,223,1005,224,659,1001,223,1,223,1007,677,677,224,1002,223,2,223,1005,224,674,101,1,223,223,4,223,99,226]
console.log('Real program, input 1!')
compute(program, [1]);
console.log('---')

console.log('Real program, input 5!')
compute(program, [5]);
console.log('---')