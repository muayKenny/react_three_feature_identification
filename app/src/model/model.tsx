import './model.css';

import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';

interface ModelEntity {
  bufferGeometry: THREE.BufferGeometry;
  color: string;
}

import colorMap from '../../../data_dump/rgb_id_to_entity_id_map.json';

export const Model = (): JSX.Element => {
  const [modelEnts, setModelEnts] = useState<ModelEntity[]>([]);

  useEffect(() => {
    new GLTFLoader().load('./colored_glb.glb', (gltf) => {
      const newModelEntities: ModelEntity[] = [];

      gltf.scene.traverse((element) => {
        if (element.type !== 'Mesh') return;
        const meshElement = element as THREE.Mesh;

        // Extract RGB color from material
        const material = meshElement.material as THREE.MeshStandardMaterial;
        const color = material.color; // THREE.Color object

        // Convert THREE.Color to RGB integer format
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        const rgbString = `${r}-${g}-${b}`;

        // Lookup entityId using rgbString
        const entityId = colorMap[rgbString];

        // Use a fallback color if the entity isn't found
        const finalColor = entityId
          ? `rgb(${r}, ${g}, ${b})`
          : 'rgb(120, 120, 120)';

        newModelEntities.push({
          bufferGeometry: meshElement.geometry as THREE.BufferGeometry,
          color: finalColor,
        });
      });

      setModelEnts(newModelEntities);
    });
  }, []);

  return (
    <div className='canvas-container'>
      <Canvas camera={{ position: [0, 0, 300] }}>
        <ambientLight />
        <OrbitControls makeDefault />
        <group>
          {modelEnts.map((ent, index) => (
            <mesh geometry={ent.bufferGeometry} key={index}>
              <meshStandardMaterial color={ent.color} />
            </mesh>
          ))}
        </group>
      </Canvas>
    </div>
  );
};
