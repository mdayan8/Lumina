import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';
import { InsightCard } from './insight-card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  analysis?: any;
  timestamp: Date;
}

interface ChatInterfaceProps {
  file: any;
  apiKey: string | null;
  hasApiKey: boolean;
  onShowApiKeyModal: () => void;
}

export function ChatInterface({ file, apiKey, hasApiKey, onShowApiKeyModal }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['/api/suggestions', file?.id],
    queryFn: async () => {
      if (!hasApiKey || !apiKey) return [];
      const response = await apiRequest('POST', '/api/suggestions', {
        fileId: file.id,
        apiKey
      });
      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: !!file && hasApiKey && !!apiKey,
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ query, fileId }: { query: string; fileId: string }) => {
      if (!apiKey) {
        throw new Error('API key is required');
      }

      const response = await apiRequest('POST', '/api/analyze', {
        fileId,
        query,
        apiKey
      });
      return response.json();
    },
    onMutate: ({ query }) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.analysis.response,
        analysis: data.analysis,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message,
      });
      setIsTyping(false);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (file && hasApiKey) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Great! I've analyzed your data file "${file.originalName}" and found ${file.rowCount} records. What would you like to explore?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } else if (file && !hasApiKey) {
      const apiKeyMessage: Message = {
        id: 'api-key-required',
        type: 'ai',
        content: 'To start analyzing your data, please configure your DeepSeek API key first.',
        timestamp: new Date(),
      };
      setMessages([apiKeyMessage]);
    }
  }, [file, hasApiKey]);

  const handleSendMessage = (query: string) => {
    if (!query.trim()) return;
    
    if (!hasApiKey) {
      onShowApiKeyModal();
      return;
    }

    analyzeMutation.mutate({ query, fileId: file.id });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const fileSchema = file?.schema;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Data Preview */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" data-testid="text-filename">
            {file?.originalName || 'Unknown File'}
          </h3>
          <span className="text-sm text-muted-foreground" data-testid="text-file-info">
            {fileSchema?.columns?.length || 0} columns, {file?.rowCount || 0} rows detected
          </span>
        </div>
        
        {fileSchema?.columns && (
          <div className="flex flex-wrap gap-2">
            {fileSchema.columns.slice(0, 8).map((column: any, index: number) => (
              <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                {column.name} ({column.type})
              </Badge>
            ))}
            {fileSchema.columns.length > 8 && (
              <Badge variant="outline">
                +{fileSchema.columns.length - 8} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" data-testid="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.type === 'user' ? 'chat-bubble-user text-white' : 'chat-bubble-ai text-card-foreground'} px-6 py-4 rounded-2xl ${message.type === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              {message.type === 'ai' && (
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">Lumina Assistant</span>
                </div>
              )}
              
              <p className="mb-2">{message.content}</p>
              
              {message.analysis && (
                <InsightCard analysis={message.analysis} />
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai text-card-foreground px-6 py-4 rounded-2xl rounded-bl-sm max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full typing-indicator"></div>
                  <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-sm text-muted-foreground">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-6 border-t border-border">
        {!hasApiKey && (
          <Card className="mb-4 border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm">
                  Please configure your DeepSeek API key to start analyzing your data.
                </p>
                <Button size="sm" onClick={onShowApiKeyModal} data-testid="button-configure-api-key">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex space-x-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasApiKey ? "Ask about your data..." : "Configure API key to continue"}
            disabled={!hasApiKey || isTyping}
            className="flex-1"
            data-testid="input-chat"
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!hasApiKey || !inputValue.trim() || isTyping}
            className="gradient-button"
            data-testid="button-send"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Reply Chips */}
        {hasApiKey && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestions.slice(0, 4).map((suggestion: string, index: number) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(suggestion)}
                disabled={isTyping}
                className="text-xs hover:bg-accent"
                data-testid={`button-suggestion-${index}`}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
