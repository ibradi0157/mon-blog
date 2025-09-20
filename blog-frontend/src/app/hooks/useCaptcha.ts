"use client";

import { useState, useCallback } from 'react';
import { api } from '@/app/lib/api';

interface CaptchaData {
  challengeId: string;
  question: string;
}

interface UseCaptchaReturn {
  captcha: CaptchaData | null;
  isValidated: boolean;
  isLoading: boolean;
  error: string | null;
  generateChallenge: () => Promise<void>;
  validateChallenge: (answer: number) => Promise<boolean>;
  refreshChallenge: () => Promise<void>;
  reset: () => void;
}

export function useCaptcha(): UseCaptchaReturn {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsValidated(false);
    
    try {
      const response = await api.get('/captcha/challenge');
      if (response.data.success) {
        setCaptcha(response.data.data);
      } else {
        throw new Error('Failed to generate CAPTCHA');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load CAPTCHA';
      setError(errorMsg);
      setCaptcha(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateChallenge = useCallback(async (answer: number): Promise<boolean> => {
    if (!captcha) {
      setError('No CAPTCHA challenge available');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/captcha/validate', {
        challengeId: captcha.challengeId,
        answer
      });

      if (response.data.success && response.data.data.isValid) {
        setIsValidated(true);
        return true;
      } else {
        setError('Réponse incorrecte. Veuillez réessayer.');
        setIsValidated(false);
        // Auto-generate new challenge after failed attempt
        setTimeout(generateChallenge, 1000);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur de validation';
      setError(errorMsg);
      setIsValidated(false);
      setTimeout(generateChallenge, 1000);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [captcha, generateChallenge]);

  const refreshChallenge = useCallback(async () => {
    if (!captcha) {
      await generateChallenge();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsValidated(false);
    
    try {
      const response = await api.get(`/captcha/refresh/${captcha.challengeId}`);
      if (response.data.success) {
        setCaptcha(response.data.data);
      } else {
        // Fallback to generating new challenge
        await generateChallenge();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to refresh CAPTCHA';
      setError(errorMsg);
      // Fallback to generating new challenge
      await generateChallenge();
    } finally {
      setIsLoading(false);
    }
  }, [captcha, generateChallenge]);

  const reset = useCallback(() => {
    setCaptcha(null);
    setIsValidated(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    captcha,
    isValidated,
    isLoading,
    error,
    generateChallenge,
    validateChallenge,
    refreshChallenge,
    reset,
  };
}
