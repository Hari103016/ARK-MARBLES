
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { DoubleSide, SRGBColorSpace } from "three";

const GOLD = "#c9a45c";

function MarbleSlab({ image, autoRotate }) {
  const groupRef = useRef(null);
  const texture = useTexture(image);

  // Preserve the original marble image colours.
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;

  // Rotate the entire marble slab continuously.
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.55;
    }
  });

  const width = 3.8;
  const imageWidth = texture.image?.width || 1;
  const imageHeight = texture.image?.height || 1;
  const height = width / (imageWidth / imageHeight);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>

      {/* Layered marble copies for visible thickness */}
      {Array.from({ length: 8 }, (_, index) => (
        <mesh
          key={index}
          position={[0, 0, -0.012 * (index + 1)]}
          renderOrder={index}
        >
          <planeGeometry args={[width, height]} />

          <meshBasicMaterial
            map={texture}
            color="#ffffff"
            transparent
            alphaTest={0.05}
            side={DoubleSide}
            depthWrite={true}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Front marble surface */}
      <mesh position={[0, 0, 0.005]} renderOrder={10}>
        <planeGeometry args={[width, height]} />

        <meshBasicMaterial
          map={texture}
          color="#ffffff"
          transparent
          alphaTest={0.05}
          side={DoubleSide}
          depthWrite={true}
          toneMapped={false}
        />
      </mesh>

    </group>
  );
}

export default function Marble360Viewer({
  image = "/images/marbles/calacatta-gold.png",
  name = "Calacatta Gold Marble",
}) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <section
      style={{
        width: "100%",
        minHeight: "580px",
        padding: "24px",
        boxSizing: "border-box",
        borderRadius: "14px",
        background:
          "radial-gradient(ellipse at center, #57251f 0%, #260d0d 65%, #100707 100%)",
        border: "1px solid #8d6336",
        color: "#f5e6c8",
        overflow: "hidden",
      }}
    >
      {/* Viewer heading */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            color: GOLD,
            letterSpacing: "4px",
            fontSize: "11px",
          }}
        >
          ARK MARBLES • PREMIUM COLLECTION
        </div>

        <h2
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 400,
            fontSize: "27px",
            margin: "10px 0",
          }}
        >
          {name}
        </h2>

        <p
          style={{
            fontSize: "12px",
            color: "#d8c2a1",
          }}
        >
          360° Automatic Rotation • Matching Marble Colours
        </p>
      </div>

      {/* 3D marble viewer */}
      <div
        style={{
          width: "100%",
          height: "390px",
        }}
      >
        <Canvas
          camera={{
            position: [0, 0, 6],
            fov: 40,
          }}
          gl={{
            antialias: true,
            alpha: true,
          }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.5} />

          <MarbleSlab
            image={image}
            autoRotate={autoRotate}
          />

          <OrbitControls
            enablePan={false}
            enableRotate={false}
            enableZoom={true}
            minDistance={4}
            maxDistance={8}
          />
        </Canvas>
      </div>

      {/* Rotation control */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "15px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setAutoRotate((value) => !value)
          }
          style={{
            padding: "12px 30px",
            border: `1px solid ${GOLD}`,
            borderRadius: "6px",
            background: GOLD,
            color: "#21110d",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {autoRotate
            ? "Pause Rotation"
            : "Start Rotation"}
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          color: GOLD,
          fontSize: "12px",
          marginTop: "18px",
        }}
      >
        ✦ LUXURY • QUALITY • ELEGANCE ✦
      </p>
    </section>
  );
}
