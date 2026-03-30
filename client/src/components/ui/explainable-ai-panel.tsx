import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Database, BarChart3, TrendingUp, Workflow } from "lucide-react";

interface ExplainableAIProps {
  explanation: string;
  method: string;
  confidence: number;
  dataPoints: number;
}

export function ExplainableAIPanel({ explanation, method, confidence, dataPoints }: ExplainableAIProps) {
  return (
    <Card className="explanation-card">
      <CardContent className="p-4">
        <div className="flex items-center text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          How I generated this insight
        </div>
        <p className="text-sm mb-3">{explanation}</p>
        
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center text-xs">
            <Database className="w-3 h-3 mr-1 text-muted-foreground" />
            <span>{dataPoints} data points</span>
          </div>
          <div className="flex items-center text-xs">
            <BarChart3 className="w-3 h-3 mr-1 text-muted-foreground" />
            <span>{method}</span>
          </div>
          <div className="flex items-center text-xs">
            <TrendingUp className="w-3 h-3 mr-1 text-muted-foreground" />
            <span>{confidence}% confidence</span>
          </div>
          <div className="flex items-center text-xs">
            <Workflow className="w-3 h-3 mr-1 text-muted-foreground" />
            <span>AI-powered</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Trust score</span>
            <Badge variant="secondary" className="text-xs">
              {confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low'}
            </Badge>
          </div>
          <div className="mt-1 w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}