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
  // Create normal map textures procedurally with seeded random for consistency
  const normalMap = useMemo(() => {
    if (texture === 'smooth') {
      return null;
    }
    
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Base neutral normal (pointing up)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, size, size);
    
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    if (texture === 'textured') {
      // Seeded random for consistent texture
      const seed = 12345;
      let seedValue = seed;
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };
      
      // Subtle random bumps for textured surface
      for (let i = 0; i < data.length; i += 4) {
        const variation = (seededRandom() - 0.5) * 50;
        data[i] = Math.min(255, Math.max(0, 128 + variation));     // R
        data[i + 1] = Math.min(255, Math.max(0, 128 + variation)); // G
      }
    } else if (texture === 'hammered') {
      // Seeded random for consistent dimples
      const seed = 54321;
      let seedValue = seed;
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };
      
      // Create circular dimples
      const dimpleCount = 50;
      const dimples: { x: number; y: number; r: number }[] = [];
      
      for (let d = 0; d < dimpleCount; d++) {
        dimples.push({
          x: seededRandom() * size,
          y: seededRandom() * size,
          r: 10 + seededRandom() * 20
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
              const strength = Math.pow(1 - (dist / dimple.r), 0.5);
              const angle = Math.atan2(dy, dx);
              normalX += Math.cos(angle) * strength * 80;
              normalY += Math.sin(angle) * strength * 80;
            }
          }
          
          data[idx] = Math.min(255, Math.max(0, normalX));
          data[idx + 1] = Math.min(255, Math.max(0, normalY));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const normalTexture = new THREE.CanvasTexture(canvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(3, 3);
    normalTexture.needsUpdate = true;
    return normalTexture;
  }, [texture]);

  // Material properties based on finish type
  const materialProps = useMemo(() => {
    const baseColor = new THREE.Color(color || '#808080');
    
    const baseProps: {
      color: THREE.Color;
      roughness: number;
      metalness: number;
      normalMap?: THREE.CanvasTexture | null;
      normalScale?: THREE.Vector2;
      envMapIntensity?: number;
    } = {
      color: baseColor,
      roughness: 0.5,
      metalness: 0.1,
    };
    
    switch (finish) {
      case 'matte':
        baseProps.roughness = 0.9;
        baseProps.metalness = 0.05;
        break;
      case 'glossy':
        baseProps.roughness = 0.1;
        baseProps.metalness = 0.4;
        baseProps.envMapIntensity = 1.5;
        break;
      case 'satin':
        baseProps.roughness = 0.4;
        baseProps.metalness = 0.2;
        baseProps.envMapIntensity = 0.8;
        break;
    }
    
    // Apply normal map based on texture
    if (normalMap && texture !== 'smooth') {
      baseProps.normalMap = normalMap;
      baseProps.normalScale = texture === 'hammered' 
        ? new THREE.Vector2(2, 2) 
        : new THREE.Vector2(0.8, 0.8);
    }
    
    return baseProps;
  }, [finish, texture, color, normalMap]);

  return (
    <mesh 
      key={`${finish}-${texture}-${color}`}
      rotation={[-Math.PI / 6, 0, 0]} 
      castShadow 
      receiveShadow
    >
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
