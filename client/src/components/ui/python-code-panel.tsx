import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PythonCodePanelProps {
  code: string;
}

export function PythonCodePanel({ code }: PythonCodePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Python code has been copied to your clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Show only first 3 lines when collapsed
  const truncatedCode = code.split('\n').slice(0, 3).join('\n') + (code.split('\n').length > 3 ? '\n...' : '');

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold flex items-center">
          <Code className="w-4 h-4 mr-2" />
          Generated Python Code
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
            onClick={toggleExpand}
            className="h-7 text-xs"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
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
        </CardContent>
      </Card>
    </div>
  );
}