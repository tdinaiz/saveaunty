
import { Level, InteractionType, ThreatType, GameObject } from './types';

const createBee = (id: string, x: number, y: number): any => ({
  id, 
  type: ThreatType.BEES, 
  x, 
  y, 
  width: 24, 
  height: 24, 
  vx: 0, 
  vy: 0, 
  active: true
});

export const LEVELS: Level[] = Array.from({ length: 50 }, (_, i) => {
  const levelNum = i + 1;
  
  const baseBeeCount = 25;
  const beeCount = Math.min(baseBeeCount + Math.floor(i * 3), 150); 
  const inkLimit = Math.max(3500 - (i * 60), 450);
  const beeAgitation = 1.2 + (i * 0.04); 
  
  const objects: GameObject[] = [];
  let auntyPos = { x: 200, y: 485 }; 
  let hivePos = { x: 200, y: 120 }; 
  const threats: any[] = [];
  let hasBalloon = false;

  const archetype = i % 25;
  const variation = (i * 19) % 100;

  switch (archetype) {
    case 0: // Basic platform
      objects.push({ id: 'f', type: 'platform', x: 0, y: 560, width: 400, height: 40 });
      auntyPos = { x: 200 + variation - 50, y: 485 };
      hivePos = { x: 200 - variation + 50, y: 130 };
      break;
    case 1: // Balloon Intro
      hasBalloon = true;
      objects.push({ id: 'p', type: 'platform', x: 150, y: 530, width: 100, height: 20 });
      auntyPos = { x: 200, y: 455 };
      hivePos = { x: 200, y: 80 }; 
      break;
    case 2: // The Chasm
      objects.push({ id: 'l', type: 'platform', x: 0, y: 450, width: 130, height: 150 });
      objects.push({ id: 'r', type: 'platform', x: 270, y: 450, width: 130, height: 150 });
      objects.push({ id: 's', type: 'spikes', x: 130, y: 570, width: 140, height: 30 });
      auntyPos = { x: 65, y: 375 };
      hivePos = { x: 335, y: 150 };
      break;
    case 3: // Funnel
      objects.push({ id: 'l', type: 'platform', x: 0, y: 320, width: 140, height: 20 });
      objects.push({ id: 'r', type: 'platform', x: 260, y: 320, width: 140, height: 20 });
      objects.push({ id: 'b', type: 'platform', x: 0, y: 560, width: 400, height: 40 });
      auntyPos = { x: 200, y: 485 };
      hivePos = { x: 200, y: 120 };
      break;
    case 4: // Umbrella - SPLIT to avoid blocking path
      objects.push({ id: 'fl', type: 'platform', x: 0, y: 550, width: 400, height: 50 });
      // Central path is now open
      objects.push({ id: 'l_side', type: 'platform', x: 0, y: 220, width: 110, height: 20 });
      objects.push({ id: 'r_side', type: 'platform', x: 290, y: 220, width: 110, height: 20 });
      auntyPos = { x: 200, y: 475 };
      hivePos = { x: 200, y: 100 }; 
      break;
    case 5: // The Wall
      objects.push({ id: 'p', type: 'platform', x: 180, y: 400, width: 40, height: 200 });
      auntyPos = { x: 100, y: 510 };
      hivePos = { x: 300, y: 130 };
      break;
    case 6: // Ledges
      objects.push({ id: 'l1', type: 'platform', x: 0, y: 530, width: 150, height: 20 });
      objects.push({ id: 'l2', type: 'platform', x: 250, y: 380, width: 150, height: 20 });
      auntyPos = { x: 75, y: 455 };
      hivePos = { x: 325, y: 130 };
      break;
    case 7: // Cage
      objects.push({ id: 'wl', type: 'platform', x: 100, y: 400, width: 20, height: 160 });
      objects.push({ id: 'wr', type: 'platform', x: 280, y: 400, width: 20, height: 160 });
      objects.push({ id: 'wb', type: 'platform', x: 100, y: 560, width: 200, height: 40 });
      auntyPos = { x: 190, y: 485 };
      hivePos = { x: 350, y: 120 }; // Hive offset so path into cage isn't blocked by top rim
      break;
    case 8: // Ceiling Hive - Offset platform
      objects.push({ id: 'c', type: 'platform', x: 250, y: 300, width: 150, height: 20 });
      auntyPos = { x: 100, y: 225 };
      hivePos = { x: 100, y: 520 };
      break;
    case 9: // Maze Blocks
      objects.push({ id: 'm1', type: 'platform', x: 0, y: 350, width: 220, height: 20 });
      objects.push({ id: 'm2', type: 'platform', x: 180, y: 500, width: 220, height: 20 });
      auntyPos = { x: 350, y: 425 }; 
      hivePos = { x: 60, y: 130 };
      break;
    case 10: // Basic 2
      objects.push({ id: 'f', type: 'platform', x: 0, y: 560, width: 400, height: 40 });
      auntyPos = { x: 100, y: 485 };
      hivePos = { x: 300, y: 120 };
      break;
    case 11: // Corner
      objects.push({ id: 'f', type: 'platform', x: 250, y: 550, width: 150, height: 50 });
      auntyPos = { x: 325, y: 475 };
      hivePos = { x: 75, y: 120 };
      break;
    case 12: // Floating Spikes
      hasBalloon = true;
      objects.push({ id: 's1', type: 'spikes', x: 0, y: 0, width: 400, height: 20 });
      objects.push({ id: 'p', type: 'platform', x: 50, y: 450, width: 100, height: 20 });
      auntyPos = { x: 300, y: 375 };
      hivePos = { x: 300, y: 540 };
      break;
    case 13: // Zig-zag
      for(let j=0; j<3; j++) {
        objects.push({ id: `z${j}`, type: 'platform', x: j % 2 === 0 ? 0 : 150, y: 220 + j*110, width: 250, height: 20 });
      }
      auntyPos = { x: 320, y: 525 };
      hivePos = { x: 50, y: 100 };
      break;
    case 14: // Pillar 2
      objects.push({ id: 'pil', type: 'platform', x: 180, y: 330, width: 40, height: 270 });
      auntyPos = { x: 100, y: 255 };
      hivePos = { x: 300, y: 500 };
      break;
    case 15: // Ceiling Spikes 2 - SPLIT
      objects.push({ id: 'gr', type: 'platform', x: 0, y: 560, width: 400, height: 40 });
      objects.push({ id: 'sr_l', type: 'spikes', x: 0, y: 360, width: 120, height: 20 });
      objects.push({ id: 'sr_r', type: 'spikes', x: 280, y: 360, width: 120, height: 20 });
      auntyPos = { x: 200, y: 485 };
      hivePos = { x: 200, y: 100 };
      break;
    case 16: // Split Floor 2
      objects.push({ id: 'l', type: 'platform', x: 20, y: 500, width: 120, height: 20 });
      objects.push({ id: 'r', type: 'platform', x: 260, y: 500, width: 120, height: 20 });
      auntyPos = { x: 80, y: 425 };
      hivePos = { x: 320, y: 130 };
      break;
    case 17: // Balloon Box 2
      hasBalloon = true;
      objects.push({ id: 'b', type: 'platform', x: 120, y: 450, width: 160, height: 20 });
      auntyPos = { x: 200, y: 200 }; // Aunty high up
      hivePos = { x: 200, y: 550 };
      break;
    case 18: // Dual Choke
      objects.push({ id: 't', type: 'platform', x: 0, y: 420, width: 140, height: 140 });
      objects.push({ id: 'b', type: 'platform', x: 260, y: 420, width: 140, height: 140 });
      auntyPos = { x: 200, y: 510 };
      hivePos = { x: 200, y: 100 };
      break;
    case 19: // Skybox Balloon
      hasBalloon = true;
      objects.push({ id: 'ceil', type: 'platform', x: 150, y: 160, width: 100, height: 20 });
      auntyPos = { x: 50, y: 165 }; 
      hivePos = { x: 50, y: 520 };
      break;
    case 20: // Eye Siege - Offset hive
      objects.push({ id: 'c', type: 'platform', x: 180, y: 340, width: 40, height: 40 });
      auntyPos = { x: 200, y: 265 };
      hivePos = { x: 50, y: 100 };
      break;
    case 21: // Ladder Steps
      for(let k=0; k<4; k++) {
        objects.push({ id: `k${k}`, type: 'platform', x: k*90, y: 560-k*80, width: 90, height: 15 });
      }
      auntyPos = { x: 330, y: 245 };
      hivePos = { x: 60, y: 100 };
      break;
    case 22: // Water Pit Defense 2
      objects.push({ id: 'l', type: 'platform', x: 0, y: 520, width: 110, height: 80 });
      objects.push({ id: 'r', type: 'platform', x: 290, y: 520, width: 110, height: 80 });
      objects.push({ id: 'w', type: 'water', x: 110, y: 570, width: 180, height: 30 });
      auntyPos = { x: 55, y: 445 };
      hivePos = { x: 345, y: 120 };
      break;
    case 23: // Thin Wire
      objects.push({ id: 'b', type: 'platform', x: 60, y: 460, width: 280, height: 12 });
      auntyPos = { x: 200, y: 385 };
      hivePos = { x: 200, y: 100 };
      break;
    case 24: // Final Arena
      objects.push({ id: 'f', type: 'platform', x: 0, y: 580, width: 400, height: 20 });
      objects.push({ id: 'l', type: 'platform', x: 40, y: 360, width: 20, height: 180 });
      objects.push({ id: 'r', type: 'platform', x: 340, y: 360, width: 20, height: 180 });
      auntyPos = { x: 200, y: 505 };
      hivePos = { x: 200, y: 100 };
      break;
  }

  // Final Hive safety zone for UI - HUD is usually y=20-80
  if (hivePos.y < 120) {
    if (hivePos.x < 150 || hivePos.x > 250) {
      // Near edges is safer for HUD
    } else {
      hivePos.y = 120;
    }
  }

  for(let b=0; b<beeCount; b++) {
    const bee = createBee(`b${b}`, hivePos.x, hivePos.y);
    (bee as any).speedMultiplier = beeAgitation;
    threats.push(bee);
  }

  return {
    id: levelNum,
    title: `Level ${levelNum}: ${getFlavorTitle(i)}`,
    auntyPos,
    hivePos,
    interaction: InteractionType.DRAW,
    maxInk: inkLimit,
    objects,
    threats,
    hasBalloon
  };
});

function getFlavorTitle(i: number) {
  const titles = [
    "Tea Break", "Curler Crisis", "Rent Duel", "Smoking Zone", "Lace Defense",
    "Buzzing Alley", "Patio Panic", "Garden Gaps", "Hive Siege", "Laundry Day",
    "Slippery Tiles", "Golden Block", "Sky High", "Balcony Defense", "Tight Corner",
    "Swarm Peak", "Narrow Ledge", "Triple Trouble", "The Great Hive", "Market Madness",
    "Vertical Drop", "Island Escape", "Stinger Maze", "Final Stand", "Bee Overlord"
  ];
  return titles[i % titles.length];
}
