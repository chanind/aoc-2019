const testInput = `9 ORE => 2 A
8 ORE => 3 B
7 ORE => 5 C
3 A, 4 B => 1 AB
5 B, 7 C => 1 BC
4 C, 1 A => 1 CA
2 AB, 3 BC, 4 CA => 1 FUEL`

const testInput2 = `157 ORE => 5 NZVS
165 ORE => 6 DCFZ
44 XJWVT, 5 KHKGT, 1 QDVJ, 29 NZVS, 9 GPVTF, 48 HKGWZ => 1 FUEL
12 HKGWZ, 1 GPVTF, 8 PSHF => 9 QDVJ
179 ORE => 7 PSHF
177 ORE => 5 HKGWZ
7 DCFZ, 7 PSHF => 2 XJWVT
165 ORE => 2 GPVTF
3 DCFZ, 7 NZVS, 5 HKGWZ, 10 PSHF => 8 KHKGT`

const realInput = `1 JNDQ, 11 PHNC => 7 LBJSB
1 BFKR => 9 VGJG
11 VLXQL => 5 KSLFD
117 ORE => 6 DMSLX
2 VGJG, 23 MHQGW => 6 HLVR
2 QBJLJ => 6 DBJZ
1 CZDM, 21 ZVPJT, 1 HLVR => 5 VHGQP
1 RVKX => 1 FKMQD
38 PHNC, 10 MHQGW => 5 GMVJX
4 CZDM, 26 ZVHX => 7 QBGQB
5 LBJSB, 2 DFZRS => 4 QBJLJ
4 TJXZM, 11 DWXW, 14 VHGQP => 9 ZBHXN
20 VHGQP => 8 SLXQ
1 VQKM => 9 BDZBN
115 ORE => 4 BFKR
1 VGJG, 1 SCSXF => 5 PHNC
10 NXZXH, 7 ZFXP, 7 ZCBM, 7 MHNLM, 1 BDKZM, 3 VQKM => 5 RMZS
147 ORE => 2 WHRD
16 CQMKW, 8 BNJK => 5 MHNLM
1 HLVR => 5 TJQDC
9 GSLTP, 15 PHNC => 5 SFZTF
2 MJCD, 2 RVKX, 4 TJXZM => 1 MTJSD
1 DBJZ, 3 SLXQ, 1 GMSB => 9 MGXS
1 WZFK => 8 XCMX
1 DFZRS => 9 GSLTP
17 PWGXR => 2 DFZRS
4 BFKR => 7 JNDQ
2 VKHN, 1 SFZTF, 2 PWGXR => 4 JDBS
2 ZVPJT, 1 PHNC => 6 VQKM
18 GMSB, 2 MGXS, 5 CQMKW => 3 XGPXN
4 JWCH => 3 BNJK
1 BFKR => 2 PWGXR
12 PHNC => 2 GMSB
5 XGPXN, 3 VQKM, 4 QBJLJ => 9 GXJBW
4 MHQGW => 9 DWXW
1 GMSB, 1 BFKR => 5 DBKC
1 VLXQL, 10 KSLFD, 3 JWCH, 7 DBKC, 1 MTJSD, 2 WZFK => 9 GMZB
4 JDBS => 8 BRNWZ
2 ZBHXN => 7 HMNRT
4 LBJSB => 7 BCXGX
4 MTJSD, 1 SFZTF => 8 ZCBM
12 BRNWZ, 4 TJXZM, 1 ZBHXN => 7 WZFK
10 HLVR, 5 LBJSB, 1 VKHN => 9 TJXZM
10 BRNWZ, 1 MTJSD => 6 CMKW
7 ZWHT => 7 VKHN
5 CQMKW, 2 DBKC => 6 ZFXP
1 CMKW, 5 JNDQ, 12 FKMQD, 72 BXZP, 28 GMVJX, 15 BDZBN, 8 GMZB, 8 RMZS, 9 QRPQB, 7 ZVHX => 1 FUEL
10 MGXS => 9 JWCH
1 BFKR => 8 SCSXF
4 SFZTF, 13 CZDM => 3 RVKX
1 JDBS, 1 SFZTF => 9 TSWV
2 GMVJX, 1 PHNC => 1 CZDM
6 JDBS => 1 BXZP
9 TSWV, 5 TJXZM => 8 NXZXH
1 HMNRT, 5 TSWV => 4 VLXQL
16 WZFK, 11 XCMX, 1 GXJBW, 16 NXZXH, 1 QBGQB, 1 ZCBM, 10 JWCH => 3 QRPQB
12 SCSXF, 6 VGJG => 4 ZVPJT
10 JNDQ => 3 ZWHT
1 DBJZ, 9 BCXGX => 2 CQMKW
1 WHRD, 14 DMSLX => 8 MHQGW
3 VKHN, 8 TJQDC => 4 MJCD
1 QBJLJ => 4 ZVHX
1 MHQGW, 4 ZVHX => 3 BDKZM`

