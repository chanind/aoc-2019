import { groupBy } from "lodash";

const mainInput = `.............#..#.#......##........#..#
.#...##....#........##.#......#......#.
..#.#.#...#...#...##.#...#.............
.....##.................#.....##..#.#.#
......##...#.##......#..#.......#......
......#.....#....#.#..#..##....#.......
...................##.#..#.....#.....#.
#.....#.##.....#...##....#####....#.#..
..#.#..........#..##.......#.#...#....#
...#.#..#...#......#..........###.#....
##..##...#.#.......##....#.#..#...##...
..........#.#....#.#.#......#.....#....
....#.........#..#..##..#.##........#..
........#......###..............#.#....
...##.#...#.#.#......#........#........
......##.#.....#.#.....#..#.....#.#....
..#....#.###..#...##.#..##............#
...##..#...#.##.#.#....#.#.....#...#..#
......#............#.##..#..#....##....
.#.#.......#..#...###...........#.#.##.
........##........#.#...#.#......##....
.#.#........#......#..........#....#...
...............#...#........##..#.#....
.#......#....#.......#..#......#.......
.....#...#.#...#...#..###......#.##....
.#...#..##................##.#.........
..###...#.......#.##.#....#....#....#.#
...#..#.......###.............##.#.....
#..##....###.......##........#..#...#.#
.#......#...#...#.##......#..#.........
#...#.....#......#..##.............#...
...###.........###.###.#.....###.#.#...
#......#......#.#..#....#..#.....##.#..
.##....#.....#...#.##..#.#..##.......#.
..#........#.......##.##....#......#...
##............#....#.#.....#...........
........###.............##...#........#
#.........#.....#..##.#.#.#..#....#....
..............##.#.#.#...........#.....`

type Point = [number, number]

const parseInput = (input: string): Point[] => {
  const asteroids: Point[] = [];
  input.split('\n').forEach((line, i) => {
    line.split('').forEach((elm, j) => {
      if (elm === '#') {
        asteroids.push([j, i]);
      }
    })
  });
  return asteroids;
}

const equals = (p1: Point, p2: Point) => dist(p1, p2) === 0
const dist = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
const subtract = (p1: Point, p2: Point): Point => [p1[0] - p2[0], p1[1] - p2[1]]
const slope = (p1: Point, p2: Point) => {
  const diff = subtract(p1, p2);
  if (diff[0] === 0) return p1[1] > p2[1] ? Infinity : -Infinity;
  return diff[1] / diff[0];
}

const pointIsBlocked = (origin: Point, target: Point, blocker: Point) => {
  if (slope(origin, blocker) !== slope(origin, target)) return false;
  return dist(origin, blocker) < dist(origin, target) && dist(origin, target) > dist(target, blocker);
}

const findNumVisiblePoints = (point: Point, otherPoints: Point[]) => {
  let numVisible = 0;
  otherPoints.forEach((targetPoint, i) => {
    let isBlocked = false;
    otherPoints.forEach((potentialBlocker, j) => {
      if (i !== j && pointIsBlocked(point, targetPoint, potentialBlocker)) {
        isBlocked = true;
      }
    })
    if (!isBlocked) numVisible += 1;
  })
  return numVisible;
}

const findBestPoint = (points: Point[]) => {
  let bestPoint = points[0];
  let bestNumVisible = findNumVisiblePoints(bestPoint, points.slice(1));
  // console.log({ testPoint: bestPoint, numVisible: bestNumVisible });

  for (let i = 1; i < points.length; i++) {
    const testPoint = points[i];
    const otherPoints = [...points];
    otherPoints.splice(i, 1);
    const numVisible = findNumVisiblePoints(testPoint, otherPoints);

    // console.log({ testPoint, numVisible });
    
    if (numVisible > bestNumVisible) {
      bestNumVisible = numVisible;
      bestPoint = testPoint;
    }
  }

  return { bestPoint, bestNumVisible }
}

/// part 1

// const test1 = `......#.#.
// #..#.#....
// ..#######.
// .#.#.###..
// .#..#.....
// ..#....#.#
// #..#....#.
// .##.#..###
// ##...#..#.
// .#....####`

// console.log(findBestPoint(parseInput(test1)))

// const test2 = `.#..#
// .....
// #####
// ....#
// ...##`

// console.log(findBestPoint(parseInput(test2)))

console.log('part 1')
console.log(findBestPoint(parseInput(mainInput)))

// part 2

const getAsteroidDestructionOrder = (startPoint: Point, allPoints: Point[]) => {
  const otherPoints = allPoints.filter(point => !equals(point, startPoint));
  const pointsWithInfo = otherPoints.map(point => {
    const diff = subtract(point, startPoint);
    const addition = diff[0] < 0 ? Math.PI : 0
    return {
      angle: Math.round(1000 * (Math.atan(diff[1] / diff[0]) + Math.PI / 2 + addition)),
      dist: dist(point, startPoint),
      point,
    }
  })

  const groupedPointInfos = Object.values(groupBy(pointsWithInfo.sort((p1, p2) => p1.dist - p2.dist).sort((p1, p2) => p1.angle - p2.angle), 'angle'));
  const orderedPoints = [];
  while (orderedPoints.length < otherPoints.length) {
    for (let i = 0; i < groupedPointInfos.length; i++) {
      groupedPointInfos[i].sort((p1, p2) => p1.dist - p2.dist)
      const nextItem = groupedPointInfos[i].shift();
      if (nextItem) {
        orderedPoints.push(nextItem);
      }
    }
  }
  // orderedPoints.forEach((point, i) => {
  //   console.log(i,point)
  // })
  return orderedPoints.map( ({ point }) => point);
}

const test3 = `.#....#####...#..
##...##.#####..##
##...#...#.#####.
..#.....#...###..
..#.#.....#....##`

const test4 = `.#..##.###...#######
##.############..##.
.#.######.########.#
.###.#######.####.#.
#####.##.#.##.###.##
..#####..#.#########
####################
#.####....###.#.#.##
##.#################
#####.##.###..####..
..######..##.#######
####.##.####...##..#
.#####..#.######.###
##...#.##########...
#.##########.#######
.####.#.###.###.#.##
....##.##.###..#####
.#.#.###########.###
#.#.#.#####.####.###
###.##.####.##.#..##`


console.log('part 2')
// console.log(getAsteroidDestructionOrder([8, 3], parseInput(test3)))

const startPoint = findBestPoint(parseInput(mainInput)).bestPoint;
console.log(getAsteroidDestructionOrder(startPoint, parseInput(mainInput))[199])
// console.log(getAsteroidDestructionOrder([11, 13], parseInput(test4))[19])
