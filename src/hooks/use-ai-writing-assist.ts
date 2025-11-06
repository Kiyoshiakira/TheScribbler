import { useState, useCallback } from 'react';

export interface AiWritingAssistConfig {
  enabled: boolean;
  autoSuggest: boolean;
  showInline: boolean;
  minConfidence: number;
}

const DEFAULT_CONFIG: AiWritingAssistConfig = {
  enabled: true,
  autoSuggest: true,
  showInline: true,
  minConfidence: 0.5,
};

export function useAiWritingAssist() {
  const [config, setConfig] = useState<AiWritingAssistConfig>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-writing-assist-config');
      if (saved) {
        try {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch {
          return DEFAULT_CONFIG;
        }
      }
    }
    return DEFAULT_CONFIG;
  });

  const updateConfig = useCallback((updates: Partial<AiWritingAssistConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai-writing-assist-config', JSON.stringify(newConfig));
      }
      return newConfig;
    });
  }, []);

  const toggleEnabled = useCallback(() => {
    updateConfig({ enabled: !config.enabled });
  }, [config.enabled, updateConfig]);

  const toggleAutoSuggest = useCallback(() => {
    updateConfig({ autoSuggest: !config.autoSuggest });
  }, [config.autoSuggest, updateConfig]);

  const toggleShowInline = useCallback(() => {
    updateConfig({ showInline: !config.showInline });
  }, [config.showInline, updateConfig]);

  const setMinConfidence = useCallback((confidence: number) => {
    updateConfig({ minConfidence: Math.max(0, Math.min(1, confidence)) });
  }, [updateConfig]);

  return {
    config,
    updateConfig,
    toggleEnabled,
    toggleAutoSuggest,
    toggleShowInline,
    setMinConfidence,
  };
}
