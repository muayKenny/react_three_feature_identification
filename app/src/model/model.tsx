import './model.css';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls, Text } from '@react-three/drei';
import { Canvas, useLoader, Vector3 } from '@react-three/fiber';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import type {
  AdjacencyGraph,
  EdgeMetadata,
  ColorMap,
  GeometryEntity,
} from './data_types';

interface ModelEntity extends GeometryEntity {
  bufferGeometry: THREE.BufferGeometry;
  color: string;
}

import adjacencyGraphJson from '../../../data_dump/adjacency_graph.json';
import edgeMetadataJson from '../../../data_dump/adjacency_graph_edge_metadata.json';
import colorMapJson from '../../../data_dump/rgb_id_to_entity_id_map.json';
import entityGeometryJson from '../../../data_dump/entity_geometry_info.json';

const adjacencyGraph: AdjacencyGraph = adjacencyGraphJson as AdjacencyGraph;
const edgeMetadata: EdgeMetadata = edgeMetadataJson as EdgeMetadata;
const colorMap: ColorMap = colorMapJson as ColorMap;
const geometryEntityData: GeometryEntity[] = (entityGeometryJson as any[]).map(
  (entry) => ({
    entityType: entry.entityType,
    entityId: entry.entityId,
    centerUv: [entry.centerUv[0], entry.centerUv[1]] as [number, number], // ✅ Ensure tuple
    centerPoint: new THREE.Vector3(
      entry.centerPoint[0],
      entry.centerPoint[1],
      entry.centerPoint[2]
    ), // ✅ Convert to Vector3
    centerNormal: new THREE.Vector3(
      entry.centerNormal[0],
      entry.centerNormal[1],
      entry.centerNormal[2]
    ), // ✅ Convert to Vector3
    area: entry.area,
    minRadius: entry.minRadius,
    minPosRadius: entry.minPosRadius,
    minNegRadius: entry.minNegRadius,
    edgeCurveChains: entry.edgeCurveChains, // Assuming this structure is correct
  })
);

function buildConcaveAdjacencyGraph(): Record<string, string[]> {
  const concaveGraph: Record<string, string[]> = {};

  for (const entityId in adjacencyGraph) {
    concaveGraph[entityId] = [];

    for (const neighbor of adjacencyGraph[entityId]) {
      const edgeKey1 = `${entityId}-${neighbor}`;
      const edgeKey2 = `${neighbor}-${entityId}`;

      // Only keep neighbors where the edge is concave
      if (
        (edgeMetadata[edgeKey1] && edgeMetadata[edgeKey1].includes(2)) ||
        (edgeMetadata[edgeKey2] && edgeMetadata[edgeKey2].includes(2))
      ) {
        concaveGraph[entityId].push(neighbor);
      }
    }
  }

  return concaveGraph;
}

function detectPockets(concaveGraph: Record<string, string[]>): string[][] {
  const visited = new Set<string>();
  const pockets: string[][] = [];

  for (const entity in concaveGraph) {
    if (!visited.has(entity)) {
      const queue = [entity];
      const pocket = [];

      while (queue.length) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        pocket.push(current);
        queue.push(...concaveGraph[current].filter((n) => !visited.has(n)));
      }

      pockets.push(pocket);
    }
  }

  return pockets;
}

export const Model = (): JSX.Element => {
  const meshRef = useRef<THREE.Mesh>(null);
  const gltf = useLoader(GLTFLoader, '/colored_glb.glb');

  const [modelEnts, setModelEnts] = useState<ModelEntity[]>([]);

  const [showPockets, setShowPockets] = useState(false);
  const [showWireframe, setShowWireframe] = useState(true);

  useEffect(() => {
    gltf.scene.traverse((element) => {
      const newModelEntities: ModelEntity[] = [];

      const entityToColor: Record<string, string> = {};

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

        const finalColor =
          entityId && entityToColor[entityId] && showPockets
            ? entityToColor[entityId]
            : 'rgb(120, 120, 120)';

        const geometryEntity = geometryEntityData.find(
          (entity) => entity.entityId == entityId
        );

        if (!geometryEntity) return;

        newModelEntities.push({
          bufferGeometry: meshElement.geometry as THREE.BufferGeometry,
          color: finalColor,
          ...geometryEntity,
        });
      });

      setModelEnts(newModelEntities);
    });
  }, [showPockets]);

  return (
    <div className='canvas-container'>
      <button onClick={() => setShowPockets(!showPockets)}>
        {showPockets ? 'Hide Pockets' : 'Show Pockets'}
      </button>
      <button onClick={() => setShowWireframe(!showWireframe)}>
        {showWireframe ? 'Hide Wireframe' : 'Show Wireframe'}
      </button>
      <Canvas camera={{ position: [0, 0, 300] as Vector3 }}>
        <ambientLight />
        <OrbitControls makeDefault />
        <group>
          {modelEnts.map((ent, index) => (
            <mesh geometry={ent.bufferGeometry} key={index} ref={meshRef}>
              <meshStandardMaterial
                color={ent.color}
                wireframe={showWireframe}
              />
              <Text
                key={ent.entityId}
                position={ent.centerPoint}
                fontSize={5}
                color='black'
              >
                {ent.entityId}
              </Text>
            </mesh>
          ))}
        </group>
      </Canvas>
    </div>
  );
};
