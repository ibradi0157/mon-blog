"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { api } from '@/app/lib/api';

interface CaptchaData {
  challengeId: string;
  question: string;
}

interface CaptchaChallengeProps {
  onValidated: (challengeId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  required?: boolean;
}

export function CaptchaChallenge({ 
  onValidated, 
  onError, 
  className = '',
  required = true 
}: CaptchaChallengeProps) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChallenge = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/captcha/challenge');
      if (response.data.success) {
        setCaptcha(response.data.data);
        setUserAnswer('');
        setIsValidated(false);
      } else {
        throw new Error('Failed to generate CAPTCHA');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load CAPTCHA';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const validateAnswer = async () => {
    if (!captcha || !userAnswer.trim()) {
      setError('Veuillez saisir une réponse');
      return;
    }

    setValidating(true);
    setError(null);
    
    try {
      const response = await api.post('/captcha/validate', {
        challengeId: captcha.challengeId,
        answer: parseInt(userAnswer.trim(), 10)
      });

      if (response.data.success && response.data.data.isValid) {
        setIsValidated(true);
        onValidated(captcha.challengeId);
      } else {
        setError('Réponse incorrecte. Veuillez réessayer.');
        setUserAnswer('');
        // Generate new challenge after failed attempt
        setTimeout(generateChallenge, 1000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur de validation';
      setError(errorMsg);
      onError?.(errorMsg);
      setUserAnswer('');
      setTimeout(generateChallenge, 1000);
    } finally {
      setValidating(false);
    }
  };

  const refreshChallenge = async () => {
    if (!captcha) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/captcha/refresh/${captcha.challengeId}`);
      if (response.data.success) {
        setCaptcha(response.data.data);
        setUserAnswer('');
        setIsValidated(false);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to refresh CAPTCHA';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !validating && !isValidated) {
      validateAnswer();
    }
  };

  if (loading && !captcha) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Chargement du CAPTCHA...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Vérification anti-robot
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        {isValidated ? (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Shield className="w-4 h-4" />
              Vérification réussie ! ✓
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {captcha && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {captcha.question}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Votre réponse"
                    disabled={validating || loading}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={validateAnswer}
                    disabled={!userAnswer.trim() || validating || loading}
                  >
                    {validating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Vérifier'
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshChallenge}
                disabled={loading || validating}
                className="text-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Nouveau défi
              </Button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Expire dans 5 min
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Cette vérification aide à protéger notre site contre les robots automatisés.
        </div>
      </CardContent>
    </Card>
  );
}
