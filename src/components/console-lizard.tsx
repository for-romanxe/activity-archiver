"use client";

import { useEffect, useRef } from "react";

/** 관제실을 돌아다니는 인광 도마뱀.
 *  도마뱀답게 확 대시했다가 한참 멈추기를 반복하고, 커서가 다가오면 도망친다.
 *  pointer-events 없음(클릭 통과), prefers-reduced-motion이면 아예 안 나온다. */
export function ConsoleLizard() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    const MARGIN = 36;
    const SPEED = 320; // px/s, 대시 속도
    const FLEE_DIST = 110;

    let x = MARGIN + Math.random() * (innerWidth - MARGIN * 2);
    let y = MARGIN + Math.random() * (innerHeight - MARGIN * 2);
    let angle = Math.random() * 360;
    let tx = x;
    let ty = y;
    let resting = true;
    let restUntil = performance.now() + 1200 + Math.random() * 1800;
    const mouse = { x: -9999, y: -9999 };

    // 첫 rAF 전에 모서리에서 번쩍하지 않게 초기 위치를 즉시 반영
    el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    el.style.display = "block";

    const clampX = (v: number) => Math.min(Math.max(v, MARGIN), innerWidth - MARGIN);
    const clampY = (v: number) => Math.min(Math.max(v, MARGIN), innerHeight - MARGIN);

    const newTarget = (fleeing = false) => {
      if (fleeing) {
        // 커서 반대 방향으로 한 번에 크게
        const away = Math.atan2(y - mouse.y, x - mouse.x) + (Math.random() - 0.5);
        tx = clampX(x + Math.cos(away) * (240 + Math.random() * 200));
        ty = clampY(y + Math.sin(away) * (240 + Math.random() * 200));
      } else {
        const dist = 90 + Math.random() * 320;
        const dir = Math.random() * Math.PI * 2;
        tx = clampX(x + Math.cos(dir) * dist);
        ty = clampY(y + Math.sin(dir) * dist);
      }
      resting = false;
      el.classList.add("dashing");
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (Math.hypot(x - mouse.x, y - mouse.y) < FLEE_DIST) newTarget(true);
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (resting) {
        if (now >= restUntil) newTarget();
      } else {
        const dx = tx - x;
        const dy = ty - y;
        const dist = Math.hypot(dx, dy);
        const step = SPEED * dt;
        if (dist <= step) {
          x = tx;
          y = ty;
          resting = true;
          restUntil = now + 900 + Math.random() * 3200;
          el.classList.remove("dashing");
        } else {
          x += (dx / dist) * step;
          y += (dy / dist) * step;
          // SVG는 머리가 위를 향하므로 +90도
          const heading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          let diff = ((heading - angle + 540) % 360) - 180;
          angle += diff * Math.min(1, dt * 14);
        }
      }

      const wiggle = resting ? 0 : Math.sin(now / 42) * 5;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${angle + wiggle}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      x = clampX(x);
      y = clampY(y);
      tx = clampX(tx);
      ty = clampY(ty);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={ref} className="console-lizard" style={{ display: "none" }} aria-hidden>
      <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
        {/* 꼬리 */}
        <path
          className="lizard-tail"
          d="M32 44 C 33 51, 28 54, 26 60"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* 다리 4개 — 대각선 짝(앞왼+뒷오 / 앞오+뒷왼)이 번갈아 젓는다 */}
        <path className="leg-fl" d="M27 26 C 21 24, 19 20, 17 16" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
        <path className="leg-fr" d="M37 26 C 43 24, 45 20, 47 16" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
        <path className="leg-bl" d="M28 40 C 22 42, 20 46, 19 50" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
        <path className="leg-br" d="M36 40 C 42 42, 44 46, 45 50" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
        {/* 몸통 + 머리 */}
        <ellipse cx="32" cy="33" rx="7" ry="12" fill="var(--accent)" />
        <ellipse cx="32" cy="17" rx="5.5" ry="6.5" fill="var(--accent)" />
        {/* 눈 */}
        <circle cx="29.5" cy="15" r="1.4" fill="var(--paper)" />
        <circle cx="34.5" cy="15" r="1.4" fill="var(--paper)" />
      </svg>
    </div>
  );
}
