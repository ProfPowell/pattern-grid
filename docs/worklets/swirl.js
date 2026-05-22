// docs/worklets/swirl.js
// A demonstration Paint Worklet for <pattern-grid> showcase piece #41.
// Reads --hue and (optionally) --rand-0 from the painted element and renders
// a per-cell swirl using the Canvas 2D API.

class SwirlPainter {
  static get inputProperties() {
    return ['--hue', '--rand-0'];
  }

  paint(ctx, geom, properties) {
    const hue = parseFloat(properties.get('--hue').toString()) || 0;
    const rand = parseFloat(properties.get('--rand-0').toString()) || 0.5;
    const { width: w, height: h } = geom;
    const cx = w / 2, cy = h / 2;
    const arms = 4 + Math.floor(rand * 4); // 4..7
    const maxR = Math.hypot(cx, cy);

    ctx.fillStyle = `hsl(${hue}, 60%, 12%)`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 80; i++) {
      const t = i / 80;
      const r = t * maxR;
      const a = t * Math.PI * 2 * arms + rand * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const light = 30 + (1 - t) * 50;
      ctx.fillStyle = `hsl(${(hue + t * 60) % 360}, 80%, ${light}%)`;
      ctx.beginPath();
      ctx.arc(x, y, (1 - t) * w * 0.08 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

registerPaint('swirl', SwirlPainter);
