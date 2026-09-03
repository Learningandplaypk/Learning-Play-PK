"use client";

import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Environment, Lightformer, PerformanceMonitor, AdaptiveDpr, RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { damp3, dampE } from "maath/easing";
import { scrollState } from "@/lib/scroll-state";
import { usePlayer } from "@/lib/store";

/* ================= helpers ================= */

function glyphTexture(text: string, color: string, sub?: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = color;
  g.shadowColor = color;
  g.shadowBlur = 28;
  g.font = "bold 130px 'Space Grotesk', system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, sub ? 108 : 128);
  if (sub) {
    g.font = "600 44px system-ui, sans-serif";
    g.shadowBlur = 14;
    g.fillText(sub, 128, 190);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

function useLowSpec() {
  const lowQuality = usePlayer((s) => s.lowQuality);
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    setMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
  }, []);
  return { low: lowQuality || mobile, mobile };
}

/* ================= starfield ================= */

function Starfield({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color("#2d7cff"), new THREE.Color("#b026ff"), new THREE.Color("#39ff14"), new THREE.Color("#ff2e97"), new THREE.Color("#f4f6ff")];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = -Math.random() * 200 + 20;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // scroll velocity stretches the field — warp feel inside the tunnel
    ref.current.position.z += delta * 2 + scrollState.progress * delta * 14;
    if (ref.current.position.z > 40) ref.current.position.z = -60;
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.13} vertexColors sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ================= fresnel atmosphere ================= */

const atmosphereVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const atmosphereFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
    gl_FragColor = vec4(uColor, f * 0.9);
  }
