'use client';

import { useEffect, useState } from 'react';

export interface BusinessConfig {
  business: {
    name: string;
    address: string;
    description: string;
    shortDescription: string;
    story: string;
    tagline: string;
  };
  hours: {
    open: string;
    close: string;
    openingTime: string;
    closingTime: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  delivery: {
    fee: number;
    minimumOrder: string;
  };
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  google_maps: {
    embed: string;
  };
  features: {
    showOnlineOrders: boolean;
    showPickup: boolean;
    showDelivery: boolean;
    showGallery: boolean;
    showStory: boolean;
  };
  social: {
    facebook: string;
    instagram: string;
    whatsapp: string;
  };
}

export function useBusinessConfig() {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/config/business-config.json');
        if (!response.ok) {
          throw new Error('Failed to load config');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return { config, error, loading };
}
