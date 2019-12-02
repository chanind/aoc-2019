get_fuel = (mass) => {
  let to_add = 0;
  let next_mass = mass;
  while(true) {
    next_fuel = Math.floor(next_mass /3) - 2;
    if (next_fuel <= 0) return to_add;
    to_add += next_fuel;
    next_mass = next_fuel
  }
}