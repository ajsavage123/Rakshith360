import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { XCircle, Brain, Cpu } from 'lucide-react';
import { AI_MODELS, AIModel, GEMINI_MODELS, getSelectedModel, saveSelectedModel, getSelectedGeminiModel, saveSelectedGeminiModel } from '@/lib/aiService';

interface AccountSettingsProps {
  onClose: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose }) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>(getSelectedModel());
  const [selectedGeminiModel, setSelectedGeminiModel] = useState(getSelectedGeminiModel());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    saveSelectedModel(model);
    window.dispatchEvent(new Event('apiKeyUpdated'));
    setMessage({ type: 'success', text: `Switched to ${AI_MODELS[model].name}` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleGeminiModelChange = (modelId: string) => {
    setSelectedGeminiModel(modelId);
    saveSelectedGeminiModel(modelId);
    window.dispatchEvent(new Event('apiKeyUpdated'));
    const modelInfo = GEMINI_MODELS.find(m => m.id === modelId);
    setMessage({ type: 'success', text: `Switched to ${modelInfo?.name || modelId}` });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto m-0 sm:m-4">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white dark:bg-gray-900 pb-2 z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>

          {/* Message Alert */}
          {message && (
            <Alert className={`mb-4 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* AI Model Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Select AI Model
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Choose which AI model to use for medical assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AI_MODELS).map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Currently using: <strong>{AI_MODELS[selectedModel].name}</strong>
              </p>
            </CardContent>
          </Card>

          {/* Gemini Model Selection - Only show when Gemini is selected */}
          {selectedModel === 'gemini' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Select Gemini Model Version
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Choose which specific Gemini model to use. Different models have different capabilities and speeds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedGeminiModel} onValueChange={handleGeminiModelChange}>
                  <SelectTrigger className="w-full" data-testid="select-gemini-model">
                    <SelectValue placeholder="Select Gemini Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id} data-testid={`gemini-model-${model.id}`}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Currently using: <strong>{GEMINI_MODELS.find(m => m.id === selectedGeminiModel)?.name || selectedGeminiModel}</strong>
                </p>
              </CardContent>
            </Card>
          )}



          {/* Footer */}
          <div className="mt-4 sm:mt-6 flex justify-end sticky bottom-0 bg-white dark:bg-gray-900 pt-2 pb-2">
            <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white w-full sm:w-auto px-6 text-sm sm:text-base">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
