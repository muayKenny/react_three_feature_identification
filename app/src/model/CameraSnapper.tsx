import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { ModelEntity } from './model';

const CameraSnapper = ({
  modelEnts,
  targetEntityIndex,
}: {
  modelEnts: ModelEntity[];
  targetEntityIndex: number;
}) => {
  const { camera } = useThree();

  useEffect(() => {
    if (
      !modelEnts.length ||
      targetEntityIndex < 0 ||
      targetEntityIndex >= modelEnts.length
    )
      return;

    const entity = modelEnts[targetEntityIndex];
    if (!entity) return;

    // const targetPosition = entity.centerPoint
    //   .clone()
    //   .add(new THREE.Vector3(0, 0, 30)); // Offset to prevent clipping
    const [nx, ny, nz] = entity.geometryEntity.centerNormal as unknown as [
      number,
      number,
      number
    ]; // ✅ Ensure it's a tuple
    const normal = new THREE.Vector3(nx, ny, nz);
    // Compute a dynamic distance based on bounding sphere radius (fallback to 50)
    const boundingSphere = entity.bufferGeometry.boundingSphere;
    const defaultDistance = 100;
    const dynamicDistance = boundingSphere
      ? boundingSphere.radius * 2
      : defaultDistance;

    // Offset the camera along the normal direction
    const targetPosition = entity.centerPoint
      .clone()
      .add(new THREE.Vector3(0, 100, 0));

    let frameId: number;
    const animate = () => {
      camera.position.lerp(targetPosition, 0.1); // Gradually move towards the target
      camera.lookAt(entity.centerPoint);

      // Stop the animation when the camera is "close enough"
      if (camera.position.distanceTo(targetPosition) < 0.1) {
        cancelAnimationFrame(frameId);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate); // Start the animation loop

    return () => cancelAnimationFrame(frameId); // Cleanup when component unmounts or effect re-runs
  }, [targetEntityIndex, modelEnts, camera]);

  return null;
};

export default CameraSnapper;
