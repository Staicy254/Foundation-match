"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

// Foundation Shade Match - Enhanced
// - Tailwind CSS assumed
// - Uses client-side canvas sampling and CIEDE2000 Delta-E in LAB
// - Attempts MediaPipe FaceMesh for cheek sampling (best-effort)
// - Framer Motion magical preloader

const FOUNDATIONS = [
  // --- Maybelline Fit Me ---
  { brand: "Maybelline Fit Me", shade: "110 Porcelain", hex: "#f8e4d8" },
  { brand: "Maybelline Fit Me", shade: "120 Classic Ivory", hex: "#f1d6c2" },
  { brand: "Maybelline Fit Me", shade: "128 Warm Nude", hex: "#e6c1a9" },
  { brand: "Maybelline Fit Me", shade: "220 Natural Beige", hex: "#d9b294" },
  { brand: "Maybelline Fit Me", shade: "228 Soft Tan", hex: "#cda280" },
  { brand: "Maybelline Fit Me", shade: "238 Rich Tan", hex: "#bc8f6c" },
  { brand: "Maybelline Fit Me", shade: "310 Sun Beige", hex: "#b88964" },
  { brand: "Maybelline Fit Me", shade: "330 Toffee", hex: "#8f5a3d" },
  { brand: "Maybelline Fit Me", shade: "355 Coconut", hex: "#6f4128" },
  { brand: "Maybelline Fit Me", shade: "375 Java", hex: "#4c2a1a" },

  // --- Black Opal True Color ---
  { brand: "Black Opal", shade: "Kalahari Sand", hex: "#f2dbc4" },
  { brand: "Black Opal", shade: "Heavenly Honey", hex: "#e1b68f" },
  { brand: "Black Opal", shade: "Nutmeg", hex: "#c98d65" },
  { brand: "Black Opal", shade: "Beautiful Bronze", hex: "#a86c48" },
  { brand: "Black Opal", shade: "Carob", hex: "#77442a" },
  { brand: "Black Opal", shade: "Espresso", hex: "#4d2b1a" },
  { brand: "Black Opal", shade: "Hazelnut", hex: "#b47c56" },
  { brand: "Black Opal", shade: "Truly Topaz", hex: "#d7a67b" },
  { brand: "Black Opal", shade: "Mocha", hex: "#5c3724" },
  { brand: "Black Opal", shade: "Soft Suede", hex: "#9c6b4a" },

  // --- Fenty Pro Filt’r ---
  { brand: "Fenty", shade: "100", hex: "#f6e6da" },
  { brand: "Fenty", shade: "150", hex: "#f1d5bf" },
  { brand: "Fenty", shade: "210", hex: "#e3bfa1" },
  { brand: "Fenty", shade: "240", hex: "#d1a47f" },
  { brand: "Fenty", shade: "290", hex: "#bb8b67" },
  { brand: "Fenty", shade: "330", hex: "#9f6a4c" },
  { brand: "Fenty", shade: "370", hex: "#7e4e34" },
  { brand: "Fenty", shade: "420", hex: "#663d29" },
  { brand: "Fenty", shade: "445", hex: "#4a2819" },
  { brand: "Fenty", shade: "498", hex: "#2d1a12" },
];

