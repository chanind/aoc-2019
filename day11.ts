//// intcode computer from day 9


type Program = number[]

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


//////////

const mainInput = [3,8,1005,8,321,1106,0,11,0,0,0,104,1,104,0,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,1,10,4,10,1002,8,1,29,3,8,1002,8,-1,10,101,1,10,10,4,10,108,0,8,10,4,10,1002,8,1,50,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,0,10,4,10,1001,8,0,73,1,1105,16,10,2,1004,8,10,3,8,1002,8,-1,10,1001,10,1,10,4,10,1008,8,0,10,4,10,1002,8,1,103,1006,0,18,1,105,14,10,3,8,102,-1,8,10,101,1,10,10,4,10,108,0,8,10,4,10,102,1,8,131,1006,0,85,1,1008,0,10,1006,0,55,2,104,4,10,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,1,10,4,10,1001,8,0,168,2,1101,1,10,1006,0,14,3,8,102,-1,8,10,101,1,10,10,4,10,108,1,8,10,4,10,102,1,8,196,1006,0,87,1006,0,9,1,102,20,10,3,8,1002,8,-1,10,101,1,10,10,4,10,108,1,8,10,4,10,1001,8,0,228,3,8,1002,8,-1,10,101,1,10,10,4,10,108,0,8,10,4,10,1002,8,1,250,2,5,0,10,2,1009,9,10,2,107,17,10,1006,0,42,3,8,102,-1,8,10,101,1,10,10,4,10,108,1,8,10,4,10,1001,8,0,287,2,102,8,10,1006,0,73,1006,0,88,1006,0,21,101,1,9,9,1007,9,925,10,1005,10,15,99,109,643,104,0,104,1,21102,1,387353256856,1,21101,0,338,0,1105,1,442,21101,936332866452,0,1,21101,349,0,0,1105,1,442,3,10,104,0,104,1,3,10,104,0,104,0,3,10,104,0,104,1,3,10,104,0,104,1,3,10,104,0,104,0,3,10,104,0,104,1,21101,0,179357024347,1,21101,0,396,0,1105,1,442,21102,1,29166144659,1,21102,407,1,0,1105,1,442,3,10,104,0,104,0,3,10,104,0,104,0,21102,1,718170641252,1,21102,430,1,0,1106,0,442,21101,825012151040,0,1,21102,441,1,0,1106,0,442,99,109,2,21202,-1,1,1,21102,1,40,2,21102,1,473,3,21102,463,1,0,1105,1,506,109,-2,2106,0,0,0,1,0,0,1,109,2,3,10,204,-1,1001,468,469,484,4,0,1001,468,1,468,108,4,468,10,1006,10,500,1102,1,0,468,109,-2,2105,1,0,0,109,4,1202,-1,1,505,1207,-3,0,10,1006,10,523,21101,0,0,-3,22101,0,-3,1,21202,-2,1,2,21102,1,1,3,21102,1,542,0,1105,1,547,109,-4,2106,0,0,109,5,1207,-3,1,10,1006,10,570,2207,-4,-2,10,1006,10,570,22102,1,-4,-4,1105,1,638,22102,1,-4,1,21201,-3,-1,2,21202,-2,2,3,21101,0,589,0,1106,0,547,22102,1,1,-4,21101,1,0,-1,2207,-4,-2,10,1006,10,608,21102,0,1,-1,22202,-2,-1,-2,2107,0,-3,10,1006,10,630,21202,-1,1,1,21102,630,1,0,105,1,505,21202,-2,-1,-2,22201,-4,-2,-4,109,-5,2106,0,0]

type Point = [number, number];
type Direction = 'up' | 'down' | 'left' | 'right';
type Mode = 'move' | 'paint';

interface RobotState {
  pos: Point,
  whiteTiles: Point[],
  paintedTiles: Point[],
  dir: Direction,
  mode: Mode,
}

const hasPoint = (points: Point[], point: Point) => {
  return !!points.find(testPoint => pointsEq(testPoint, point));
}

const pointsEq = (p1: Point, p2: Point) => p1[0] === p2[0] && p1[1] === p2[1]

const paintSquare = (curState: RobotState, color: number): RobotState => {
  const nextState = { ...curState };
  const pos = curState.pos;
  nextState.whiteTiles = [...curState.whiteTiles];
  nextState.paintedTiles = [...curState.paintedTiles];
  if (!hasPoint(nextState.paintedTiles, pos)) {
    nextState.paintedTiles.push(pos);
  }
  if (color === 0) {
    nextState.whiteTiles = nextState.whiteTiles.filter(tile => !pointsEq(tile, pos));
  } else if (color === 1 && !hasPoint(nextState.whiteTiles, pos)) {
    nextState.whiteTiles.push(pos);
  }
  nextState.mode = 'move';
  return nextState;
}

const turnAndMove = (curState: RobotState, turn: number): RobotState => {
  const nextState = { ...curState };
  const dir = curState.dir;
  const pos = curState.pos;

  const leftDirs: {[curDir: string]: Direction } = {
    up: 'left',
    left: 'down',
    down: 'right',
    right: 'up',
  }
  const rightDirs: {[curDir: string]: Direction } = {
    up: 'right',
    left: 'up',
    down: 'left',
    right: 'down',
  }

  const posDeltas: {[dir: string]: Point} = {
    up: [0, 1],
    left: [-1, 0],
    down: [0, -1],
    right: [1, 0],
  }

  const nextDir = turn === 0 ? leftDirs[dir] : rightDirs[dir];
  const posDelta = posDeltas[nextDir];
  const nextPos: Point = [pos[0] + posDelta[0], pos[1] + posDelta[1]]

  nextState.pos = nextPos;
  nextState.dir = nextDir;
  
  nextState.mode = 'paint';
  return nextState;
}

const runPaintProgram = async (startOnWhite: boolean = false) => {
  let state: RobotState = {
    pos: [0,0],
    whiteTiles: startOnWhite ? [[0, 0]] : [],
    paintedTiles: [],
    dir: 'up',
    mode: 'paint',
  }

  const getInput = async () => {
    const curPosIsWhite = hasPoint(state.whiteTiles, state.pos)
    return curPosIsWhite ? 1 : 0;
  }

  const onOutput = (param: number) => {
    if (state.mode === 'move') {
      state = turnAndMove(state, param);
    } else {
      state = paintSquare(state, param);
    }
  }

  await compute(mainInput, getInput, onOutput);

  return state;
}

// part 1
const part1 = async () => {
  const res = await runPaintProgram();
  console.log(res.paintedTiles.length);
}

type CoordRange = [number, number]

// part 2
const part2 = async () => {
  const res = await runPaintProgram(true);
  const paintedTiles = res.paintedTiles;
  const xCoords = paintedTiles.map(tile => tile[0])
  const yCoords = paintedTiles.map(tile => tile[1])
  const xRange: CoordRange = [Math.min.apply(Math, xCoords), Math.max.apply(Math, xCoords)]
  const yRange: CoordRange = [Math.min.apply(Math, yCoords), Math.max.apply(Math, yCoords)]

  for (let j = yRange[1]; j >= yRange[0]; j--) {
    let row = '';
    for (let i = xRange[0]; i <= xRange[1]; i++) {
      row += (hasPoint(res.whiteTiles, [i, j]) ? 'X' : ' ');
    }
    console.log(row);
  }
}

(async () => {
  await part1();
  await part2()
})()