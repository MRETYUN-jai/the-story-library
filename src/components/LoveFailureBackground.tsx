'use client';

import { useEffect, useRef } from 'react';

export default function LoveFailureBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse dynamics & wind field
    const mouse = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      lastX: width / 2,
      lastY: height / 2,
      isMoving: false,
    };

    let moveTimeout: NodeJS.Timeout;

    // Interactive mouse trail particles (Rose dust / teardrops)
    interface TrailParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
    }
    const trailParticles: TrailParticle[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - mouse.lastX;
      const dy = e.clientY - mouse.lastY;
      mouse.vx = dx * 0.15;
      mouse.vy = dy * 0.15;
      mouse.lastX = e.clientX;
      mouse.lastY = e.clientY;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isMoving = true;

      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        mouse.isMoving = false;
      }, 100);

      // Emit subtle rose dust sparkles from cursor
      if (Math.hypot(dx, dy) > 2 && trailParticles.length < 50) {
        trailParticles.push({
          x: e.clientX + (Math.random() - 0.5) * 12,
          y: e.clientY + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 0.8 - mouse.vx * 0.1,
          vy: (Math.random() - 0.5) * 0.8 + 0.3,
          size: Math.random() * 2.2 + 1,
          alpha: 0.65,
          color: Math.random() > 0.4 ? '244, 63, 94' : '251, 113, 133',
          life: 1,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 1. Midnight Rain Streaks (tears falling across a dark windowpane)
    const rainCount = 55;
    const rain = Array.from({ length: rainCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 26 + 14,
      speed: Math.random() * 8 + 10,
      opacity: Math.random() * 0.18 + 0.07,
      wind: -0.7,
    }));

    // 2. Heartbreak Tumbling Rose Petals (Velvet rose & wilted dark crimson)
    const petalCount = 32;
    const petals = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 11 + 8,
      speedY: Math.random() * 0.85 + 0.55,
      speedX: (Math.random() - 0.5) * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      flipAngle: Math.random() * Math.PI,
      flipSpeed: Math.random() * 0.02 + 0.012,
      swayFrequency: Math.random() * 0.016 + 0.007,
      swayAmplitude: Math.random() * 1.6 + 1.1,
      opacity: Math.random() * 0.45 + 0.35,
      colorVariant: Math.random() > 0.45 ? ('velvet' as const) : ('withered' as const),
      pushVx: 0,
      pushVy: 0,
    }));

    // 3. Drifting Broken Heart Shards (faint crystal fragments of memories)
    const shardCount = 9;
    const shards = Array.from({ length: shardCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 14 + 10,
      speedY: -(Math.random() * 0.3 + 0.15), // Slow floating ascent like memories
      speedX: (Math.random() - 0.5) * 0.25,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      alpha: Math.random() * 0.18 + 0.08,
      pulseOffset: Math.random() * Math.PI * 2,
      splitGap: Math.random() * 2 + 1.5, // Break distance between two broken halves
    }));

    // 4. Memory Embers (faint starlight / distant memories)
    const emberCount = 22;
    const embers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: -(Math.random() * 0.35 + 0.15),
      speedX: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.55 + 0.25,
      pulseSpeed: Math.random() * 0.025 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.016;

      // Mouse inertia decay
      mouse.vx *= 0.92;
      mouse.vy *= 0.92;

      ctx.clearRect(0, 0, width, height);

      // --- LAYER A: Deep Midnight Heartbreak Abyss Vignette ---
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        width * 0.15,
        width * 0.5,
        height * 0.5,
        width * 0.95
      );
      bgGrad.addColorStop(0, '#0d1222'); // Rich dark indigo melancholy center
      bgGrad.addColorStop(0.45, '#070a14'); // Fading midnight
      bgGrad.addColorStop(1, '#030408'); // Deep sorrow obsidian
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // --- LAYER B: Soft 2 AM Heartbreak Bokeh Lights (Glows vividly through translucent glass) ---
      const bokehOrbs = [
        { x: width * 0.2, y: height * 0.25, r: 280, color: 'rgba(225, 29, 72, 0.085)' }, // Crimson glow
        { x: width * 0.8, y: height * 0.55, r: 320, color: 'rgba(159, 18, 57, 0.075)' },  // Wine blur
        { x: width * 0.45, y: height * 0.8, r: 260, color: 'rgba(244, 63, 94, 0.065)' },  // Soft rose tear
        { x: width * 0.15, y: height * 0.75, r: 220, color: 'rgba(56, 189, 248, 0.035)' }, // Cold blue loneliness
        { x: width * 0.65, y: height * 0.2, r: 240, color: 'rgba(168, 85, 247, 0.04)' },  // Twilight amethyst
      ];

      bokehOrbs.forEach((orb) => {
        const radGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        radGrad.addColorStop(0, orb.color);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      });

      // --- LAYER C: Midnight Rain Streaks ---
      ctx.lineWidth = 1;
      rain.forEach((r) => {
        r.y += r.speed;
        r.x += r.wind;

        if (r.y > height) {
          r.y = -r.length;
          r.x = Math.random() * (width + 120);
        }
        if (r.x < -20) {
          r.x = width + 20;
        }

        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.wind * (r.length * 0.22), r.y + r.length);
        ctx.strokeStyle = `rgba(186, 230, 253, ${r.opacity})`;
        ctx.stroke();
      });

      // --- LAYER D: Drifting Broken Heart Memory Shards ---
      shards.forEach((s) => {
        s.y += s.speedY;
        s.x += s.speedX;
        s.rotation += s.rotSpeed;

        if (s.y < -30) {
          s.y = height + 30;
          s.x = Math.random() * width;
        }
        if (s.x < -30) s.x = width + 30;
        if (s.x > width + 30) s.x = -30;

        const currentAlpha = (Math.sin(time * 2 + s.pulseOffset) * 0.2 + 0.8) * s.alpha;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        const sz = s.size;
        const gap = s.splitGap;

        // Draw Left Broken Heart Half
        ctx.save();
        ctx.translate(-gap, 0);
        ctx.beginPath();
        ctx.moveTo(0, -sz * 0.4);
        ctx.bezierCurveTo(-sz * 0.6, -sz * 0.8, -sz * 0.8, -sz * 0.1, 0, sz * 0.6);
        // Jagged crack on the inner edge
        ctx.lineTo(-sz * 0.1, sz * 0.2);
        ctx.lineTo(0, sz * 0.0);
        ctx.lineTo(-sz * 0.15, -sz * 0.2);
        ctx.closePath();
        ctx.strokeStyle = `rgba(244, 63, 94, ${currentAlpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.fillStyle = `rgba(190, 18, 60, ${currentAlpha * 0.12})`;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Right Broken Heart Half (drifting apart)
        ctx.save();
        ctx.translate(gap, 0);
        ctx.beginPath();
        ctx.moveTo(0, -sz * 0.4);
        ctx.bezierCurveTo(sz * 0.6, -sz * 0.8, sz * 0.8, -sz * 0.1, 0, sz * 0.6);
        // Jagged crack complementary
        ctx.lineTo(-sz * 0.1, sz * 0.2);
        ctx.lineTo(0, sz * 0.0);
        ctx.lineTo(-sz * 0.15, -sz * 0.2);
        ctx.closePath();
        ctx.strokeStyle = `rgba(244, 63, 94, ${currentAlpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.fillStyle = `rgba(190, 18, 60, ${currentAlpha * 0.12})`;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      });

      // --- LAYER E: Floating Memory Embers (Late Night Reflections) ---
      embers.forEach((emb) => {
        emb.y += emb.speedY;
        emb.x += emb.speedX;

        if (emb.y < -10) emb.y = height + 10;
        if (emb.x < 0) emb.x = width;
        if (emb.x > width) emb.x = 0;

        const currentAlpha = (Math.sin(time * 3 + emb.phase) * 0.35 + 0.65) * emb.alpha;

        ctx.beginPath();
        ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 113, 133, ${currentAlpha * 0.7})`;
        ctx.shadowColor = 'rgba(225, 29, 72, 0.6)';
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // --- LAYER F: Tumbling Velvet Rose Petals with 3D Wind Physics ---
      petals.forEach((p) => {
        // Natural swaying oscillation
        const sway = Math.sin(time * p.swayFrequency * 60 + p.y * 0.008) * p.swayAmplitude;

        // Apply mouse interaction force (gentle wind push when cursor moves nearby)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 180 && dist > 0) {
          const force = (1 - dist / 180) * 2.2;
          p.pushVx += (dx / dist) * force + mouse.vx * 0.05;
          p.pushVy += (dy / dist) * force * 0.5 + mouse.vy * 0.05;
          p.rotationSpeed += (Math.random() - 0.5) * 0.01;
        }

        // Dissipate push velocity
        p.pushVx *= 0.94;
        p.pushVy *= 0.94;

        p.x += p.speedX + sway + p.pushVx;
        p.y += p.speedY + p.pushVy;
        p.rotation += p.rotationSpeed;
        p.flipAngle += p.flipSpeed;

        // Wrap around viewport edges
        if (p.y > height + 25) {
          p.y = -25;
          p.x = Math.random() * width;
        }
        if (p.x < -35) p.x = width + 35;
        if (p.x > width + 35) p.x = -35;

        // Render natural rose petal curve with 3D perspective flip
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 3D tumbling illusion (scaleX oscillates between -1 and 1)
        const scaleX = Math.cos(p.flipAngle);
        ctx.scale(scaleX, 1);

        ctx.beginPath();
        const w = p.size;
        const h = p.size * 1.38;
        ctx.moveTo(0, -h * 0.5);
        ctx.bezierCurveTo(w * 0.65, -h * 0.4, w * 0.85, h * 0.3, 0, h * 0.5);
        ctx.bezierCurveTo(-w * 0.85, h * 0.3, -w * 0.65, -h * 0.4, 0, -h * 0.5);
        ctx.closePath();

        // Velvet Rose Petal Gradient
        const petalGrad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
        if (p.colorVariant === 'velvet') {
          petalGrad.addColorStop(0, `rgba(244, 63, 94, ${p.opacity})`);
          petalGrad.addColorStop(0.5, `rgba(190, 18, 60, ${p.opacity * 0.92})`);
          petalGrad.addColorStop(1, `rgba(136, 19, 55, ${p.opacity * 0.75})`);
        } else {
          // Wilted dark crimson
          petalGrad.addColorStop(0, `rgba(225, 29, 72, ${p.opacity})`);
          petalGrad.addColorStop(0.5, `rgba(159, 18, 57, ${p.opacity * 0.9})`);
          petalGrad.addColorStop(1, `rgba(76, 5, 25, ${p.opacity * 0.8})`);
        }

        ctx.fillStyle = petalGrad;
        ctx.fill();

        // Delicate central petal vein
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.4);
        ctx.quadraticCurveTo(w * 0.1, 0, 0, h * 0.36);
        ctx.strokeStyle = `rgba(255, 228, 230, ${p.opacity * 0.28})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.restore();
      });

      // --- LAYER G: Interactive Cursor Rose Sparkles / Teardrops ---
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.alpha -= 0.02;
        tp.life -= 0.02;

        if (tp.alpha <= 0 || tp.life <= 0) {
          trailParticles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tp.color}, ${tp.alpha})`;
        ctx.shadowColor = 'rgba(225, 29, 72, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(moveTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
