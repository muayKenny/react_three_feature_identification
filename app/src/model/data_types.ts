export enum EntityType {
  PLANE = 'PLANE',
  CYLINDER = 'CYLINDER',
  ROTATIONAL = 'ROTATIONAL',
  NURBS = 'NURBS',
}

// Relevant to entity_geometry_info.json
export interface GeometryEntity {
  entityType: EntityType;
  entityId: string;
  centerUv: [number, number]; // 2D UV mapping coordinates
  centerPoint: [number, number, number]; // XYZ world position
  centerNormal: [number, number, number]; // Normalized direction vector
  area: number;
  minRadius: number;
  minPosRadius: number;
  minNegRadius: number;
  edgeCurveChains: EdgeCurveChain[];
}

export interface EdgeCurveChain {
  edgeType: EdgeCategory;
  edgeCurves: EdgeCurve[];
}

export interface EdgeCurve {
  startPoint: [number, number, number];
  midPoint: [number, number, number];
  endPoint: [number, number, number];
  startPointNormal: [number, number, number];
}

export enum EdgeCategory {
  OUTER = 'OUTER',
  INNER = 'INNER',
}

// Relevant to adjacency_graph_edge_metadata.json
export enum EdgeType {
  CONCAVE = 'CONCAVE',
  CONVEX = 'CONVEX',
  TANGENTIAL = 'TANGENTIAL',
}

export interface EdgeMetadata {
  [edgeKey: string]: EdgeType[]; // Maps "X-Y" edges to their types
}
