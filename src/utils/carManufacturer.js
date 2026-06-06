const MULTI_WORD_MANUFACTURERS = [
  { prefix: "Aston Martin", label: "Aston Martin" },
  { prefix: "Alfa Romeo", label: "Alfa Romeo" },
  { prefix: "Mercedes-AMG", label: "Mercedes" },
  { prefix: "Mercedes", label: "Mercedes" },
];

/**
 * @param {{ name: string, manufacturer?: string }} car
 */
export function getCarManufacturer(car) {
  if (car.manufacturer) {
    return car.manufacturer;
  }

  const name = car.name ?? "";

  for (const entry of MULTI_WORD_MANUFACTURERS) {
    if (name.startsWith(entry.prefix)) {
      return entry.label;
    }
  }

  return name.split(" ")[0] || "Unknown";
}

/**
 * @param {Array<{ name: string, manufacturer?: string }>} carList
 */
export function getManufacturerOptions(carList) {
  const manufacturers = new Set(
    carList.map((car) => getCarManufacturer(car)).filter(Boolean),
  );

  return [...manufacturers].sort((a, b) => a.localeCompare(b));
}
