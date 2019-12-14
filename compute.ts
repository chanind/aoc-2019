// intcode computer, used in day 13 onwards

export type Program = number[]

interface CommandResult {
  exit: boolean
  overwriteInstructionPointer?: number
  output?: number;
  relativeIncrement?: number;
  overwriteMemory: [number, number][]
}

interface ExecutionContext {
  state: number[],
  relativePos: number,
  getInput: () => Promise<number>
}

interface Command {
  cmdLen: number
  execute: (args: Arg[], ctx: ExecutionContext) => Promise<CommandResult>
}

interface Arg {
  mode: string;
  value: number
}

const extractArgVal = (arg: Arg, { state, relativePos }: ExecutionContext) => {
  if (arg.mode === '1') return arg.value;
  if (arg.mode === '2') return state[arg.value + relativePos] || 0
  return state[arg.value] || 0;
}

const extractDest = (arg: Arg, { relativePos }: ExecutionContext) => {
  if (arg.mode === '2') return arg.value + relativePos;
  return arg.value;
}

const addCommand: Command = {
  cmdLen: 4,
  execute: async (args, ctx) => {
    const p1 = extractArgVal(args[0], ctx)
    const p2 = extractArgVal(args[1], ctx)
    const dest = extractDest(args[2], ctx);
    return {
      exit: false,
      overwriteMemory: [[dest, p1 + p2]]
    }
  }
}

const multiplyCommand: Command = {
  cmdLen: 4,
  execute: async (args, ctx) => {
    const p1 = extractArgVal(args[0], ctx)
    const p2 = extractArgVal(args[1], ctx)
    const dest = extractDest(args[2], ctx);
    return {
      exit: false,
      overwriteMemory: [[dest, p1 * p2]]
    }
  }
}

const inputCommand: Command = {
  cmdLen: 2,
  execute: async (args, ctx) => {
    const input = await ctx.getInput();
    if (input === undefined) {
      throw new Error('No inputs found!')
    }
    let dest = extractDest(args[0], ctx);
    return {
      exit: false,
      overwriteMemory: [[dest, input]]
    }
  }
}

const outputCommand: Command = {
  cmdLen: 2,
  execute: async (args, ctx) => {
    const val = extractArgVal(args[0], ctx);
    return {
      exit: false,
      output: val,
      overwriteMemory: []
    }
  }
}

const jumpIfTrueCommand: Command = {
  cmdLen: 3,
  execute: async (args, ctx) => {
    const p1 = extractArgVal(args[0], ctx);
    const p2 = extractArgVal(args[1], ctx);
    return {
      exit: false,
      overwriteInstructionPointer: p1 !== 0 ? p2 : undefined,
      overwriteMemory: []
    }
  }
}

const jumpIfFalseCommand: Command = {
  cmdLen: 3,
  execute: async (args, ctx) => {
    const p1 = extractArgVal(args[0], ctx);
    const p2 = extractArgVal(args[1], ctx);
    return {
      exit: false,
      overwriteInstructionPointer: p1 === 0 ? p2 : undefined,
      overwriteMemory: []
    }
  }
}

const lessThanCommand: Command = {
  cmdLen: 4,
  execute: async (args, ctx) => {
    const p1 = extractArgVal(args[0], ctx);
    const p2 = extractArgVal(args[1], ctx);
    const dest = extractDest(args[2], ctx);
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
  execute: async (args, ctx) => {
    const p1 = extractArgVal(args[0], ctx);
    const p2 = extractArgVal(args[1], ctx);
    const dest = extractDest(args[2], ctx);
    return {
      exit: false,
      overwriteMemory: [
        [dest, p1 === p2 ? 1 : 0]
      ]
    }
  }
}

const incrementRelativeCommand: Command = {
  cmdLen: 2,
  execute: async (args, ctx) => {
    const val = extractArgVal(args[0], ctx);
    return {
      exit: false,
      relativeIncrement: val,
      overwriteMemory: [],
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
  8: equalsCommand,
  9: incrementRelativeCommand,
}

const compute = async (
  prog: Program,
  getInput: () => Promise<number>,
  sendOutput?: (output: number) => void,
): Promise<number[]> => {
  let cmdPos = 0;
  let state = prog;
  let relativePos = 0;
  const outputs: number[] = [];
  while (true) {
    const cmdParts = state[cmdPos].toString().padStart(5, '0');
    const cmdNum = parseInt(cmdParts.slice(3));
    const command = commands[cmdNum];
    if (!command) throw new Error(`Invalid command number: ${state[cmdPos]}`)
    const args: Arg[] = state.slice(cmdPos + 1, cmdPos + command.cmdLen).map((argVal, index) => ({
      value: argVal,
      mode: cmdParts[cmdParts.length - 3 - index]
    }));

    const cmdRes = await command.execute(args, { state, relativePos, getInput });
    if (cmdRes.output !== undefined) {
      if (sendOutput) sendOutput(cmdRes.output);
      outputs.push(cmdRes.output);
    }
    if (cmdRes.exit) return outputs;

    if (cmdRes.relativeIncrement) {
      relativePos += cmdRes.relativeIncrement;
    }

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

export default compute;