import './model.css';

import React, { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { FlyControls, OrbitControls, Text } from '@react-three/drei';
import { Canvas, useLoader, Vector3 } from '@react-three/fiber';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import type {
  AdjacencyGraph,
  EdgeMetadata,
  ColorMap,
  GeometryEntity,
} from './data_types';

interface ModelEntity {
  bufferGeometry: THREE.BufferGeometry;
  color: string;
  geometryEntity: GeometryEntity;
  centerPoint: THREE.Vector3;
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

export const Model = (): JSX.Element => {
  const meshRef = useRef<THREE.Mesh>(null);
  const gltf = useLoader(GLTFLoader, '/colored_glb.glb');

  const [showPockets, setShowPockets] = useState(false);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showEntityLabels, setShowEntityLabels] = useState(true);

  const modelEnts = useMemo(() => {
    if (!gltf || !gltf.scene) return []; // Ensure GLTF is loaded

    const newModelEntities: ModelEntity[] = [];

    gltf.scene.traverse((element) => {
      if (element.type !== 'Mesh') return;
      const meshElement = element as THREE.Mesh;
      const material = meshElement.material as THREE.MeshStandardMaterial;
      const color = material.color;
      const entityToColor: Record<string, string> = {};

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

      const centerPoint = computeMeshCenter(meshElement);

      newModelEntities.push({
        bufferGeometry: meshElement.geometry as THREE.BufferGeometry,
        color: finalColor,
        geometryEntity,
        centerPoint,
      });
    });

    return newModelEntities;
  }, [showPockets, gltf]); // Runs again when GLTF is loaded

  return (
    <div className='canvas-container'>
      <button onClick={() => setShowPockets(!showPockets)}>
        {showPockets ? 'Hide Pockets' : 'Show Pockets'}
      </button>
      <button onClick={() => setShowWireframe(!showWireframe)}>
        {showWireframe ? 'Hide Wireframe' : 'Show Wireframe'}
      </button>
      <button onClick={() => setShowEntityLabels(!showEntityLabels)}>
        {showEntityLabels ? 'Hide Entity Labels' : 'Show Entity Labels'}
      </button>
      <Canvas camera={{ position: [0, 0, 300] as Vector3 }}>
        <ambientLight />
        <OrbitControls makeDefault />
        {/* <FlyControls
          movementSpeed={300} // Increase speed (default is usually too slow)
          rollSpeed={1} // Adjust roll sensitivity
          dragToLook={true} // Enable mouse drag for look-around
        /> */}
        <group>
          {modelEnts.map((ent, index) => (
            <mesh geometry={ent.bufferGeometry} key={index} ref={meshRef}>
              <meshStandardMaterial
                color={ent.color}
                wireframe={showWireframe}
              />
              {showEntityLabels && (
                <Text
                  key={ent.geometryEntity.entityId}
                  position={ent.centerPoint}
                  fontSize={5}
                  color='black'
                >
                  {ent.geometryEntity.entityId}
                </Text>
              )}
            </mesh>
          ))}
        </group>
      </Canvas>
    </div>
  );
};

function computeMeshCenter(mesh: THREE.Mesh): THREE.Vector3 {
  if (!mesh.geometry) return new THREE.Vector3(0, 0, 0);

  const positions = mesh.geometry.attributes.position.array; // Flat array of XYZ triplets
  const indices = mesh.geometry.index?.array; // Index buffer for faces
  if (!indices) {
    console.warn('No index buffer found in geometry.');
    return new THREE.Vector3(0, 0, 0);
  }

  let sum = new THREE.Vector3();
  let faceCount = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i] * 3;
    const i2 = indices[i + 1] * 3;
    const i3 = indices[i + 2] * 3;

    // Get XYZ of each vertex
    const v1 = new THREE.Vector3(
      positions[i1],
      positions[i1 + 1],
      positions[i1 + 2]
    );
    const v2 = new THREE.Vector3(
      positions[i2],
      positions[i2 + 1],
      positions[i2 + 2]
    );
    const v3 = new THREE.Vector3(
      positions[i3],
      positions[i3 + 1],
      positions[i3 + 2]
    );

    // Compute face center (average of three vertices)
    const faceCenter = new THREE.Vector3()
      .addVectors(v1, v2)
      .add(v3)
      .divideScalar(3);

    // Transform to world space
    faceCenter.applyMatrix4(mesh.matrixWorld);

    sum.add(faceCenter);
    faceCount++;
  }

  if (faceCount === 0) return new THREE.Vector3(0, 0, 0); // Prevent division by zero
  return sum.divideScalar(faceCount); // Compute the average center
}

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
