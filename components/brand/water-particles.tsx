"use client";

import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
}

interface Drop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

export function WaterParticles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    const ripples: Ripple[] = [];
    const drops: Drop[] = [];
    const MAX_RIPPLES = 12;
    const MAX_DROPS = 35;

    // Initialize drops
    for (let i = 0; i < MAX_DROPS; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 8 + Math.random() * 12,
        speed: 2 + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.2,
      });
    }

    let lastRippleTime = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Spawn periodic gentle ripples
      if (time - lastRippleTime > 600 && ripples.length < MAX_RIPPLES) {
        lastRippleTime = time;
        ripples.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 2,
          maxRadius: 35 + Math.random() * 45,
          opacity: 0.35,
          speed: 0.6 + Math.random() * 0.4,
        });
      }

      // Draw and update drops
      ctx.strokeStyle = "rgba(111, 156, 140, 0.25)";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length);
        ctx.strokeStyle = `rgba(15, 111, 115, ${d.opacity})`;
        ctx.stroke();

        d.y += d.speed;
        d.x -= d.speed * 0.2;

        if (d.y > height) {
          d.y = -10;
          d.x = Math.random() * (width + 50);

          // Chance to trigger ripple at bottom
          if (Math.random() < 0.3 && ripples.length < MAX_RIPPLES) {
            ripples.push({
              x: d.x,
              y: height - 10 + Math.random() * 10,
              radius: 2,
              maxRadius: 25 + Math.random() * 25,
              opacity: 0.3,
              speed: 0.5,
            });
          }
        }
      }

      // Draw and update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(15, 111, 115, ${r.opacity})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        // Inner secondary wave
        if (r.radius > 12) {
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.radius * 0.6, r.radius * 0.27, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(111, 156, 140, ${r.opacity * 0.6})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }

        r.radius += r.speed;
        r.opacity = Math.max(0, 0.35 * (1 - r.radius / r.maxRadius));

        if (r.radius >= r.maxRadius || r.opacity <= 0) {
          ripples.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
