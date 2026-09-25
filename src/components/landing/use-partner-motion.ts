"use client";

import { useEffect, useRef } from "react";
import { advancePartnerMotion, clampPartnerVelocity, PARTNER_DRIFT_SPEED, wrapPartnerOffset } from "@/lib/partner-motion";

export function usePartnerMotion() {
  const sectionRef = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = windowRef.current;
    const track = trackRef.current;
    const group = track?.querySelector<HTMLElement>(".partners-marquee-group");
    if (!section || !viewport || !track || !group) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = group.getBoundingClientRect().width;
    let offset = 0;
    let hovering = section.matches(":hover") && matchMedia("(hover: hover)").matches;
    let focused = viewport.matches(":focus-visible");
    let velocity = hovering || focused ? 0 : PARTNER_DRIFT_SPEED;
    let visible = false;
    let frame = 0;
    let previousTime = 0;
    let drag: { id: number; x: number; time: number; velocity: number } | null = null;

    const render = () => { track.style.transform = `translate3d(${offset}px, 0, 0)`; };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };
    const active = () => visible && !document.hidden && !reducedMotion.matches && width > 0;
    const schedule = () => {
      if (!frame && active()) frame = requestAnimationFrame(tick);
    };
    function tick(time: number) {
      frame = 0;
      if (!active()) { previousTime = 0; return; }
      if (drag) { render(); previousTime = 0; return; }
      const seconds = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
      previousTime = time;
      const target = hovering || focused ? 0 : PARTNER_DRIFT_SPEED;
      const next = advancePartnerMotion(offset, velocity, target, seconds, width);
      offset = next.offset;
      velocity = Math.abs(next.velocity - target) < 0.5 ? target : next.velocity;
      render();
      // The first frame after a pause has dt=0; keep scheduling to accelerate
      // from rest when autoplay is available again.
      if (velocity !== 0 || target !== 0) schedule();
      else previousTime = 0;
    }
    const releaseCapture = () => {
      const pointerId = drag?.id;
      drag = null;
      delete viewport.dataset.dragging;
      if (pointerId !== undefined && viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
    };
    const cancelDrag = () => {
      releaseCapture();
      velocity = hovering || focused ? 0 : PARTNER_DRIFT_SPEED;
      stop();
      schedule();
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      hovering = true;
      if (!drag) { velocity = 0; stop(); }
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      hovering = false;
      schedule();
    };
    const down = (event: PointerEvent) => {
      if (!active() || drag || !event.isPrimary || event.button !== 0) return;
      if (event.pointerType === "mouse") event.preventDefault();
      stop();
      drag = { id: event.pointerId, x: event.clientX, time: event.timeStamp, velocity: 0 };
      velocity = 0;
      viewport.setPointerCapture(event.pointerId);
      viewport.dataset.dragging = "true";
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const delta = event.clientX - drag.x;
      const elapsed = Math.max(event.timeStamp - drag.time, 1);
      offset = wrapPartnerOffset(offset + delta, width);
      const sample = clampPartnerVelocity(delta / elapsed * 1000);
      drag.velocity = elapsed > 80 ? sample : drag.velocity * 0.25 + sample * 0.75;
      drag.x = event.clientX;
      drag.time = event.timeStamp;
      schedule();
    };
    const up = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      // Holding still before release is a stop, not a delayed fling.
      velocity = event.timeStamp - drag.time < 100 ? clampPartnerVelocity(drag.velocity) : 0;
      releaseCapture();
      render();
      schedule();
    };
    const lostCapture = () => { if (drag) cancelDrag(); };
    const focus = () => {
      focused = viewport.matches(":focus-visible");
      if (focused) { velocity = 0; stop(); }
    };
    const blur = () => { focused = false; schedule(); };
    const key = (event: KeyboardEvent) => {
      if (reducedMotion.matches || !["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
      event.preventDefault();
      stop();
      velocity = 0;
      offset = event.key === "Home" ? 0 : wrapPartnerOffset(offset + (event.key === "ArrowLeft" ? 184 : -184), width);
      render();
    };
    const visibility = () => {
      if (document.hidden) { releaseCapture(); velocity = hovering || focused ? 0 : PARTNER_DRIFT_SPEED; stop(); }
      else schedule();
    };
    const preference = () => {
      cancelDrag();
      offset = 0;
      render();
    };
    const resize = new ResizeObserver(() => {
      const nextWidth = group.getBoundingClientRect().width;
      offset = width > 0 ? wrapPartnerOffset(offset / width * nextWidth, nextWidth) : 0;
      width = nextWidth;
      render();
      schedule();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else { releaseCapture(); velocity = hovering || focused ? 0 : PARTNER_DRIFT_SPEED; stop(); }
    });

    viewport.dataset.enhanced = "true";
    resize.observe(group);
    intersection.observe(viewport);
    section.addEventListener("pointerenter", enter);
    section.addEventListener("pointerleave", leave);
    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", up);
    viewport.addEventListener("pointercancel", cancelDrag);
    viewport.addEventListener("lostpointercapture", lostCapture);
    viewport.addEventListener("focus", focus);
    viewport.addEventListener("blur", blur);
    viewport.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", preference);

    return () => {
      stop();
      resize.disconnect();
      intersection.disconnect();
      section.removeEventListener("pointerenter", enter);
      section.removeEventListener("pointerleave", leave);
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", cancelDrag);
      viewport.removeEventListener("lostpointercapture", lostCapture);
      viewport.removeEventListener("focus", focus);
      viewport.removeEventListener("blur", blur);
      viewport.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", preference);
      releaseCapture();
      delete viewport.dataset.enhanced;
      track.style.removeProperty("transform");
    };
  }, []);

  return { sectionRef, windowRef, trackRef };
}
