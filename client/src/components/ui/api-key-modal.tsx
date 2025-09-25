import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Key, ExternalLink, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useApiKey } from '@/hooks/use-api-key';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyModal({ open, onOpenChange }: ApiKeyModalProps) {
  const [inputValue, setInputValue] = useState('');
  const { apiKey, setApiKey, hasApiKey } = useApiKey();
  const { toast } = useToast();

  const validateKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest('POST', '/api/validate-key', { apiKey: key });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setApiKey(inputValue);
        toast({
          title: "API key validated successfully!",
          description: "You can now start analyzing your data.",
        });
        onOpenChange(false);
        setInputValue('');
      } else {
        toast({
          variant: "destructive",
          title: "Invalid API key",
          description: data.error || "Please check your API key and try again.",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: error.message,
      });
    }
  });

  const handleSave = () => {
    if (!inputValue.trim()) {
      toast({
        variant: "destructive",
        title: "API key required",
        description: "Please enter your DeepSeek API key.",
      });
      return;
    }

    if (!inputValue.startsWith('sk-')) {
      toast({
        variant: "destructive",
        title: "Invalid format",
        description: "DeepSeek API keys should start with 'sk-'.",
      });
      return;
    }

    validateKeyMutation.mutate(inputValue);
  };

  const handleRemove = () => {
    setApiKey(null);
    setInputValue('');
    toast({
      title: "API key removed",
      description: "Your API key has been removed from local storage.",
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '...';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-primary" />
              <span>DeepSeek API Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Enter your DeepSeek API key to enable conversational analytics. Your key is stored securely in your browser and never shared.
            </p>

            {hasApiKey && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">API Key Configured</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      {maskApiKey(apiKey || '')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="font-mono"
                data-testid="input-api-key"
              />
            </div>

            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Why DeepSeek?</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      DeepSeek provides advanced reasoning capabilities perfect for data analysis. Get your API key from their platform.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-blue-500 p-0 h-auto font-normal text-xs"
                      onClick={() => window.open('https://platform.deepseek.com/', '_blank')}
                      data-testid="link-deepseek-platform"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      platform.deepseek.com
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={validateKeyMutation.isPending}
                className="flex-1 gradient-button"
                data-testid="button-save-api-key"
              >
                {validateKeyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {validateKeyMutation.isPending ? 'Validating...' : 'Save & Validate'}
              </Button>
              
              {hasApiKey && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  data-testid="button-remove-api-key"
                >
                  Remove
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
