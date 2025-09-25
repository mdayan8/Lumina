import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'lumina_deepseek_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load API key from localStorage on mount
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKeyState(storedKey);
      }
    } catch (error) {
      console.error('Failed to load API key from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setApiKey = (key: string | null) => {
    setApiKeyState(key);
    
    try {
      if (key) {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save API key to localStorage:', error);
    }
  };

  const clearApiKey = () => {
    setApiKey(null);
  };

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey: !!apiKey,
    isLoading,
  };
}
