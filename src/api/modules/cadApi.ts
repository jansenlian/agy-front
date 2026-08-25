import { request } from '@greatmap/agy-front';

export interface CadLayerStat {
  layerName: string;
  color: string;
  lineCount: number;
  polylineCount: number;
  textCount: number;
  totalEntityCount: number;
}

export interface CadFeatureDto {
  id: string;
  layerName: string;
  wkt: string;
  attributes: Record<string, any>;
  area: number;
  perimeter: number;
}

export interface CadParseOption {
  layers?: string[];
  polygonize?: boolean;
  matchAttributes?: boolean;
  minAreaThreshold?: number;
}

/**
 * 探测 CAD 图层与图元统计
 */
export function getCadLayers(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<any, { data: CadLayerStat[] }>('/v1/cad/layers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * 解析 CAD 为 GeoJSON FeatureCollection
 */
export function parseCadToGeoJson(file: File, options?: CadParseOption) {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.layers && options.layers.length > 0) {
    formData.append('layers', options.layers.join(','));
  }
  if (options?.polygonize !== undefined) {
    formData.append('polygonize', String(options.polygonize));
  }
  if (options?.matchAttributes !== undefined) {
    formData.append('matchAttributes', String(options.matchAttributes));
  }
  if (options?.minAreaThreshold !== undefined) {
    formData.append('minAreaThreshold', String(options.minAreaThreshold));
  }

  return request.post<any, { data: any }>('/v1/cad/parse-to-geojson', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

/**
 * 解析 CAD 为矢量要素列表
 */
export function parseCadToFeatures(file: File, options?: CadParseOption) {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.layers && options.layers.length > 0) {
    formData.append('layers', options.layers.join(','));
  }
  return request.post<any, { data: CadFeatureDto[] }>('/v1/cad/parse-to-features', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}
