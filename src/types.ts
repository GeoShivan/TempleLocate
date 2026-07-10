export interface TempleProperties {
  Temple_Name: string;
  District: string;
  Locality: string;
  Deity: string;
  Latitude?: number;
  Longitude?: number;
}

export interface TempleFeature {
  type: 'Feature';
  properties: TempleProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface TempleFeatureCollection {
  type: 'FeatureCollection';
  features: TempleFeature[];
}

export type BaseMapType = 'osm' | 'esri' | 'carto' | 'topo' | 'google';