interface CalcFunctionMap {[component: string]: (targetQuantity: number, excess?: ReactionExcesses) => number}
interface ChemInput {
  name: string;
  quantity: number;
}
interface ReactionExcesses {[component: string]: number}


const parseInput = (input: string): CalcFunctionMap => {
  const calcFunctions: CalcFunctionMap = {};
  const lines = input.split('\n');
  lines.forEach(line => {
    const [chemInputStr, chemOutputStr] = line.split(/\s*=>\s*/);
    const chemInputStrParts = chemInputStr.split(/\s*,\s*/);
    const chemInputs: ChemInput[] = chemInputStrParts.map(chemInputStrPart => {
      const [quantityStr, name] = chemInputStrPart.split(/\s+/);
      return {
        name,
        quantity: parseInt(quantityStr),
      }
    });
    const [chemOutputQuantityStr, chemOutput] = chemOutputStr.split(/\s+/);
    const chemOutputQuantity = parseInt(chemOutputQuantityStr)
    calcFunctions[chemOutput] = (targetQuantity, excesses = {}) => {
      const excess = excesses[chemOutput] || 0;
      const multiplier = Math.ceil((targetQuantity - excess) / chemOutputQuantity)
      const totalBeingCreated = multiplier * chemOutputQuantity
      excesses[chemOutput] = totalBeingCreated - targetQuantity + excess;
      // console.log(`Producing ${totalBeingCreated} of ${chemOutput} (target ${targetQuantity}, excess ${excess})`)
      let totalQuantity = 0;
      chemInputs.forEach(({ quantity, name }) => {
        if (name === 'ORE') {
          totalQuantity += multiplier * quantity;
        } else {
          totalQuantity += calcFunctions[name](multiplier * quantity, excesses);
        }
      })
      return totalQuantity;
    }
  })
  return calcFunctions;
}

const totalOreNeeded = (input: string) => parseInput(input)['FUEL'](1)

// part 1

console.log('------ part 1 ------')
console.log(totalOreNeeded(testInput));
console.log(totalOreNeeded(testInput2));
console.log(totalOreNeeded(realInput));

// part 2

const totalOre = 1000000000000;

const findMaxFuel = (input: string) => {
  const excesses: ReactionExcesses = {};
  const oreForOneFuel = totalOreNeeded(input);
  const firstGuess = Math.floor(totalOre / oreForOneFuel);
  const parsedInput = parseInput(input);
  let fuelProduced = firstGuess;
  let oreConsumed = parsedInput['FUEL'](firstGuess, excesses);

  while (oreConsumed < totalOre) {
    const toProduce = Math.max(Math.floor((totalOre - oreConsumed) / oreForOneFuel), 1)
    oreConsumed += parsedInput['FUEL'](toProduce, excesses);
    fuelProduced += toProduce;
  }
  return fuelProduced - 1;
}

console.log('------ part 2 ------')
console.log(findMaxFuel(testInput2))
console.log(findMaxFuel(realInput))