export default function FoundationShadeMatch() {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {
    // precompute LAB for foundation DB for faster runtime
    FOUNDATIONS.forEach((f) => {
      if (!f.lab) f.lab = rgbToLab(hexToRgb(f.hex));
    });
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setResult(null);
    await analyzeImage(url);
  }

  async function loadMediaPipeFaceMesh() {
    if (window.faceMeshLoaded) return window.faceMeshLoaded;
    try {
      const base = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh";
      await Promise.all([
        new Promise((res) => {
          if (document.querySelector('script[data-mp-face]')) return res();
          const s = document.createElement("script");
          s.src = `${base}/face_mesh.js`;
          s.setAttribute("data-mp-face", "1");
          s.onload = res;
          s.onerror = res;
          document.head.appendChild(s);
        }),
        new Promise((res) => {
          if (document.querySelector('script[data-mp-camera]')) return res();
          const s = document.createElement("script");
          s.src = `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js`;
          s.setAttribute("data-mp-camera", "1");
          s.onload = res;
          s.onerror = res;
          document.head.appendChild(s);
        }),
      ]);
      window.faceMeshLoaded = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  async function analyzeImage(src) {
    setLoading(true);
    try {
      const img = await loadImage(src);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const W = 400;
      const ratio = img.width / img.height;
      const H = Math.round(W / ratio);
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(img, 0, 0, W, H);

      let sampleBox = { x: W * 0.2, y: H * 0.35, w: W * 0.6, h: H * 0.25 };

      try {
        await loadMediaPipeFaceMesh();
        if (window.FaceMesh) {
          const faceMesh = new window.FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
          faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });
          const landmarks = await new Promise((resolve) => {
            faceMesh.onResults((results) => {
              if (results.multiFaceLandmarks && results.multiFaceLandmarks.length) resolve(results.multiFaceLandmarks[0]);
              else resolve(null);
            });
            faceMesh.send({ image: img }).catch(() => resolve(null));
          });

          if (landmarks) {
            const leftCheek = landmarks[234];
            const rightCheek = landmarks[454];
            if (leftCheek && rightCheek) {
              const lx = leftCheek.x * W;
              const ly = leftCheek.y * H;
              const rx = rightCheek.x * W;
              const ry = rightCheek.y * H;
              const cx = Math.round((lx + rx) / 2);
              const cy = Math.round((ly + ry) / 2);
              const boxW = Math.round(W * 0.18);
              const boxH = Math.round(H * 0.12);
              sampleBox = { x: cx - boxW / 2, y: cy - boxH / 2, w: boxW, h: boxH };
            }
          }
        }
      } catch (err) {
        // fallback silently
      }

      if (window.FaceDetector) {
        try {
          const fd = new window.FaceDetector();
          const faces = await fd.detect(canvas);
          if (faces?.length) {
            const f = faces[0].boundingBox;
            sampleBox = { x: f.x + f.width * 0.15, y: f.y + f.height * 0.5, w: f.width * 0.7, h: f.height * 0.3 };
          }
        } catch (err) {}
      }

      const sx = Math.max(0, Math.floor(sampleBox.x));
      const sy = Math.max(0, Math.floor(sampleBox.y));
      const sw = Math.max(1, Math.floor(sampleBox.w));
      const sh = Math.max(1, Math.floor(sampleBox.h));

      const pixels = ctx.getImageData(sx, sy, sw, sh).data;

      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3];
        if (a < 125) continue;
        const rr = pixels[i];
        const gg = pixels[i + 1];
        const bb = pixels[i + 2];
        const brightness = (rr + gg + bb) / 3;
        if (brightness < 20 || brightness > 240) continue;
        r += rr;
        g += gg;
        b += bb;
        count += 1;
      }

      if (count === 0) {
        setResult({ error: "Could not sample skin tones. Try a different photo." });
        setLoading(false);
        return;
      }

      const avg = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
      const lab = rgbToLab(avg);

      let best = null;
      FOUNDATIONS.forEach((f) => {
        const d = deltaE(lab, f.lab);
        if (!best || d < best.d) best = { ...f, d };
      });

      setResult({ sampledRgb: avg, match: best });
    } catch (err) {
      console.error(err);
      setResult({ error: "Analysis failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 p-6 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-6">
      <h1 className="text-2xl font-extrabold mb-2 text-[#000066]"> Foundation Shade Match </h1>
        <p className="text-sm text-gray-600 mb-4">Upload a selfie or photo. We'll analyze and suggest the closest foundation shade.</p>

        <label className="block mb-4">
          <input type="file" accept="image/*" capture="user" onChange={handleFile} className="hidden" id="imgUpload" />
          <div onClick={() => document.getElementById("imgUpload").click()} className="cursor-pointer rounded-lg border-dashed border-2 border-rose-200 p-6 text-center">
            {imageSrc ? (
              <img src={imageSrc} alt="uploaded" className="mx-auto max-h-60 rounded-md" />
            ) : (
              <div>
                <div className="text-sm text-gray-500">Tap to upload </div>
                <div className="mt-2 text-xs text-gray-400">(front-facing image works best)</div>
              </div>
            )}
          </div>
        </label>

        <div className="h-20 flex items-center">{loading ? <AnimatedLoader /> : <div className="h-4 w-full" />}</div>

        <div className="mt-4">
          {result?.error && <div className="text-red-500">{result.error}</div>}

          {result?.match && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg shadow-inner" style={{ background: result.match.hex }} />
                <div>
                  <div className="text-sm text-gray-500">Best match</div>
                  <div className="font-semibold">{result.match.brand} — {result.match.shade}</div>
                  <div className="text-xs text-gray-400">ΔE (CIEDE2000): {result.match.d.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Swatch label="Sampled" rgb={result.sampledRgb} />
                {FOUNDATIONS.slice(0, 2).map((f) => (
                  <div key={f.hex} className="text-center text-xs">
                    <div className="w-full h-12 rounded-md mb-1" style={{ background: f.hex }} />
                    <div className="truncate">{f.brand}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs text-gray-500">Tip: For best results use natural light.</div>

              <DeltaELegend value={result.match.d} />
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function Swatch({ label, rgb }) {
  const hex = rgbToHex(rgb);
  return (
    <div className="text-center text-xs">
      <div className="w-full h-12 rounded-md mb-1" style={{ background: hex }} />
      <div>{label}</div>
      <div className="text-gray-400 text-[10px]">{hex}</div>
    </div>
  );
}

function AnimatedLoader() {
  return (
    <div className="w-full flex items-center justify-center">
      <motion.div initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: [0.95, 1.05, 0.95], rotate: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-300 to-amber-300 shadow-xl flex items-center justify-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }} className="w-8 h-8 bg-white rounded-full opacity-90" />
      </motion.div>
    </div>
  );
}

function DeltaELegend({ value }) {
  const buckets = [
    { label: "Excellent", max: 1.0, color: "bg-green-400" },
    { label: "Very Good", max: 2.0, color: "bg-lime-400" },
    { label: "Good", max: 5.0, color: "bg-yellow-300" },
    { label: "Close", max: 10.0, color: "bg-orange-300" },
    { label: "Poor", max: Infinity, color: "bg-red-300" },
  ];
  const current = buckets.find((b) => value <= b.max);
  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-2">Match quality</div>
      <div className="flex items-center gap-3">
        <div className={`rounded-full w-3 h-3 ${current.color}`} />
        <div className="text-sm font-medium">{current.label}</div>
        <div className="text-xs text-gray-400 ml-2">ΔE: {value.toFixed(2)}</div>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-2 text-[10px] text-center">
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-col items-center">
            <div className={`w-full h-4 rounded ${b.color} opacity-90`} />
            <div className="mt-1">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Color utility helpers (RGB <-> LAB & Delta E CIE2000) ----------
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex({ r, g, b }) {
  return ("#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase());
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function rgbToXyz({ r, g, b }) {
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;
  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  return { X: X * 100, Y: Y * 100, Z: Z * 100 };
}

function xyzToLab({ X, Y, Z }) {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;
  let x = X / refX;
  let y = Y / refY;
  let z = Z / refZ;
  x = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;
  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return { L, a, b };
}

function rgbToLab(rgb) {
  return xyzToLab(rgbToXyz(rgb));
}

function deltaE00(lab1, lab2) {
  const deg2rad = (deg) => (deg * Math.PI) / 180;
  const rad2deg = (rad) => (rad * 180) / Math.PI;
  const L1 = lab1.L;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.L;
  const a2 = lab2.a;
  const b2 = lab2.b;
  const kL = 1;
  const kC = 1;
  const kH = 1;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const CppBar = (C1p + C2p) / 2;
  const h1p = Math.atan2(b1, a1p) >= 0 ? rad2deg(Math.atan2(b1, a1p)) : rad2deg(Math.atan2(b1, a1p)) + 360;
  const h2p = Math.atan2(b2, a2p) >= 0 ? rad2deg(Math.atan2(b2, a2p)) : rad2deg(Math.atan2(b2, a2p)) + 360;
  let dLp = L2 - L1;
  let dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else {
    let diff = h2p - h1p;
    if (Math.abs(diff) <= 180) dhp = diff;
    else if (diff > 180) dhp = diff - 360;
    else dhp = diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deg2rad(dhp / 2));
  const LpBar = (L1 + L2) / 2;
  const CpBar = CppBar;
  let hpBar = 0;
  if (C1p * C2p === 0) {
    hpBar = h1p + h2p;
  } else {
    let diff = Math.abs(h1p - h2p);
    if (diff > 180) {
      hpBar = (h1p + h2p + 360) / 2;
    } else {
      hpBar = (h1p + h2p) / 2;
    }
  }
  const T = 1 - 0.17 * Math.cos(deg2rad(hpBar - 30)) + 0.24 * Math.cos(deg2rad(2 * hpBar)) + 0.32 * Math.cos(deg2rad(3 * hpBar + 6)) - 0.2 * Math.cos(deg2rad(4 * hpBar - 63));
  const deltaTheta = 30 * Math.exp(-((hpBar - 275) / 25) * ((hpBar - 275) / 25));
  const Rc = 2 * Math.sqrt(Math.pow(CpBar, 7) / (Math.pow(CpBar, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(LpBar - 50, 2)) / Math.sqrt(20 + Math.pow(LpBar - 50, 2));
  const Sc = 1 + 0.045 * CpBar;
  const Sh = 1 + 0.015 * CpBar * T;
  const Rt = -Math.sin(deg2rad(2 * deltaTheta)) * Rc;
  const dE = Math.sqrt(Math.pow(dLp / (kL * Sl), 2) + Math.pow(dCp / (kC * Sc), 2) + Math.pow(dHp / (kH * Sh), 2) + Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh)));
  return dE;
}

function deltaE(labA, labB) {
  return deltaE00(labA, labB);
}
