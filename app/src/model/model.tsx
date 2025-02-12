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

import adjacencyGraph from '../../../data_dump/adjacency_graph.json';
import edgeMetadata from '../../../data_dump/adjacency_graph_edge_metadata.json';

/**
 * Filters the adjacency graph to only include concave connections.
 */
function buildConcaveAdjacencyGraph(): Record<string, string[]> {
  const concaveGraph: Record<string, string[]> = {};

  for (const entityId in adjacencyGraph) {
    concaveGraph[entityId] = [];

    for (const neighbor of adjacencyGraph[entityId]) {
      const edgeKey1 = `${entityId}-${neighbor}`;
      const edgeKey2 = `${neighbor}-${entityId}`;

      // Check if the edge is marked as "concave" in the metadata
      if (
        (edgeMetadata[edgeKey1] &&
          edgeMetadata[edgeKey1].includes('concave')) ||
        (edgeMetadata[edgeKey2] && edgeMetadata[edgeKey2].includes('concave'))
      ) {
        concaveGraph[entityId].push(neighbor);
      }
    }
  }

  return concaveGraph;
}

// ✅ Run once and store the filtered concave adjacency graph

export const Model = (): JSX.Element => {
  const [modelEnts, setModelEnts] = useState<ModelEntity[]>([]);

  useEffect(() => {
    new GLTFLoader().load('./colored_glb.glb', (gltf) => {
      const newModelEntities: ModelEntity[] = [];
      const concaveAdjacencyGraph = buildConcaveAdjacencyGraph();
      console.log(concaveAdjacencyGraph); // Debugging: Check if it looks right
      gltf.scene.traverse((element) => {
        if (element.type !== 'Mesh') return;
        const meshElement = element as THREE.Mesh;

        const material = meshElement.material as THREE.MeshStandardMaterial;
        const color = material.color;

        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        const rgbString = `${r}-${g}-${b}`;

        const entityId = colorMap[rgbString];

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
