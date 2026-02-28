import type { ComponentManifest } from '@/types/ublx';

export const COMPONENT_CATALOG: ComponentManifest[] = [
  { component_id: 'service-card', name: 'Service Card', version: '1.0.0', frontend_entry: 'ServiceCard', permissions: ['read:status'], limits: { min_w: 4, min_h: 3, max_w: 32, max_h: 24 } },
  { component_id: 'smart-list', name: 'Smart List', version: '1.0.0', frontend_entry: 'SmartList', permissions: ['read:list'], limits: { min_w: 4, min_h: 4, max_w: 32, max_h: 24 } },
  { component_id: 'drop-zone', name: 'Drop Zone', version: '1.0.0', frontend_entry: 'DropZone', permissions: ['write:drop'], limits: { min_w: 4, min_h: 4, max_w: 32, max_h: 24 } },
  { component_id: 'llm-status', name: 'LLM Status', version: '1.0.0', frontend_entry: 'LLMStatus', permissions: ['read:llm'], limits: { min_w: 4, min_h: 4, max_w: 32, max_h: 24 } },
  { component_id: 'quick-files', name: 'Quick Files', version: '1.0.0', frontend_entry: 'QuickFiles', permissions: ['read:files'], limits: { min_w: 4, min_h: 4, max_w: 32, max_h: 24 } },
  { component_id: 'registry', name: 'Registry', version: '1.0.0', frontend_entry: 'Registry', permissions: ['read:registry'], limits: { min_w: 4, min_h: 4, max_w: 32, max_h: 24 } },
  { component_id: 'pipeline-editor', name: 'Pipeline Editor', version: '1.0.0', frontend_entry: 'PipelineEditor', permissions: ['read:pipeline'], limits: { min_w: 4, min_h: 4, max_w: 32, max_h: 24 } },
  { component_id: 'status-ticker', name: 'Status Ticker', version: '1.0.0', frontend_entry: 'StatusTicker', permissions: ['read:status'], limits: { min_w: 4, min_h: 2, max_w: 32, max_h: 8 } },
  { component_id: 'alert-tracker', name: 'Alert Tracker', version: '1.0.0', frontend_entry: 'AlertTracker', permissions: ['read:alerts'], limits: { min_w: 4, min_h: 3, max_w: 32, max_h: 24 } },
  { component_id: 'signal-graph', name: 'Signal Graph', version: '1.0.0', frontend_entry: 'SignalGraph', permissions: ['read:signals'], limits: { min_w: 4, min_h: 3, max_w: 32, max_h: 24 } },
  { component_id: 'incident-feed', name: 'Incident Feed', version: '1.0.0', frontend_entry: 'IncidentFeed', permissions: ['read:incidents'], limits: { min_w: 4, min_h: 3, max_w: 32, max_h: 24 } },
];
