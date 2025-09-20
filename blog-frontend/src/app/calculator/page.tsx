"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Calculator as CalculatorIcon, Delete, RotateCcw } from 'lucide-react';

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: string | null;
  waitingForNewValue: boolean;
  history: string[];
}

const initialState: CalculatorState = {
  display: '0',
  previousValue: null,
  operation: null,
  waitingForNewValue: false,
  history: []
};

export default function CalculatorPage() {
  const [state, setState] = useState<CalculatorState>(initialState);

  const calculate = useCallback((firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '*': return firstValue * secondValue;
      case '/': return secondValue !== 0 ? firstValue / secondValue : 0;
      case '%': return firstValue % secondValue;
      case '^': return Math.pow(firstValue, secondValue);
      default: return secondValue;
    }
  }, []);

  const handleNumber = useCallback((num: string) => {
    setState(prevState => {
      if (prevState.waitingForNewValue) {
        return {
          ...prevState,
          display: num,
          waitingForNewValue: false
        };
      }
      return {
        ...prevState,
        display: prevState.display === '0' ? num : prevState.display + num
      };
    });
  }, []);

  const handleOperation = useCallback((nextOperation: string) => {
    setState(prevState => {
      const inputValue = parseFloat(prevState.display);

      if (prevState.previousValue === null) {
        return {
          ...prevState,
          previousValue: inputValue,
          operation: nextOperation,
          waitingForNewValue: true
        };
      }

      if (prevState.operation && !prevState.waitingForNewValue) {
        const currentValue = prevState.previousValue || 0;
        const newValue = calculate(currentValue, inputValue, prevState.operation);
        const expression = `${currentValue} ${prevState.operation} ${inputValue} = ${newValue}`;

        return {
          ...prevState,
          display: String(newValue),
          previousValue: newValue,
          operation: nextOperation,
          waitingForNewValue: true,
          history: [expression, ...prevState.history.slice(0, 9)]
        };
      }

      return {
        ...prevState,
        operation: nextOperation,
        waitingForNewValue: true
      };
    });
  }, [calculate]);

  const handleEquals = useCallback(() => {
    setState(prevState => {
      if (prevState.operation && prevState.previousValue !== null && !prevState.waitingForNewValue) {
        const inputValue = parseFloat(prevState.display);
        const currentValue = prevState.previousValue;
        const newValue = calculate(currentValue, inputValue, prevState.operation);
        const expression = `${currentValue} ${prevState.operation} ${inputValue} = ${newValue}`;

        return {
          ...prevState,
          display: String(newValue),
          previousValue: null,
          operation: null,
          waitingForNewValue: true,
          history: [expression, ...prevState.history.slice(0, 9)]
        };
      }
      return prevState;
    });
  }, [calculate]);

  const handleDecimal = useCallback(() => {
    setState(prevState => {
      if (prevState.waitingForNewValue) {
        return {
          ...prevState,
          display: '0.',
          waitingForNewValue: false
        };
      }
      if (prevState.display.indexOf('.') === -1) {
        return {
          ...prevState,
          display: prevState.display + '.'
        };
      }
      return prevState;
    });
  }, []);

  const handleClear = useCallback(() => {
    setState(initialState);
  }, []);

  const handleBackspace = useCallback(() => {
    setState(prevState => {
      if (prevState.display.length > 1) {
        return {
          ...prevState,
          display: prevState.display.slice(0, -1)
        };
      }
      return {
        ...prevState,
        display: '0'
      };
    });
  }, []);

  const handleScientific = useCallback((func: string) => {
    setState(prevState => {
      const value = parseFloat(prevState.display);
      let result: number;
      let expression: string;

      switch (func) {
        case 'sin':
          result = Math.sin(value * Math.PI / 180);
          expression = `sin(${value}°) = ${result}`;
          break;
        case 'cos':
          result = Math.cos(value * Math.PI / 180);
          expression = `cos(${value}°) = ${result}`;
          break;
        case 'tan':
          result = Math.tan(value * Math.PI / 180);
          expression = `tan(${value}°) = ${result}`;
          break;
        case 'log':
          result = value > 0 ? Math.log10(value) : 0;
          expression = `log(${value}) = ${result}`;
          break;
        case 'ln':
          result = value > 0 ? Math.log(value) : 0;
          expression = `ln(${value}) = ${result}`;
          break;
        case 'sqrt':
          result = value >= 0 ? Math.sqrt(value) : 0;
          expression = `√${value} = ${result}`;
          break;
        case 'square':
          result = value * value;
          expression = `${value}² = ${result}`;
          break;
        case '1/x':
          result = value !== 0 ? 1 / value : 0;
          expression = `1/${value} = ${result}`;
          break;
        default:
          return prevState;
      }

      return {
        ...prevState,
        display: String(result),
        waitingForNewValue: true,
        history: [expression, ...prevState.history.slice(0, 9)]
      };
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { key } = event;
      
      if (/\d/.test(key)) {
        handleNumber(key);
      } else if (['+', '-', '*', '/', '%'].includes(key)) {
        handleOperation(key);
      } else if (key === '=' || key === 'Enter') {
        event.preventDefault();
        handleEquals();
      } else if (key === '.') {
        handleDecimal();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleClear();
      } else if (key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNumber, handleOperation, handleEquals, handleDecimal, handleClear, handleBackspace]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CalculatorIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculatrice Avancée
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Calculatrice scientifique avec fonctions avancées, historique des calculs et support clavier complet.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Calculator */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalculatorIcon className="w-5 h-5" />
                  Calculatrice
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Display */}
                <div className="mb-6 p-4 bg-gray-900 dark:bg-gray-800 rounded-lg">
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1 min-h-[1.25rem]">
                      {state.previousValue !== null && state.operation && (
                        `${state.previousValue} ${state.operation}`
                      )}
                    </div>
                    <div className="text-3xl font-mono text-white font-bold break-all">
                      {state.display}
                    </div>
                  </div>
                </div>

                {/* Scientific Functions */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <Button variant="outline" onClick={() => handleScientific('sin')} className="text-sm">
                    sin
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('cos')} className="text-sm">
                    cos
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('tan')} className="text-sm">
                    tan
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('log')} className="text-sm">
                    log
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('ln')} className="text-sm">
                    ln
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('sqrt')} className="text-sm">
                    √x
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('square')} className="text-sm">
                    x²
                  </Button>
                  <Button variant="outline" onClick={() => handleScientific('1/x')} className="text-sm">
                    1/x
                  </Button>
                </div>

                {/* Basic Calculator */}
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="destructive" onClick={handleClear} className="col-span-2">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button variant="secondary" onClick={handleBackspace}>
                    <Delete className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" onClick={() => handleOperation('/')}>
                    ÷
                  </Button>

                  <Button variant="outline" onClick={() => handleNumber('7')}>7</Button>
                  <Button variant="outline" onClick={() => handleNumber('8')}>8</Button>
                  <Button variant="outline" onClick={() => handleNumber('9')}>9</Button>
                  <Button variant="secondary" onClick={() => handleOperation('*')}>×</Button>

                  <Button variant="outline" onClick={() => handleNumber('4')}>4</Button>
                  <Button variant="outline" onClick={() => handleNumber('5')}>5</Button>
                  <Button variant="outline" onClick={() => handleNumber('6')}>6</Button>
                  <Button variant="secondary" onClick={() => handleOperation('-')}>-</Button>

                  <Button variant="outline" onClick={() => handleNumber('1')}>1</Button>
                  <Button variant="outline" onClick={() => handleNumber('2')}>2</Button>
                  <Button variant="outline" onClick={() => handleNumber('3')}>3</Button>
                  <Button variant="secondary" onClick={() => handleOperation('+')} className="row-span-2">
                    +
                  </Button>

                  <Button variant="outline" onClick={() => handleNumber('0')} className="col-span-2">
                    0
                  </Button>
                  <Button variant="outline" onClick={handleDecimal}>.</Button>

                  <Button variant="primary" onClick={handleEquals} className="col-span-3">
                    =
                  </Button>
                </div>

                {/* Additional Operations */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Button variant="secondary" onClick={() => handleOperation('%')}>
                    %
                  </Button>
                  <Button variant="secondary" onClick={() => handleOperation('^')}>
                    x^y
                  </Button>
                  <Button variant="secondary" onClick={() => handleNumber('3.14159')}>
                    π
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {state.history.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                      Aucun calcul effectué
                    </p>
                  ) : (
                    state.history.map((calculation, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm font-mono break-all"
                      >
                        {calculation}
                      </div>
                    ))
                  )}
                </div>
                {state.history.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, history: [] }))}
                    className="w-full mt-4"
                  >
                    Effacer l'historique
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Shortcuts Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Raccourcis clavier</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div><kbd>0-9</kbd> : Chiffres</div>
                <div><kbd>+ - * /</kbd> : Opérations</div>
                <div><kbd>Enter / =</kbd> : Égal</div>
                <div><kbd>.</kbd> : Virgule</div>
                <div><kbd>Backspace</kbd> : Effacer</div>
                <div><kbd>Escape / C</kbd> : Clear</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
