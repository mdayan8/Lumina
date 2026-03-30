import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Zap, Clock, TrendingUp } from "lucide-react";

interface PersonalizationPanelProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function PersonalizationPanel({ onSuggestionClick }: PersonalizationPanelProps) {
  // Mock data for personalization
  const recentPatterns = [
    { id: 1, name: "Sales Trends", frequency: "3x this week" },
    { id: 2, name: "Customer Segments", frequency: "2x this week" },
    { id: 3, name: "Revenue Analysis", frequency: "Daily" },
  ];

  const automatedTasks = [
    { id: 1, name: "Weekly Sales Report", schedule: "Every Monday at 9 AM" },
    { id: 2, name: "Anomaly Alerts", schedule: "Real-time" },
    { id: 3, name: "Customer Churn Prediction", schedule: "Every Friday" },
  ];

  const smartSuggestions = [
    "Compare Q3 vs Q4 sales performance",
    "Identify top 5 highest-value customers",
    "Analyze seasonal trends in your data",
    "Detect unusual spending patterns"
  ];

  return (
    <div className="space-y-6">
      <Card className="insight-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-primary" />
            Personalized Insights
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your analysis patterns, here are insights you might find valuable:
          </p>
          <div className="space-y-3">
            {recentPatterns.map((pattern) => (
              <div key={pattern.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <div className="font-medium">{pattern.name}</div>
                  <div className="text-xs text-muted-foreground">{pattern.frequency}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="insight-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Automated Tasks
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set up recurring analyses and alerts:
          </p>
          <div className="space-y-3">
            {automatedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <div className="font-medium">{task.name}</div>
                  <div className="text-xs text-muted-foreground">{task.schedule}</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="insight-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Smart Suggestions
          </h3>
          <div className="space-y-2">
            {smartSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start text-xs personalization-chip"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}