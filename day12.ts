require('lodash.combinations');
import * as _ from 'lodash';

const combinations: any = (_ as any).combinations;

type Vector = [number, number, number]

interface MoonState {
  pos: Vector,
  vel: Vector,
}

/*
  <x=5, y=4, z=4>
  <x=-11, y=-11, z=-3>
  <x=0, y=7, z=0>
  <x=-13, y=2, z=10>
*/
const getInitialMoons = (): MoonState[] => ([
  {pos: [5,4,4], vel: [0,0,0]},
  {pos: [-11,-11,-3], vel: [0,0,0]},
  {pos: [0,7,0], vel: [0,0,0]},
  {pos: [-13,2,10], vel: [0,0,0]},
])

const add = (v1: Vector, v2: Vector): Vector => [
  v1[0] + v2[0],
  v1[1] + v2[1],
  v1[2] + v2[2],
]
const negate = (v: Vector): Vector => [
  -1 * v[0],
  -1 * v[1],
  -1 * v[2],
]

const getVelChangeVector = (m1: MoonState, m2: MoonState): Vector => {
  const getDelta = (n1: number, n2: number): number => {
    if (n1 > n2) return -1;
    if (n1 === n2) return 0;
    return 1;
  }
  return [
    getDelta(m1.pos[0], m2.pos[0]),
    getDelta(m1.pos[1], m2.pos[1]),
    getDelta(m1.pos[2], m2.pos[2]),
  ]
}

const energy = (v: Vector) => Math.abs(v[0]) + Math.abs(v[1]) + Math.abs(v[2])

const totalEnergy = (moons: MoonState[]) => {
  let total = 0;
  for (const moon of moons) {
    const moonTotal = energy(moon.pos) * energy(moon.vel)
    total += moonTotal;
  }
  return total
}

const hashState = (moons: MoonState[]): string => moons.map(({ pos, vel }) => `${pos[0]}.${pos[1]}.${pos[2]}:${vel[0]}.${vel[1]}.${vel[2]}`).join('-')

const tick = (moons: MoonState[]): MoonState[] => {
  const moonIndices = moons.map((_moon, i) => i);
  const moonVelUpdates: Vector[] = moons.map(() => [0, 0, 0]);
  const pairings = combinations(moonIndices, 2);
  for (const [m1Index, m2Index] of pairings) {
    const delta = getVelChangeVector(moons[m1Index], moons[m2Index]);
    moonVelUpdates[m1Index] = add(delta, moonVelUpdates[m1Index]);
    moonVelUpdates[m2Index] = add(negate(delta), moonVelUpdates[m2Index]);
  }
  return moons.map((moon, i) => {
    const nextVel = add(moon.vel, moonVelUpdates[i]);
    return {
      pos: add(moon.pos, nextVel),
      vel: nextVel,
    }
  })
}


// part 1

/*
<x=-1, y=0, z=2>
<x=2, y=-10, z=-7>
<x=4, y=-8, z=8>
<x=3, y=5, z=-1>
*/
const getTestMoons = (): MoonState[] => [
  {pos: [-1, 0, 2], vel: [0,0,0]},
  {pos: [2, -10, -7], vel: [0,0,0]},
  {pos: [4, -8, 8], vel: [0,0,0]},
  {pos: [3, 5, -1], vel: [0,0,0]},
]

const energyAfterTicks = (initialState: MoonState[], ticks: number) => {
  let moons = initialState;
  for (let i = 0; i < ticks; i++) {
    moons = tick(moons)
  }
  return totalEnergy(moons);
}
// console.log('TEST', energyAfterTicks(getTestMoons(), 10));
console.log('TOTAL ENERGY PART 1:', energyAfterTicks(getInitialMoons(), 1000));


// part 2

const ticksUntilRepeat = (initialState: MoonState[]) => {
  let moons = initialState;
  const seenStates = new Set<string>();
  seenStates.add(hashState(moons));
  let cnt = 0;
  while (true) {
    cnt += 1;
    moons = tick(moons)
    const curState = hashState(moons);
    if (seenStates.has(curState)) {
      break;
    }
    seenStates.add(curState);
    if (cnt % 1000000 === 0) {
      console.log('.')
    }
  }
  return seenStates.size
}

console.log('TEST TICKS UNTIL REPEAT:', ticksUntilRepeat(getTestMoons()));
// THIS DOESN"T WORK! RUNS OUT OF MEMORY
console.log('TICKS UNTIL REPEAT PART 2:', ticksUntilRepeat(getInitialMoons()));