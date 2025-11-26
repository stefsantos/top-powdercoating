import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

interface CoatingPreview3DProps {
  finish: 'matte' | 'glossy' | 'satin';
  texture: 'smooth' | 'textured' | 'hammered';
  color: string;
}

function CoatedPanel({ finish, texture, color }: CoatingPreview3DProps) {
  // Create normal map textures procedurally
  const normalMap = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Base neutral normal (pointing up)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, size, size);
    
    if (texture === 'textured') {
      // Subtle random bumps for textured surface
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const variation = (Math.random() - 0.5) * 30;
        data[i] = Math.min(255, Math.max(0, 128 + variation));     // R
        data[i + 1] = Math.min(255, Math.max(0, 128 + variation)); // G
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (texture === 'hammered') {
      // Dimpled pattern for hammered surface
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      // Create circular dimples
      const dimpleCount = 40;
      const dimples: { x: number; y: number; r: number }[] = [];
      
      for (let d = 0; d < dimpleCount; d++) {
        dimples.push({
          x: Math.random() * size,
          y: Math.random() * size,
          r: 8 + Math.random() * 16
        });
      }
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          
          let normalX = 128;
          let normalY = 128;
          
          for (const dimple of dimples) {
            const dx = x - dimple.x;
            const dy = y - dimple.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < dimple.r) {
              const strength = 1 - (dist / dimple.r);
              const angle = Math.atan2(dy, dx);
              normalX += Math.cos(angle) * strength * 60;
              normalY += Math.sin(angle) * strength * 60;
            }
          }
          
          data[idx] = Math.min(255, Math.max(0, normalX));
          data[idx + 1] = Math.min(255, Math.max(0, normalY));
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    
    const normalTexture = new THREE.CanvasTexture(canvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(2, 2);
    return normalTexture;
  }, [texture]);

  // Material properties based on finish type
  const materialProps = useMemo(() => {
    const baseColor = new THREE.Color(color || '#808080');
    
    switch (finish) {
      case 'matte':
        return {
          color: baseColor,
          roughness: 0.9,
          metalness: 0.1,
          normalMap: texture !== 'smooth' ? normalMap : undefined,
          normalScale: texture === 'hammered' ? new THREE.Vector2(1.5, 1.5) : new THREE.Vector2(0.5, 0.5),
        };
      case 'glossy':
        return {
          color: baseColor,
          roughness: 0.1,
          metalness: 0.3,
          normalMap: texture !== 'smooth' ? normalMap : undefined,
          normalScale: texture === 'hammered' ? new THREE.Vector2(1.2, 1.2) : new THREE.Vector2(0.4, 0.4),
          envMapIntensity: 1.5,
        };
      case 'satin':
        return {
          color: baseColor,
          roughness: 0.4,
          metalness: 0.2,
          normalMap: texture !== 'smooth' ? normalMap : undefined,
          normalScale: texture === 'hammered' ? new THREE.Vector2(1.3, 1.3) : new THREE.Vector2(0.45, 0.45),
          envMapIntensity: 0.8,
        };
      default:
        return {
          color: baseColor,
          roughness: 0.5,
          metalness: 0.1,
        };
    }
  }, [finish, texture, color, normalMap]);

  return (
    <mesh rotation={[-Math.PI / 6, 0, 0]} castShadow receiveShadow>
      {/* Rounded box to simulate a coated panel/plate */}
      <boxGeometry args={[3, 3, 0.3]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

export default function CoatingPreview3D({ finish, texture, color }: CoatingPreview3DProps) {
  return (
    <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 3, -3]} intensity={0.5} />
        <spotLight
          position={[0, 5, 0]}
          angle={0.5}
          penumbra={1}
          intensity={0.5}
          castShadow
        />
        
        {/* Environment for reflections */}
        <Environment preset="studio" />
        
        {/* The coated panel */}
        <CoatedPanel finish={finish} texture={texture} color={color} />
        
        {/* Orbit controls for interaction */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
