import { recommendCarsForChampionship, getTrackProfileWeightPercents } from '../src/engine/championshipEngine.js';
import { getTracksForGame } from '../src/utils/gameData.js';

const tracks = getTracksForGame('gt7');
const laguna = tracks.find(t => t.id === 'laguna_seca');
const monza = tracks.find(t => t.id === 'monza');
const spa = tracks.find(t => t.id === 'spa');
const fuji = tracks.find(t => t.id === 'fuji');
const interlagos = tracks.find(t => t.id === 'interlagos');
const sardegna = tracks.find(t => t.id === 'sardegna_road_track_b');

const settings = { fuelMultiplier: 3, tyreMultiplier: 5, lapCount: 29, bopOn: true };

const wp = getTrackProfileWeightPercents(laguna, settings);
console.log('Laguna demand weights %:', wp);

const r = recommendCarsForChampionship(['laguna_seca'], 'Gr.3', settings, 'gt7');
console.log('\nLaguna 29L x5/x3:');
r.forEach((c, i) => console.log(i+1, c.id.padEnd(45), 'tech:', c.trackFitScore?.toFixed(2)));

const targets = ['ferrari_296_gt3_23','porsche_911_gt3_r_22','genesis_x_gr3','subaru_wrx_gr3','nissan_gtr_gt3_18'];
console.log('\nTarget cars:');
targets.forEach(id => {
  const e = r.find(c => c.id === id);
  if (e) console.log(id, 'rank:', r.indexOf(e)+1, 'tech:', e.trackFitScore?.toFixed(2));
  else console.log(id, 'NOT IN RESULTS');
});

// Check other tracks with neutral settings (x1/x1/15 laps)
const neutral = { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 15, bopOn: true };
console.log('\n--- Monza 15L x1/x1 ---');
const rm = recommendCarsForChampionship(['monza'], 'Gr.3', neutral, 'gt7');
rm.slice(0,5).forEach((c,i) => console.log(i+1, c.id.padEnd(45), c.trackFitScore?.toFixed(2)));

console.log('\n--- Spa 15L x1/x1 ---');
const rs = recommendCarsForChampionship(['spa'], 'Gr.3', neutral, 'gt7');
rs.slice(0,5).forEach((c,i) => console.log(i+1, c.id.padEnd(45), c.trackFitScore?.toFixed(2)));

console.log('\n--- Fuji 15L x1/x1 ---');
const rf = recommendCarsForChampionship(['fuji'], 'Gr.3', neutral, 'gt7');
rf.slice(0,5).forEach((c,i) => console.log(i+1, c.id.padEnd(45), c.trackFitScore?.toFixed(2)));

console.log('\n--- Interlagos 15L x1/x1 ---');
const ri = recommendCarsForChampionship(['interlagos'], 'Gr.3', neutral, 'gt7');
ri.slice(0,5).forEach((c,i) => console.log(i+1, c.id.padEnd(45), c.trackFitScore?.toFixed(2)));

console.log('\n--- Sardegna 15L x1/x1 ---');
const rsd = recommendCarsForChampionship(['sardegna_road_track_b'], 'Gr.3', neutral, 'gt7');
rsd.slice(0,5).forEach((c,i) => console.log(i+1, c.id.padEnd(45), c.trackFitScore?.toFixed(2)));

// Verify: Laguna ordering is different from Monza
const lagunaTop3 = r.slice(0,3).map(c => c.id).join(',');
const monzaTop3 = rm.slice(0,3).map(c => c.id).join(',');
console.log('\nLaguna top 3:', lagunaTop3);
console.log('Monza top 3:', monzaTop3);
console.log('Are they the same?', lagunaTop3 === monzaTop3 ? 'YES (BAD)' : 'NO (GOOD — track-sensitive)');
