import { cars } from "../src/data/cars.js";
import { tracks } from "../src/data/tracks.js";

const gt7Gr3 = [
  "Alfa Romeo 4C Gr.3",
  "Aston Martin DBR9 GT1 '10",
  "Aston Martin V12 Vantage GT3 '12",
  "Audi R8 LMS '15",
  "Audi R8 LMS Evo",
  "BMW M3 GT '11",
  "BMW M6 GT3 Endurance Model '16",
  "BMW M6 GT3 Sprint Model",
  "BMW Z4 GT3 '11",
  "Corvette C7 Gr.3",
  "GT by Citroën Race Car Gr.3",
  "Dodge Viper Gr.3",
  "Ferrari 458 GT3",
  "Ferrari 296 GT3 '23",
  "Ford GT LM Spec II",
  "Ford GT LM Spec II Test Car",
  "Ford GT Race Car '18",
  "Ford Mustang Gr.3",
  "Genesis X Gr.3",
  "Honda NSX Gr.3",
  "Honda NSX GT500 '00",
  "Hyundai Genesis Gr.3",
  "Jaguar F-Type GT3",
  "Lamborghini Huracán GT3 '15",
  "Lexus RC F GT3",
  "Lexus RC F GT3 prototype '16",
  "Mazda Atenza Gr.3",
  "Mazda RX-Vision GT3 Concept",
  "Mazda RX-Vision GT3 Concept Stealth Model",
  "McLaren 650S GT3",
  "McLaren F1 GTR - BMW '95",
  "Mercedes-AMG GT3 '16",
  "Mercedes-AMG GT3 '20",
  "Mercedes-Benz SLS AMG GT3 '11",
  "Mitsubishi Lancer Evolution Final Edition Gr.3",
  "Nissan GT-R GT3 '18",
  "Nissan GT-R NISMO GT3 '13",
  "Nissan GT-R GT500 '99",
  "Nissan Skyline Super Silhouette Group 5 '84",
  "Peugeot RCZ Gr.3",
  "Peugeot Vision Gran Turismo Gr.3",
  "Porsche 911 GT3 R '22",
  "Porsche 911 RSR (991) '17",
  "Renault Sport R.S.01 GT3 '16",
  "Subaru BRZ GT300 '21",
  "Subaru WRX Gr.3",
  "Suzuki Vision Gran Turismo Gr.3",
  "Supra Racing Concept",
  "Toyota FT-1 Vision Gran Turismo Gr.3",
  "Toyota Supra GT500 '97",
  "Volkswagen Beetle Gr.3",
  "Volkswagen GTI Vision Gran Turismo Gr.3",
];

const gt7Gr4 = [
  "Alfa Romeo 155 2.5 V6 TI '93",
  "Alfa Romeo 4C Gr.4",
  "Aston Martin Vantage Gr.4",
  "Audi TT Cup",
  "BMW M4 Gr.4",
  "Bugatti Veyron Gr.4",
  "Chevrolet Corvette C7 Gr.4",
  "GT by Citroën Gr.4",
  "Dodge Viper Gr.4",
  "458 Italia Gr.4",
  "Ford Mustang Gr.4",
  "Genesis G70 GR4",
  "Honda NSX Gr.4",
  "Hyundai Genesis Gr.4",
  "Hyundai Elantra N TC '24",
  "Jaguar F-Type Gr.4",
  "Huracán Gr.4",
  "Lexus RC F Gr.4",
  "Mazda3 Gr.4",
  "Atenza Gr.4",
  "McLaren 650S Gr.4",
  "Mercedes-Benz SLS AMG Gr.4",
  "Mitsubishi Lancer Evolution Gr.4",
  "GT-R Gr.4",
  "Nissan Silvia spec-R Aero (S15) Touring Car",
  "RCZ Gr.4",
  "Porsche Cayman GT4 Clubsport Gr.4",
  "Mégane Trophy Gr.4",
  "Renault Sport Mégane Gr.4",
  "WRX Gr.4",
  "Suzuki Swift Sport KATANA Edition Gr.4",
  "Toyota 86 Gr.4",
  "Toyota GR Supra Race Car '19",
  "Volkswagen Scirocco Gr.4",
];

const gt7Tracks = [
  "Le Mans",
  "Alsace",
  "Lago Maggiore",
  "Monza",
  "Autopolis",
  "Interlagos",
  "Barcelona-Catalunya GP",
  "Blue Moon Bay",
  "Brands Hatch",
  "Broad Bean Raceway",
  "Saint-Croix",
  "Spa",
  "Circuit Gilles-Villeneuve",
  "Colorado Springs",
  "Daytona Road Course",
  "Daytona Tri-Oval",
  "Deep Forest",
  "Dragon Trail - Seaside",
  "Dragon Trail - Gardens",
  "Eiger Nordwand",
  "Fishermans Ranch",
  "Fuji",
  "Goodwood",
  "Grand Valley Highway 1",
  "High Speed Ring",
  "Kyoto Driving Park",
  "Lake Louise",
  "Road Atlanta",
  "Mount Panorama",
  "Northern Isle Speedway",
  "Nürburgring GP",
  "Red Bull Ring",
  "Sardegna Road Track",
  "Special Stage Route X",
  "Suzuka",
  "Tokyo Expressway",
  "Trial Mountain",
  "Tsukuba",
  "Watkins Glen",
  "Laguna Seca",
  "Willow Springs",
  "Yas Marina Circuit",
];

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasMatch(required, names) {
  const req = normalize(required);
  return names.some((name) => {
    const n = normalize(name);
    return n === req || n.includes(req) || req.includes(n);
  });
}

function findMissing(required, names) {
  return required.filter((item) => !hasMatch(item, names));
}

const gr3 = cars.filter((car) => car.class === "Gr.3");
const gr4 = cars.filter((car) => car.class === "Gr.4");
const names = cars.map((car) => car.name);
const trackNames = tracks.map((track) => track.name);

const missingGr3 = findMissing(gt7Gr3, names);
const missingGr4 = findMissing(gt7Gr4, names);
const missingTracks = findMissing(gt7Tracks, trackNames);

console.log(
  JSON.stringify(
    {
      gr3Count: gr3.length,
      gr4Count: gr4.length,
      trackCount: tracks.length,
      missingGr3,
      missingGr4,
      missingTracks,
      duplicateCarIds: cars.length - new Set(cars.map((car) => car.id)).size,
      duplicateTrackIds:
        tracks.length - new Set(tracks.map((track) => track.id)).size,
      complete:
        missingGr3.length === 0 &&
        missingGr4.length === 0 &&
        missingTracks.length === 0,
    },
    null,
    2,
  ),
);
