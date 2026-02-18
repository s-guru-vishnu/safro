import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment } from '@react-three/drei';

const Shield = (props) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group {...props} ref={meshRef}>
            {/* Shield Base */}
            <mesh>
                <torusGeometry args={[1.5, 0.4, 16, 100]} />
                <meshStandardMaterial color="#14B8A6" metalness={0.8} roughness={0.2} emissive="#0d9488" emissiveIntensity={0.2} />
            </mesh>

            {/* Inner Core */}
            <mesh>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Floating Particles */}
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh position={[2, 1, 0]}>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial color="#14B8A6" emissive="#14B8A6" emissiveIntensity={2} toneMapped={false} />
                </mesh>
                <mesh position={[-2, -1, 0.5]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#F472B6" emissive="#F472B6" emissiveIntensity={2} toneMapped={false} />
                </mesh>
            </Float>
        </group>
    );
};

const Hero3D = () => {
    return (
        <div className="w-full h-full min-h-[400px]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#14B8A6" />
                <Float speed={4} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Shield />
                </Float>
            </Canvas>
        </div>
    );
};

export default Hero3D;
