import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExecutingCodePanelProps {
  code: string;
  isExecuting: boolean;
  onExecutionComplete: () => void;
}

export function ExecutingCodePanel({ code, isExecuting, onExecutionComplete }: ExecutingCodePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // Auto-collapse when execution is complete
  useEffect(() => {
    if (!isExecuting) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
        onExecutionComplete();
      }, 3000); // Collapse after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isExecuting, onExecutionComplete]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Python code has been copied to your clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Show only first 5 lines when collapsed
  const truncatedCode = code.split('\n').slice(0, 5).join('\n') + (code.split('\n').length > 5 ? '\n...' : '');

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold flex items-center">
          <Code className="w-4 h-4 mr-2" />
          {isExecuting ? 'Executing Python Code...' : 'Python Code Execution'}
        </h4>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard}
            className="h-7 text-xs"
          >
            {isCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {isCopied ? 'Copied' : 'Copy'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card className="bg-muted border">
        <CardContent className="p-3">
          <pre className="text-xs font-mono overflow-x-auto max-h-60">
            <code>
              {isExpanded ? code : truncatedCode}
            </code>
          </pre>
          {isExecuting && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <div className="flex space-x-1 mr-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
              <span>Running Python code in secure sandbox...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}