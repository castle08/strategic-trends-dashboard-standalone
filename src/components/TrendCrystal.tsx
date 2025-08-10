import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { TrendItem, getCategoryColor } from '../types';
import * as THREE from 'three';

interface TrendCrystalProps {
  trend: TrendItem;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  anyTrendSelected?: boolean;
}

const TrendCrystal: React.FC<TrendCrystalProps> = ({ trend, position, selected, onSelect, anyTrendSelected = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Dynamic size scaling based on actual live data range
  const minScore = 50; // Much wider range to handle live data variety
  const maxScore = 100; // Full theoretical range
  const normalizedScore = Math.max(0, Math.min(1, (trend.scores.total - minScore) / (maxScore - minScore)));
  // Reasonable scaling with clear differences
  const adjustedSize = 1.0 + (normalizedScore * 4.0); // Range 1.0 to 5.0 (5x difference)
  
  // Debug logging to see actual scores
  console.log(`📊 ${trend.category} (${trend.scores.total}) -> Size: ${adjustedSize.toFixed(1)}`);
  const intensity = trend.viz.intensity;
  
  // Use T&P Group category colors
  const categoryColor = getCategoryColor(trend.category);
  const color = new THREE.Color(categoryColor);

  // Shape based on category - using adjusted size for better visual distinction
  const getGeometry = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ai/ml':
      case 'ai':
        return <dodecahedronGeometry args={[adjustedSize, 0]} />; // Complex AI shape
      case 'sustainability':
      case 'design':
        return <tetrahedronGeometry args={[adjustedSize * 1.2, 0]} />; // Clean pyramid for design
      case 'e-commerce':
      case 'technology':
        return <boxGeometry args={[adjustedSize * 1.2, adjustedSize * 1.2, adjustedSize * 1.2]} />; // Cube for tech
      case 'social media':
        return <sphereGeometry args={[adjustedSize, 16, 16]} />; // Sphere for social
      default:
        return <octahedronGeometry args={[adjustedSize, 0]} />; // Default crystal
    }
  };

  const getWireframeGeometry = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ai/ml':
      case 'ai':
        return <dodecahedronGeometry args={[adjustedSize * 1.02, 0]} />;
      case 'sustainability':
      case 'design':
        return <tetrahedronGeometry args={[adjustedSize * 1.22, 0]} />;
      case 'e-commerce':
      case 'technology':
        return <boxGeometry args={[adjustedSize * 1.22, adjustedSize * 1.22, adjustedSize * 1.22]} />;
      case 'social media':
        return <sphereGeometry args={[adjustedSize * 1.02, 16, 16]} />;
      default:
        return <octahedronGeometry args={[adjustedSize * 1.02, 0]} />;
    }
  };


  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const pulseScale = 1 + Math.sin(time * intensity * 0.5) * 0.05;
      const selectedScale = selected ? 1.3 : 1;
      const hoverScale = hovered ? 1.15 : 1;
      
      meshRef.current.scale.setScalar(pulseScale * selectedScale * hoverScale);
      
      // Gentle rotation - slowed down
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.0015;
      meshRef.current.rotation.z += 0.0005;
    }
  });

  return (
    <group position={position}>
      {/* Main crystal shape */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Solid shape for category - visible fill */}
        {getGeometry(trend.category)}
        <meshPhongMaterial
          color={color}
          transparent
          opacity={0.3}
          shininess={100}
        />
      </mesh>
      
      
      {/* Multiple wireframe overlays for much thicker borders - all interactive */}
      {[0, 0.3, 0.6, 0.9, 1.2, 1.5].map((offset, i) => (
        <mesh 
          key={i} 
          scale={[1 + offset * 0.008, 1 + offset * 0.008, 1 + offset * 0.008]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          {getWireframeGeometry(trend.category)}
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.8 - i * 0.12}
          />
        </mesh>
      ))}
      
      {/* Floating text label */}
      {(hovered || selected) && (
        <Html
          as="div"
          center
          transform
          sprite
          style={{
            pointerEvents: 'none',
            transform: 'translate3d(0, -60px, 0)',
          }}
        >
          <div className="glass-panel rounded-xl p-4 text-white max-w-sm">
            <div className="font-bold mb-2 text-lg">{trend.title}</div>
            <div className="text-white/80 text-sm mb-2">{trend.category}</div>
            <div className="text-white/60 text-sm">
              Impact Score: {Math.round(trend.scores.total)}
            </div>
            {selected && (
              <div className="mt-3 text-white/90 text-sm">
                {trend.whyItMatters.slice(0, 120)}...
              </div>
            )}
          </div>
        </Html>
      )}
      
      
      {/* Particle effects for velocity */}
      {trend.scores.velocity > 70 && (
        <points>
          <sphereGeometry args={[adjustedSize * 2, 8, 8]} />
          <pointsMaterial
            color={color}
            size={0.1}
            transparent
            opacity={0.4}
          />
        </points>
      )}
    </group>
  );
};

export default TrendCrystal;