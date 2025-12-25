
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Level, 
  GameStatus, 
  AuntyState, 
  Point, 
  ThreatType, 
  Threat, 
  GameObject 
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  AUNTY_RADIUS, 
  VICTORY_DELAY,
  GRAVITY,
  BALLOON_BUOYANCY,
  LINE_GRAVITY,
  MAX_INK_DEFAULT
} from '../constants';

interface GameEngineProps {
  level: Level;
  status: GameStatus;
  onLevelComplete: (won: boolean) => void;
  onStart: () => void;
}

const SUB_STEPS = 30; 
const WALL_THICKNESS = 14;
const BEE_PUSH_STRENGTH = 0.22; 
const BEE_TORQUE_STRENGTH = 0.00045; 
const LINE_COLLISION_RADIUS = 12;
const MAX_LINE_VEL = 12; 
const MAX_BEE_VEL = 18; 
const BOUNCE_COEFFICIENT = 1.2; 
const HIVE_SAFE_RADIUS = 38; 
const BALLOON_RADIUS = 30;
const BALLOON_OFFSET_Y = 165; 

const GameEngine: React.FC<GameEngineProps> = ({ level, status, onLevelComplete, onStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [linePoints, setLinePoints] = useState<Point[]>([]); 
  const [linePos, setLinePos] = useState<Point>({ x: 0, y: 0 });
  const [lineRot, setLineRot] = useState(0);
  const [lineVX, setLineVX] = useState(0);
  const [lineVY, setLineVY] = useState(0);
  const [lineAV, setLineAV] = useState(0);
  
  const [drawingPath, setDrawingPath] = useState<Point[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [objects, setObjects] = useState<GameObject[]>([]);
  
  const [auntyP, setAuntyP] = useState<Point>(level.auntyPos);
  const [auntyVX, setAuntyVX] = useState(0);
  const [auntyVY, setAuntyVY] = useState(0);
  const [auntyState, setAuntyState] = useState<AuntyState>(AuntyState.CALM);

  const [survivedTime, setSurvivedTime] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [usedInk, setUsedInk] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const maxInk = level.maxInk || MAX_INK_DEFAULT;
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  useEffect(() => {
    setAuntyP(level.auntyPos);
    setAuntyVX(0);
    setAuntyVY(0);
    setAuntyState(AuntyState.CALM);
    
    setThreats(level.threats.map(t => ({ 
      ...t, 
      x: level.hivePos.x, 
      y: level.hivePos.y, 
      vx: 0, 
      vy: 0, 
      active: true,
      impact: 0
    })));

    setObjects(level.objects.map(o => ({ ...o })));
    setLinePoints([]);
    setDrawingPath([]);
    setLinePos({ x: 0, y: 0 });
    setLineRot(0);
    setLineVX(0);
    setLineVY(0);
    setLineAV(0);
    setSurvivedTime(0);
    setIsDrawing(false);
    setUsedInk(0);
    setHasStarted(false);
  }, [level]);

  const update = useCallback((deltaTime: number) => {
    if (status !== GameStatus.PLAYING && status !== GameStatus.READY) return;

    if (isDrawing) {
      setUsedInk(prev => Math.min(maxInk, prev + deltaTime));
    }

    if (status === GameStatus.PLAYING) {
      const gPerStep = (level.hasBalloon ? BALLOON_BUOYANCY : GRAVITY) / SUB_STEPS;
      const lineGPerStep = LINE_GRAVITY / SUB_STEPS;

      let curAX = auntyP.x;
      let curAY = auntyP.y;
      let curAVX = auntyVX;
      let curAVY = auntyVY;

      let curLinePos = { ...linePos };
      let curLineRot = lineRot;
      let curLineVX = lineVX;
      let curLineVY = lineVY;
      let curLineAV = lineAV;
      let curThreats = threats.map(t => ({ ...t }));
      let hitAunty = false;

      const fierceFactor = 1.0 + (survivedTime / VICTORY_DELAY) * 1.5;

      for (let s = 0; s < SUB_STEPS; s++) {
        // 1. Integration
        curAVY += gPerStep;
        curAX += curAVX / SUB_STEPS;
        curAY += curAVY / SUB_STEPS;
        curAVX *= 0.99;

        if (linePoints.length > 0) {
          curLineVY += lineGPerStep;
          curLinePos.x += curLineVX / SUB_STEPS;
          curLinePos.y += curLineVY / SUB_STEPS;
          curLineRot += curLineAV / SUB_STEPS;
          
          curLineVX = Math.max(-MAX_LINE_VEL, Math.min(MAX_LINE_VEL, curLineVX * 0.998));
          curLineVY = Math.max(-MAX_LINE_VEL, Math.min(MAX_LINE_VEL, curLineVY * 0.998));
          curLineAV *= 0.99;
        }

        const cos = Math.cos(curLineRot);
        const sin = Math.sin(curLineRot);
        const worldPoints = linePoints.map(p => ({
          x: curLinePos.x + (p.x * cos - p.y * sin),
          y: curLinePos.y + (p.x * sin + p.y * cos)
        }));

        // 2. Resolve Balloon Constraints (New)
        if (level.hasBalloon) {
          const bx = curAX;
          const by = curAY - BALLOON_OFFSET_Y;
          const br = BALLOON_RADIUS;

          // Border Frame Constraints for Balloon
          if (by - br < WALL_THICKNESS) {
            curAY += (WALL_THICKNESS - (by - br));
            curAVY = Math.max(0, curAVY);
          }
          if (bx - br < WALL_THICKNESS) {
            curAX += (WALL_THICKNESS - (bx - br));
            curAVX = Math.max(0, curAVX);
          }
          if (bx + br > CANVAS_WIDTH - WALL_THICKNESS) {
            curAX -= (bx + br - (CANVAS_WIDTH - WALL_THICKNESS));
            curAVX = Math.min(0, curAVX);
          }

          // Object Constraints for Balloon
          objects.forEach(obj => {
            if (obj.type === 'platform' || obj.type === 'crate') {
              const cx = Math.max(obj.x, Math.min(bx, obj.x + obj.width));
              const cy = Math.max(obj.y, Math.min(by, obj.y + obj.height));
              const dx = bx - cx; const dy = by - cy;
              const distSq = dx*dx + dy*dy;
              if (distSq < br * br) {
                const dist = Math.sqrt(distSq) || 0.1;
                const nx = dx / dist; const ny = dy / dist;
                const overlap = br - dist;
                curAX += nx * overlap; curAY += ny * overlap;
              }
            }
          });

          // Line Constraints for Balloon
          if (worldPoints.length > 1) {
            for (let i = 0; i < worldPoints.length - 1; i++) {
              const p1 = worldPoints[i]; const p2 = worldPoints[i+1];
              const closest = closestPointOnSegment(p1.x, p1.y, p2.x, p2.y, bx, by);
              const dx = bx - closest.x; const dy = by - closest.y;
              const distSq = dx*dx + dy*dy;
              if (distSq < (br + 2) * (br + 2)) {
                const dist = Math.sqrt(distSq) || 0.1;
                const nx = dx / dist; const ny = dy / dist;
                const overlap = (br + 2) - dist;
                curAX += nx * overlap; curAY += ny * overlap;
                // Minor nudge to the line
                curLineVX -= nx * 0.05; curLineVY -= ny * 0.05;
              }
            }
          }
        }

        // 3. Resolve External Forces (Lines and Bees pushing Aunty)
        if (worldPoints.length > 1) {
          for (let i = 0; i < worldPoints.length - 1; i++) {
            const p1 = worldPoints[i]; const p2 = worldPoints[i+1];
            const closestA = closestPointOnSegment(p1.x, p1.y, p2.x, p2.y, curAX, curAY);
            const dxA = curAX - closestA.x; const dyA = curAY - closestA.y;
            const distSqA = dxA*dxA + dyA*dyA;
            const minDistA = AUNTY_RADIUS + 4;
            if (distSqA < minDistA * minDistA) {
              const dist = Math.sqrt(distSqA) || 0.1;
              const nx = dxA / dist; const ny = dyA / dist;
              const overlap = minDistA - dist;
              curAX += nx * overlap; curAY += ny * overlap;
              const dot = curAVX * nx + curAVY * ny;
              if (dot < 0) { curAVX -= nx * dot * 0.8; curAVY -= ny * dot * 0.8; }
            }
          }
        }

        curThreats.forEach((t, index) => {
          if (!t.active) return;
          const adx = curAX - t.x; const ady = curAY - t.y;
          const dist = Math.sqrt(adx*adx + ady*ady) || 0.1;
          const sMult = (t as any).speedMultiplier || 1.6;
          const accel = (4.0 * sMult * fierceFactor) / SUB_STEPS;
          
          t.vx += (adx / dist) * accel; 
          t.vy += (ady / dist) * accel;
          
          const currentSpeedSq = t.vx * t.vx + t.vy * t.vy;
          if (currentSpeedSq > MAX_BEE_VEL * MAX_BEE_VEL) {
              const factor = MAX_BEE_VEL / Math.sqrt(currentSpeedSq);
              t.vx *= factor; t.vy *= factor;
          }

          t.vx *= 0.985; t.vy *= 0.985;
          t.x += t.vx / SUB_STEPS; t.y += t.vy / SUB_STEPS;
          
          if (t.impact && t.impact > 0) {
            t.impact = Math.max(0, t.impact - (deltaTime / SUB_STEPS));
          }

          if (worldPoints.length > 1) {
            for (let i = 0; i < worldPoints.length - 1; i++) {
              const p1 = worldPoints[i]; const p2 = worldPoints[i+1];
              const closest = closestPointOnSegment(p1.x, p1.y, p2.x, p2.y, t.x, t.y);
              const bdx = t.x - closest.x; const bdy = t.y - closest.y;
              const bdSq = bdx*bdx + bdy*bdy;
              const bThreshold = LINE_COLLISION_RADIUS + 2;
              if (bdSq < bThreshold * bThreshold) {
                t.impact = 300; 
                const bd = Math.sqrt(bdSq) || 0.1;
                const bnx = bdx / bd; const bny = bdy / bd;
                const bOverlap = bThreshold - bd;
                t.x += bnx * bOverlap; t.y += bny * bOverlap;
                const bDot = t.vx * bnx + t.vy * bny;
                if (bDot < 0) {
                    t.vx = (t.vx - 2 * bDot * bnx) * BOUNCE_COEFFICIENT;
                    t.vy = (t.vy - 2 * bDot * bny) * BOUNCE_COEFFICIENT;
                }
                const pushX = -bnx * BEE_PUSH_STRENGTH;
                const pushY = -bny * BEE_PUSH_STRENGTH;
                curLineVX += pushX; curLineVY += pushY;
                const rx = closest.x - curLinePos.x;
                const ry = closest.y - curLinePos.y;
                curLineAV += (rx * pushY - ry * pushX) * BEE_TORQUE_STRENGTH;
              }
            }
          }
          if (dist < AUNTY_RADIUS * 0.85) {
             hitAunty = true;
             t.impact = 500;
          }
        });

        // 4. Resolve Environment (Final Word on Body Solidity)
        const minX = WALL_THICKNESS + AUNTY_RADIUS;
        const maxX = CANVAS_WIDTH - WALL_THICKNESS - AUNTY_RADIUS;
        const minY = WALL_THICKNESS + AUNTY_RADIUS;
        const maxY = CANVAS_HEIGHT - WALL_THICKNESS - 75; 

        if (curAX < minX) { curAX = minX; curAVX = Math.max(0, curAVX); }
        if (curAX > maxX) { curAX = maxX; curAVX = Math.min(0, curAVX); }
        if (curAY < minY) { curAY = minY; curAVY = Math.max(0, curAVY); }
        if (curAY > maxY) { curAY = maxY; curAVY = 0; }

        objects.forEach(obj => {
          if (obj.type === 'platform' || obj.type === 'crate') {
            const cx = Math.max(obj.x, Math.min(curAX, obj.x + obj.width));
            const cy = Math.max(obj.y, Math.min(curAY, obj.y + obj.height));
            const dx = curAX - cx; const dy = curAY - cy;
            const distSq = dx*dx + dy*dy;
            if (distSq < AUNTY_RADIUS * AUNTY_RADIUS) {
              const dist = Math.sqrt(distSq) || 0.1;
              const nx = dx / dist; const ny = dy / dist;
              const overlap = AUNTY_RADIUS - dist;
              curAX += nx * overlap; curAY += ny * overlap;
              if (ny < -0.6) curAVY = 0; 
            }
            curThreats.forEach(t => {
                if (t.x > obj.x - 5 && t.x < obj.x + obj.width + 5 && t.y > obj.y - 5 && t.y < obj.y + obj.height + 5) {
                    const dl = t.x - obj.x; const dr = (obj.x + obj.width) - t.x;
                    const dt = t.y - obj.y; const db = (obj.y + obj.height) - t.y;
                    const m = Math.min(dl, dr, dt, db);
                    if (m === dl) { t.x = obj.x - 5; t.vx *= -0.8; }
                    else if (m === dr) { t.x = obj.x + obj.width + 5; t.vx *= -0.8; }
                    else if (m === dt) { t.y = obj.y - 5; t.vy *= -0.8; }
                    else { t.y = obj.y + obj.height + 5; t.vy *= -0.8; }
                }
            });
          } else if (obj.type === 'spikes' || obj.type === 'water') {
            const cx = Math.max(obj.x, Math.min(curAX, obj.x + obj.width));
            const cy = Math.max(obj.y, Math.min(curAY, obj.y + obj.height));
            const distSq = (curAX - cx)**2 + (curAY - cy)**2;
            if (distSq < (AUNTY_RADIUS * 0.8)**2) hitAunty = true;
          }
        });

        curThreats.forEach(t => {
            if (t.x < WALL_THICKNESS + 8) { t.x = WALL_THICKNESS + 8; t.vx *= -0.8; }
            if (t.x > CANVAS_WIDTH - WALL_THICKNESS - 8) { t.x = CANVAS_WIDTH - WALL_THICKNESS - 8; t.vx *= -0.8; }
            if (t.y < WALL_THICKNESS + 8) { t.y = WALL_THICKNESS + 8; t.vy *= -0.8; }
            if (t.y > CANVAS_HEIGHT - WALL_THICKNESS - 15) { t.y = CANVAS_HEIGHT - WALL_THICKNESS - 15; t.vy *= -0.8; }
        });

        if (linePoints.length > 0) {
          let totalCorrection = { x: 0, y: 0 };
          let groundedCount = 0;
          worldPoints.forEach(p => {
            let hit = false;
            let targetX = p.x; let targetY = p.y;
            if (targetX < WALL_THICKNESS + 9) { targetX = WALL_THICKNESS + 9; hit = true; }
            if (targetX > CANVAS_WIDTH - WALL_THICKNESS - 9) { targetX = CANVAS_WIDTH - WALL_THICKNESS - 9; hit = true; }
            if (targetY < WALL_THICKNESS + 9) { targetY = WALL_THICKNESS + 9; hit = true; }
            if (targetY > CANVAS_HEIGHT - WALL_THICKNESS - 9) { targetY = CANVAS_HEIGHT - WALL_THICKNESS - 9; hit = true; }
            objects.forEach(obj => {
              if (obj.type === 'platform' || obj.type === 'crate' || obj.type === 'spikes') {
                if (targetX > obj.x - 2 && targetX < obj.x + obj.width + 2 && targetY > obj.y - 2 && targetY < obj.y + obj.height + 2) {
                  const dl = targetX - obj.x; const dr = (obj.x + obj.width) - targetX;
                  const dt = targetY - obj.y; const db = (obj.y + obj.height) - targetY;
                  const m = Math.min(dl, dr, dt, db);
                  if (m === dl) targetX = obj.x - 2;
                  else if (m === dr) targetX = obj.x + obj.width + 2;
                  else if (m === dt) targetY = obj.y - 2;
                  else targetY = obj.y + obj.height + 2;
                  hit = true;
                }
              }
            });
            if (hit) { totalCorrection.x += (targetX - p.x); totalCorrection.y += (targetY - p.y); groundedCount++; }
          });
          if (groundedCount > 0) {
            curLinePos.x += totalCorrection.x / groundedCount;
            curLinePos.y += totalCorrection.y / groundedCount;
            curLineVX *= 0.5; curLineVY *= 0.5; curLineAV *= 0.8;
          }
        }
      }
      
      if (hitAunty) { onLevelComplete(false); setAuntyState(AuntyState.HARMED); }
      setAuntyP({ x: curAX, y: curAY });
      setAuntyVX(curAVX); setAuntyVY(curAVY);
      setLinePos(curLinePos); setLineRot(curLineRot);
      setLineVX(curLineVX); setLineVY(curLineVY); setLineAV(curLineAV);
      setThreats(curThreats);
      setSurvivedTime(prev => {
        const next = prev + deltaTime;
        if (next >= VICTORY_DELAY && status === GameStatus.PLAYING) {
          onLevelComplete(true); setAuntyState(AuntyState.HAPPY);
        }
        return next;
      });
    }
    const closeThreat = threats.some(t => t.active && Math.sqrt((t.x - auntyP.x)**2 + (t.y - auntyP.y)**2) < 140);
    if (auntyState !== AuntyState.HAPPY && auntyState !== AuntyState.HARMED) {
      setAuntyState(closeThreat ? AuntyState.WORRIED : AuntyState.CALM);
    }
  }, [status, drawingPath, linePoints, linePos, lineRot, lineVX, lineVY, lineAV, objects, auntyP, auntyVX, auntyVY, auntyState, onLevelComplete, threats, isDrawing, usedInk, maxInk, level, survivedTime]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) update(time - lastTimeRef.current);
    lastTimeRef.current = time;
    draw();
    requestRef.current = requestAnimationFrame(animate);
  }, [update]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.arc(100, 680, 300, 0, Math.PI * 2); ctx.arc(350, 740, 400, 0, Math.PI * 2); ctx.fill();
    objects.forEach(obj => {
      if (obj.type === 'platform') {
        ctx.fillStyle = '#8b4513'; ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(obj.x - 4, obj.y - 4, obj.width + 8, 8);
        ctx.strokeRect(obj.x - 4, obj.y - 4, obj.width + 8, 8);
      } else if (obj.type === 'crate') {
        ctx.fillStyle = '#cd853f'; ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.beginPath(); ctx.moveTo(obj.x, obj.y); ctx.lineTo(obj.x+obj.width, obj.y+obj.height); ctx.stroke();
      } else if (obj.type === 'water') {
        ctx.fillStyle = '#006994'; ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        for (let wx = obj.x; wx < obj.x + obj.width; wx += 15) { ctx.beginPath(); ctx.arc(wx + 7, obj.y, 5, Math.PI, 0); ctx.stroke(); }
      } else if (obj.type === 'spikes') {
        ctx.fillStyle = '#444'; for(let sx=obj.x; sx<obj.x+obj.width; sx+=12) {
          ctx.beginPath(); ctx.moveTo(sx, obj.y+obj.height); ctx.lineTo(sx+6, obj.y); ctx.lineTo(sx+12, obj.y+obj.height); ctx.fill(); ctx.stroke();
        }
      }
    });
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, WALL_THICKNESS);
    ctx.fillRect(0, CANVAS_HEIGHT - WALL_THICKNESS, CANVAS_WIDTH, WALL_THICKNESS);
    ctx.fillRect(0, 0, WALL_THICKNESS, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, CANVAS_HEIGHT);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
    const inkPercent = 1 - (usedInk / maxInk);
    ctx.save(); ctx.translate(30, 45);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 160, 24);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 160, 24);
    ctx.fillStyle = inkPercent > 0.25 ? '#00ff00' : '#f83800';
    ctx.fillRect(4, 4, 152 * Math.max(0, inkPercent), 16);
    ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P"'; ctx.fillText(`INK`, 4, -10);
    ctx.restore();
    if (status === GameStatus.PLAYING) {
      const remainingSeconds = Math.ceil((VICTORY_DELAY - survivedTime) / 1000);
      ctx.save(); ctx.translate(CANVAS_WIDTH - 65, 75);
      ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = 'bold 26px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(remainingSeconds.toString(), 0, 4);
      ctx.restore();
    }
    const hp = level.hivePos;
    const platformAbove = objects.find(o => o.type === 'platform' && hp.x >= o.x && hp.x <= o.x + o.width && o.y < hp.y);
    if (platformAbove) {
      ctx.strokeStyle = '#5d3b1a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(hp.x, platformAbove.y + platformAbove.height); ctx.lineTo(hp.x, hp.y - 30); ctx.stroke();
    }
    ctx.save(); ctx.translate(hp.x, hp.y); 
    ctx.fillStyle = '#8b4513'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for(let r=-25; r<=25; r+=15) { ctx.beginPath(); ctx.moveTo(-28, r); ctx.lineTo(28, r); ctx.stroke(); }
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, 10, 10, 0, Math.PI * 2); ctx.fill();
    if (!hasStarted) {
      ctx.fillStyle = '#f8b800'; ctx.beginPath(); ctx.arc(-8, 10, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, 8, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
    if (isDrawing && drawingPath.length > 1) {
      ctx.strokeStyle = '#000'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(drawingPath[0].x, drawingPath[0].y); drawingPath.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    }
    if (linePoints.length > 1) {
      ctx.save(); ctx.translate(linePos.x, linePos.y); ctx.rotate(lineRot);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(linePoints[0].x, linePoints[0].y); linePoints.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); 
      ctx.restore();
    }
    if (hasStarted) {
      threats.forEach((t, i) => {
        if (!t.active) return;
        ctx.save(); ctx.translate(t.x, t.y); 
        if (t.vx < 0) ctx.scale(-1, 1);
        
        const isImpacted = t.impact && t.impact > 0;
        const wingSpeedMult = isImpacted ? 3 : 1;
        const wingFlicker = Math.sin(Date.now() / (20 / wingSpeedMult) + i) * 12;
        
        if (isImpacted) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f83800';
          ctx.fillStyle = 'rgba(248, 56, 0, 0.4)';
          ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath(); ctx.ellipse(-5, -12, 11, Math.abs(wingFlicker), 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5, -12, 11, Math.abs(wingFlicker), -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(10, -20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(15, -17); ctx.stroke();
        
        ctx.fillStyle = isImpacted ? '#ff4d4d' : '#f8b800'; 
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.fillRect(-7, -11, 4, 22); ctx.fillRect(2, -11, 4, 22);
        ctx.fillStyle = '#f80000'; ctx.beginPath(); ctx.arc(12, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(16, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }
    ctx.save(); ctx.translate(auntyP.x, auntyP.y);
    if (level.hasBalloon) {
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -AUNTY_RADIUS); ctx.lineTo(0, -BALLOON_OFFSET_Y + 25); ctx.stroke();
      ctx.fillStyle = '#f83800'; ctx.beginPath(); ctx.ellipse(0, -BALLOON_OFFSET_Y, BALLOON_RADIUS, 40, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(10, -BALLOON_OFFSET_Y - 15, 6, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-24, 20); ctx.lineTo(24, 20); ctx.lineTo(38, 75); ctx.lineTo(-38, 75); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8d878'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, -10, 32, Math.PI, 0); ctx.fill();
    const cColors = ['#f83800', '#ffcc00', '#f878f8'];
    for (let j = 0; j < 6; j++) {
      const a = (j / 5) * Math.PI + Math.PI; const cx = Math.cos(a) * 30; const cy = Math.sin(a) * 30 - 10;
      ctx.fillStyle = cColors[j % 3]; ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (auntyState === AuntyState.HARMED) {
      ctx.font = 'bold 20px serif'; ctx.textAlign = 'center'; ctx.fillStyle='#000'; ctx.fillText('× ×', 0, 10);
    } else { 
      ctx.fillStyle='#000'; ctx.fillRect(-12,-6,8,2); ctx.fillRect(4,-6,8,2); 
      ctx.beginPath(); ctx.arc(0,12,8,0.2*Math.PI,0.8*Math.PI); ctx.stroke(); 
      ctx.save(); ctx.translate(6, 10); ctx.rotate(-0.1); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 16, 4);
      ctx.fillStyle = '#f83800'; ctx.fillRect(12, 0, 4, 4); ctx.restore();
    }
    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (status !== GameStatus.READY || hasStarted) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const nx = e.clientX - rect.left; const ny = e.clientY - rect.top;
    if (isOverlapping(nx, ny)) return;
    setIsDrawing(true); setDrawingPath([{ x: nx, y: ny }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    let nx = e.clientX - rect.left; let ny = e.clientY - rect.top;
    nx = Math.max(WALL_THICKNESS + 8, Math.min(CANVAS_WIDTH - WALL_THICKNESS - 8, nx));
    ny = Math.max(WALL_THICKNESS + 8, Math.min(CANVAS_HEIGHT - WALL_THICKNESS - 8, ny));
    if (usedInk >= maxInk || isOverlapping(nx, ny)) { handlePointerUp(); return; }
    setDrawingPath(prev => {
      const last = prev[prev.length - 1];
      if (Math.sqrt((last.x - nx)**2 + (last.y - ny)**2) > 4) return [...prev, { x: nx, y: ny }];
      return prev;
    });
  };

  const handlePointerUp = () => {
    if (isDrawing && drawingPath.length > 3) { 
      const center = drawingPath.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      center.x /= drawingPath.length; center.y /= drawingPath.length;
      const relativePoints = drawingPath.map(p => ({ x: p.x - center.x, y: p.y - center.y }));
      setLinePoints(relativePoints); setLinePos(center);
      setIsDrawing(false); setDrawingPath([]); setHasStarted(true); onStart(); 
    } else if (isDrawing) { setDrawingPath([]); setUsedInk(0); setIsDrawing(false); }
  };

  const isOverlapping = (x: number, y: number) => {
    if (Math.sqrt((x - auntyP.x)**2 + (y - auntyP.y)**2) < AUNTY_RADIUS + 8) return true;
    if (Math.abs(x - auntyP.x) < 40 && y > auntyP.y - 30 && y < auntyP.y + 90) return true;
    if (level.hasBalloon) {
      const bx = auntyP.x; const by = auntyP.y - BALLOON_OFFSET_Y;
      if (Math.sqrt((x - bx)**2 + (y - by)**2) < BALLOON_RADIUS + 6) return true;
      if (Math.abs(x - bx) < 8 && y > by && y < auntyP.y) return true;
    }
    const hx = level.hivePos.x; const hy = level.hivePos.y;
    if (Math.sqrt((x - hx)**2 + (y - hy)**2) < HIVE_SAFE_RADIUS) return true;
    for (const obj of objects) {
        if (x > obj.x - 4 && x < obj.x + obj.width + 4 && y > obj.y - 4 && y < obj.y + obj.height + 4) return true;
    }
    return false;
  };

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} className="cursor-crosshair block touch-none select-none" />;
};

function closestPointOnSegment(x1: number, y1: number, x2: number, y2: number, px: number, py: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy || 1)));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

export default GameEngine;
