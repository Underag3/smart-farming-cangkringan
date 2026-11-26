export type IrrigationType = "Teknis" | "Semi Teknis" | "Tadah Hujan";

export interface HealthResponse {
  status: string;
  ml_model_loaded: boolean;
  rag_chunks_loaded: number;
  llm_configured: boolean;
  model_silhouette: number;
}

export interface SoilDiagnosisItem {
  parameter: string;
  status: string;
  recommendation: string;
}

export interface CommoditySuitabilityItem {
  commodity: string;
  variety: string;
  score: number;
  tier: "Sangat Cocok" | "Cukup Cocok" | "Perlu Penyesuaian";
  reasons: string[];
  estimated_cost_for_area: number;
}

export interface LandAnalyzeRequest {
  elevation_m: number;
  soil_ph: number;
  organic_carbon: number;
  ndvi: number;
  area_ha: number;
  irrigation?: IrrigationType | null;
}

export interface LandAnalyzeResponse {
  input: LandAnalyzeRequest;
  exploratory_segment: {
    id: "A" | "B" | "C";
    code: number;
    name: string;
    description: string;
    silhouette_score: number;
    disclaimer: string;
    nearest_centroid: {
      elevation_m: number;
      soil_ph: number;
      organic_carbon: number;
      ndvi: number;
    };
    standardized_distance: number;
    focus_recommendations: string[];
  };
  ood_warnings: string[];
  soil_diagnosis: SoilDiagnosisItem[];
  commodity_suitability: CommoditySuitabilityItem[];
  whatsapp_summary: string;
}

export interface CostItem {
  commodity: string;
  variety: string;
  seed_cost: number;
  fertilizer_cost: number;
  pesticide_cost: number;
  labor_cost: number;
  total_cost_per_ha: number;
}

export interface CostEstimateResponse {
  commodity: string;
  variety: string;
  area_ha: number;
  cost_per_ha: {
    seed: number;
    fertilizer: number;
    pesticide: number;
    labor: number;
    total: number;
  };
  scaled_cost: {
    seed: number;
    fertilizer: number;
    pesticide: number;
    labor: number;
    total: number;
  };
  component_shares_pct: {
    seed: number;
    fertilizer: number;
    pesticide: number;
    labor: number;
  };
  break_even: {
    target_yield_ton_per_ha: number;
    expected_total_kg: number;
    break_even_price_rp_per_kg: number;
    note: string;
  } | null;
  official_benchmarks: Array<{
    label: string;
    value_rp_kg?: number;
    value_ton_ha?: number;
  }>;
  source: string;
}

export interface RegionSummary {
  desa: string;
  farm_count: number;
  total_area_ha: number;
  mean_elevation_m: number;
  mean_soil_ph: number;
  mean_organic_carbon: number;
  mean_ndvi: number;
  irrigation_counts: Record<string, number>;
}

export interface SamplePlot {
  farm_id: string;
  desa: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  area_ha: number;
  soil_ph: number;
  organic_carbon: number;
  ndvi: number;
  irrigation: string;
  segment_id: "A" | "B" | "C";
}

export interface RegionsResponse {
  dataset_meta: {
    total_farms: number;
    total_area_ha: number;
    elevation_min_m: number;
    elevation_max_m: number;
    soil_type: string;
    mean_ndvi: number;
    lat_bounds: [number, number];
    lon_bounds: [number, number];
  };
  regions: RegionSummary[];
  sample_plots: SamplePlot[];
  weather_summary: {
    total_months: number;
    rainfall_mean_mm: number;
    rainfall_min_mm: number;
    rainfall_max_mm: number;
    temperature_min_c: number;
    temperature_max_c: number;
    humidity_min_pct: number;
    humidity_max_pct: number;
    monthly: Array<{
      month: number;
      label: string;
      mean_rainfall_mm: number;
      mean_temperature_c: number;
      mean_humidity_pct: number;
    }>;
  };
  pest_summary: {
    total_records: number;
    counts_by_pest: Record<string, number>;
    tidak_ada_total: number;
    tidak_ada_by_severity: Record<string, number>;
    note: string;
  };
}

export interface ChatResponse {
  message_id: string;
  answer: string;
  citations: Array<{ source: string; detail: string }>;
  tools_used: string[];
  retrieved_chunks: string[];
  mode: "llm" | "fallback";
}

export interface AuditResponse {
  dataset_meta: RegionsResponse["dataset_meta"];
  clustering: {
    algorithm: string;
    features: string[];
    silhouette_4feat: number;
    silhouette_5feat_legacy: number;
    disclaimer: string;
  };
  audit_findings: {
    planting_harvest: {
      total_rows: number;
      area_mismatch_exact_count: number;
      area_mismatch_gt_001_count: number;
      yield_mean_ton_ha: number;
      yield_max_ton_ha: number;
      isolation_forest_anomalies: number;
      isolation_forest_anom_yield_mean: number;
      isolation_forest_norm_yield_mean: number;
    };
    yield_prediction_rejection: {
      ml_rows: number;
      date_min: string;
      date_max: string;
      ml_yield_mean_ton_ha: number;
      linear_regression: { r2_test: number; rmse_test: number; r2_cv5_mean: number };
      random_forest: { r2_test: number; rmse_test: number; r2_cv5_mean: number };
    };
    price_data_rejection: {
      total_rows: number;
      overall_min_rp_kg: number;
      overall_max_rp_kg: number;
    };
    official_bps_benchmarks: {
      rata_rata_harga_gabah_2025_rp_kg: number;
      hpp_gkp_rp_kg: number;
      hpp_jagung_rp_kg: number;
      produktivitas_padi_riil_ton_ha: number;
    };
  };
  pest_summary: RegionsResponse["pest_summary"];
}