`;

function Atmosphere({ radius, color, power = 2.6 }: { radius: number; color: string; power?: number }) {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uPower: { value: power } }), [color, power]);
  return (
    <mesh scale={1.0}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial vertexShader={atmosphereVert} fragmentShader={atmosphereFrag} uniforms={uniforms} transparent blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

/* ================= hero: globe + orbiters ================= */

function Glyphs() {
  const data = useMemo(
    () => [
      { t: "A", c: "#39ff14" },
      { t: "ب", c: "#2d7cff" },
      { t: "한", c: "#b026ff" },
      { t: "あ", c: "#ff2e97" },
      { t: "中", c: "#ff7a00" },
      { t: "Ç", c: "#39ff14" },
    ],
    []
  );
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.16;
  });
  return (
    <group ref={group}>
      {data.map((d, i) => {
        const a = (i / data.length) * Math.PI * 2;
        const r = 3.6;
        return (
          <Billboard key={i} position={[Math.cos(a) * r, Math.sin(a * 2) * 0.9, Math.sin(a) * r]}>
            <mesh>
              <planeGeometry args={[1.05, 1.05]} />
              <meshBasicMaterial map={glyphTexture(d.t, d.c)} transparent depthWrite={false} />
            </mesh>
          </Billboard>
        );
      })}
    </group>
  );
}

function Controller(props: React.ComponentProps<"group">) {
  return (
    <group {...props}>
      <RoundedBox args={[1.7, 1, 0.5]} radius={0.24} smoothness={4}>
        <meshPhysicalMaterial color="#12142a" roughness={0.25} clearcoat={1} clearcoatRoughness={0.2} />
      </RoundedBox>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, -0.05, 0.05]}>
          <cylinderGeometry args={[0.16, 0.2, 0.55, 20]} />
          <meshStandardMaterial color="#0b0d1c" roughness={0.4} />
        </mesh>
      ))}
      {[[-0.35, 0.18, "#39ff14"], [-0.12, 0.18, "#ff2e97"], [0.12, 0.18, "#2d7cff"], [0.35, 0.18, "#b026ff"]].map(([x, y, c], i) => (
        <mesh key={i} position={[x as number, y as number, 0.27]}>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 16]} />
          <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Books(props: React.ComponentProps<"group">) {
  const colors = ["#b026ff", "#2d7cff", "#39ff14"];
  return (
    <group {...props}>
      {colors.map((c, i) => (
        <RoundedBox key={i} args={[1.5 - i * 0.12, 0.22, 1.05 - i * 0.1]} radius={0.05} position={[0, i * 0.26, 0]} rotation={[0, i * 0.35 - 0.3, 0]}>
          <meshPhysicalMaterial color={c} roughness={0.3} clearcoat={0.8} emissive={c} emissiveIntensity={0.22} />
        </RoundedBox>
      ))}
    </group>
  );
}

function GlobeGroup({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const wire = useRef<THREE.LineSegments>(null);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const want = visible ? 1 : 0;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, want, 4, delta));
    g.visible = g.scale.x > 0.02;
    g.rotation.y += delta * 0.06;
    if (wire.current) wire.current.rotation.y -= delta * 0.1;
    damp3(g.position, [Math.sin(state.clock.elapsedTime * 0.4) * 0.15, Math.sin(state.clock.elapsedTime * 0.55) * 0.2, 0], 0.4, delta);
  });
  return (
    <group ref={group} position={[0, 0.2, 0]}>
      {/* occluder core */}
      <mesh>
        <sphereGeometry args={[1.98, 48, 48]} />
        <meshStandardMaterial color="#070818" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* dotted surface */}
      <points ref={wire}>
        <sphereGeometry args={[2.02, 40, 28]} />
        <pointsMaterial size={0.045} color="#2d7cff" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
      </points>
      <Atmosphere radius={2.5} color="#2d7cff" />
      <Atmosphere radius={2.22} color="#b026ff" power={3.4} />
      <Glyphs />
      <Floaty>
        <Controller position={[3.1, 1.35, 0.6]} rotation={[0.2, -0.5, 0.12]} scale={0.85} />
        <Books position={[-3.3, 1.15, 0.4]} />
      </Floaty>
    </group>
  );
}

function Floaty({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    dampE(ref.current.rotation, [Math.sin(state.clock.elapsedTime * 0.5) * 0.1, Math.sin(state.clock.elapsedTime * 0.35) * 0.2, 0], 0.5, delta);
  });
  return <group ref={ref}>{children}</group>;
}

/* ================= tunnel rings ================= */

function Tunnel({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const rings = useMemo(() => {
    const arr: { z: number; c: string }[] = [];
    for (let i = 0; i < 14; i++) arr.push({ z: -6 - i * 2.6, c: i % 3 === 0 ? "#39ff14" : i % 3 === 1 ? "#2d7cff" : "#b026ff" });
    return arr;
  }, []);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.visible = visible;
    if (!visible) return;
    g.children.forEach((child, i) => {
      child.rotation.z += delta * (0.3 + i * 0.04) * (i % 2 === 0 ? 1 : -1);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4 + i * 0.7) * 0.05;
      child.scale.setScalar(pulse);
    });
  });
  return (
    <group ref={group} visible={false}>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, 0, r.z]} rotation={[0, 0, i * 0.4]}>
          <torusGeometry args={[2.7, 0.022, 8, 64]} />
          <meshBasicMaterial color={r.c} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ================= zones ================= */

function BrainScene(props: React.ComponentProps<"group">) {
  const inner = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (inner.current) {
      const s = 0.62 + Math.sin(state.clock.elapsedTime * 3.2) * 0.06;
      inner.current.scale.setScalar(THREE.MathUtils.damp(inner.current.scale.x, s, 8, delta));
      inner.current.rotation.y += delta * 0.4;
    }
  });
  return (
    <group {...props}>
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#b026ff" wireframe transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ff2e97" emissive="#ff2e97" emissiveIntensity={0.9} roughness={0.3} toneMapped={false} />
      </mesh>
      <Atmosphere radius={1.5} color="#b026ff" power={3} />
    </group>
  );
}

function QuizScene(props: React.ComponentProps<"group">) {
  const cube = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => glyphTexture("?", "#39ff14"), []);
  useFrame((_, delta) => {
    if (cube.current) {
      cube.current.rotation.x += delta * 0.7;
      cube.current.rotation.y += delta * 0.9;
    }
  });
  return (
    <group {...props}>
      {[
        [-1.1, 0, 1.0],
        [0, 0.42, 0],
        [1.1, 0, 1.0],
      ].map(([x, y, h], i) => (
        <group key={i} position={[x, (h as number) / 2 - 0.7, 0]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.58, h as number, 28]} />
            <meshPhysicalMaterial color="#12142a" roughness={0.22} clearcoat={1} metalness={0.55} />
          </mesh>
          <mesh position={[0, (h as number) / 2 + 0.02, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.05, 28]} />
            <meshBasicMaterial color={i === 1 ? "#39ff14" : "#2d7cff"} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh ref={cube} position={[0, 1.5, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#0b0d1c" emissiveMap={tex} emissive="#ffffff" emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ArcadeScene(props: React.ComponentProps<"group">) {
  const screen = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 160;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 128, 160);
    grad.addColorStop(0, "#2d7cff");
    grad.addColorStop(0.5, "#b026ff");
    grad.addColorStop(1, "#ff2e97");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = "rgba(0,0,0,0.35)";
    for (let y = 0; y < 160; y += 6) g.fillRect(0, y, 128, 2.5);
    g.fillStyle = "#39ff14";
    g.fillRect(24, 108, 16, 16);
    g.fillRect(56, 84, 16, 16);
    g.fillRect(88, 60, 16, 16);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <group {...props}>
      <RoundedBox args={[1.5, 2.3, 0.9]} radius={0.08} position={[0, 0.2, 0]}>
        <meshPhysicalMaterial color="#12142a" roughness={0.25} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, 0.55, 0.46]}>
        <planeGeometry args={[1.12, 1.3]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.48, 0.46]}>
        <planeGeometry args={[1.3, 0.3]} />
        <meshBasicMaterial color="#39ff14" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.8, 1.4]} intensity={6} color="#b026ff" distance={5} />
    </group>
  );
}

function LettersCloud(props: React.ComponentProps<"group">) {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(() => {
    const glyphs = [
      { t: "A", c: "#39ff14" },
      { t: "ب", c: "#2d7cff" },
      { t: "한", c: "#b026ff" },
      { t: "あ", c: "#ff2e97" },
    ];
    return Array.from({ length: 14 }, (_, i) => ({
      ...glyphs[i % glyphs.length],
      p: [(Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.6] as [number, number, number],
      s: 0.35 + Math.random() * 0.3,
    }));
  }, []);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.22;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
  });
  return (
    <group ref={group} {...props}>
      {items.map((it, i) => (
        <Billboard key={i} position={it.p}>
          <mesh scale={it.s}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={glyphTexture(it.t, it.c)} transparent depthWrite={false} />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}

function ZonesGroup() {
  return (
    <group>
      <BrainScene position={[0, 0, -62]} />
      <LettersCloud position={[0, 0, -70]} />
      <QuizScene position={[0, 0, -78]} />
      <ArcadeScene position={[0, 0, -86]} />
    </group>
  );
}

/* ================= gamification: metallic badges ================= */

function BadgesGroup({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const metals = [
    { c: "#ff2e97", x: -2.2 },
    { c: "#39ff14", x: 0 },
    { c: "#ff7a00", x: 2.2 },
  ];
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.visible = visible;
    if (!visible) return;
    g.children.forEach((m, i) => {
      m.rotation.y += delta * (0.8 + i * 0.2);
      m.position.y = Math.sin(state.clock.elapsedTime * 1.4 + i * 2) * 0.18;
    });
  });
  return (
    <group ref={group} position={[0, 0.2, -104]} visible={false}>
      {metals.map((m, i) => (
        <group key={i} position={[m.x, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.62, 0.13, 24, 48]} />
            <meshPhysicalMaterial color={m.c} metalness={1} roughness={0.16} clearcoat={1} envMapIntensity={1.6} />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[0.58, 48]} />
            <meshPhysicalMaterial color={m.c} metalness={0.9} roughness={0.22} envMapIntensity={1.4} />
          </mesh>
        </group>
      ))}
      {/* XP ring */}
      <mesh position={[0, -1.6, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.9, 0.05, 12, 80]} />
        <meshBasicMaterial color="#39ff14" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ================= language panels ================= */

function LangPanels({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const langs = [
    { flag: "🇬🇧", name: "English", c: "#2d7cff" },
    { flag: "🇸🇦", name: "Arabic", c: "#39ff14" },
    { flag: "🇹🇷", name: "Turkish", c: "#ff2e97" },
    { flag: "🇨🇳", name: "Chinese", c: "#ff7a00" },
    { flag: "🇫🇷", name: "French", c: "#2d7cff" },
    { flag: "🇪🇸", name: "Spanish", c: "#ff7a00" },
    { flag: "🇰🇷", name: "Korean", c: "#b026ff" },
    { flag: "🇯🇵", name: "Japanese", c: "#ff2e97" },
  ];
  const textures = useMemo(() => langs.map((l) => glyphTexture(l.flag, "#ffffff", l.name)), [langs]);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.visible = visible;
    if (!visible) return;
    g.rotation.y += delta * 0.12;
  });
  return (
    <group ref={group} position={[0, 0.2, -136]} visible={false}>
      {langs.map((l, i) => {
        const a = (i / langs.length) * Math.PI * 2;
        return (
          <Billboard key={l.name} position={[Math.cos(a) * 4.6, Math.sin(a * 2) * 0.6, Math.sin(a) * 4.6]}>
            <mesh>
              <planeGeometry args={[1.35, 1.35]} />
              <meshBasicMaterial map={textures[i]} transparent depthWrite={false} />
            </mesh>
          </Billboard>
        );
      })}
    </group>
  );
}

/* ================= camera rig ================= */

type Anchor = { pos: THREE.Vector3; look: THREE.Vector3 };

function buildAnchors(): Anchor[] {
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  return [
    { pos: V(0, 0.35, 9.2), look: V(0, 0.2, 0) },        // hero
    { pos: V(0, 0.2, 1.5), look: V(0, 0, -12) },         // tunnel start (through globe)
    { pos: V(0, 0.1, -44), look: V(0, 0, -52) },         // tunnel end
    { pos: V(0, 0.3, -56), look: V(0, 0, -62) },         // zones 1..4 handled by flying
    { pos: V(0, 0.3, -64), look: V(0, 0, -70) },
    { pos: V(0, 0.3, -72), look: V(0, 0, -78) },
    { pos: V(0, 0.3, -80), look: V(0, 0, -86) },
    { pos: V(0, 0.4, -96), look: V(0, 0.2, -104) },      // gamification
    { pos: V(0, 0.3, -127), look: V(0, 0.2, -136) },     // languages
    { pos: V(0, 1.6, -142), look: V(0, -0.4, -136) },    // outro drift
  ];
}

function CameraRig({ sections }: { sections: number[] }) {
  const camera = useThree((s) => s.camera);
  const anchors = useMemo(buildAnchors, []);
  const lookTarget = useRef(new THREE.Vector3(0, 0.2, 0));
  const reduced = useRef(false);

  React.useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useFrame((state, delta) => {
    const p = scrollState.progress;
    // map global progress to anchor space using measured section boundaries
    const idx = segmentFor(sections, p);
    const local = localT(sections, p, idx);
    const a = anchors[Math.min(idx, anchors.length - 1)];
    const b = anchors[Math.min(idx + 1, anchors.length - 1)];
    const eased = reduced.current ? 1 : smooth(local);
    const pos = a.pos.clone().lerp(b.pos, eased);
    const look = a.look.clone().lerp(b.look, eased);
    // mouse parallax drift
    const mx = scrollState.mx * 0.55;
    const my = scrollState.my * 0.35;
    pos.x += mx;
    pos.y += my;
    if (reduced.current) {
      camera.position.copy(pos);
    } else {
      damp3(camera.position as THREE.Vector3, pos, 0.28, delta);
      damp3(lookTarget.current, look, 0.28, delta);
    }
    camera.lookAt(lookTarget.current);
  });
  return null;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** measured section boundaries (fractions of total scroll) */
function segmentFor(sections: number[], p: number): number {
  for (let i = 0; i < sections.length - 1; i++) if (p >= sections[i] && p < sections[i + 1]) return i;
  return sections.length - 2;
}
function localT(sections: number[], p: number, idx: number): number {
  const s = sections[idx];
  const e = sections[idx + 1];
  return e > s ? THREE.MathUtils.clamp((p - s) / (e - s), 0, 1) : 1;
}

/* ================= main scene ================= */

export function Scene3D({ sections }: { sections: number[] }) {
  const { low } = useLowSpec();
  const [degraded, setDegraded] = React.useState(false);
  const starCount = low ? 2600 : degraded ? 4200 : 7000;
  const heroVisible = useRef(true);

  // hero group fades out after tunnel begins
  const [flags, setFlags] = React.useState({ hero: true, tunnel: false, zones: false, badges: false, langs: false });
  React.useEffect(() => {
    const iv = setInterval(() => {
      const p = scrollState.progress;
      setFlags((f) => ({
        hero: p < 0.16,
        tunnel: p > 0.1 && p < 0.42,
        zones: p > 0.36 && p < 0.72,
        badges: p > 0.68 && p < 0.86,
        langs: p > 0.82,
      }));
      heroVisible.current = p < 0.16;
    }, 220);
    return () => clearInterval(iv);
  }, []);

  return (
    <Canvas
      className="fixed inset-0 z-0"
      dpr={low ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 260, position: [0, 0.35, 9.2] }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDegraded(true)} />
      <AdaptiveDpr pixelated={false} />
      <fogExp2 attach="fog" args={["#05060f", 0.032]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 6, 8]} intensity={40} color="#2d7cff" />
      <pointLight position={[-8, -4, 6]} intensity={30} color="#b026ff" />
      <Starfield count={starCount} />
      <GlobeGroup visible={flags.hero} />
      <Tunnel visible={flags.tunnel} />
      <ZonesGroup />
      <BadgesGroup visible={flags.badges} />
      <LangPanels visible={flags.langs} />
      <CameraRig sections={sections} />
      <Environment resolution={low ? 32 : 64}>
        <Lightformer intensity={2.4} color="#2d7cff" position={[0, 5, -9]} scale={[10, 10, 1]} />
        <Lightformer intensity={1.8} color="#b026ff" position={[-5, 1, -1]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.8} color="#39ff14" position={[10, 1, 0]} scale={[8, 2, 1]} />
      </Environment>
      {!low && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.22} luminanceSmoothing={0.3} />
          <ChromaticAberration offset={[0.00045, 0.00045]} radialModulation={false} modulationOffset={0} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.18} darkness={0.82} />
        </EffectComposer>
      )}
      {low && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.3} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
