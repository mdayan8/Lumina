import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Download, Share, TrendingUp, Users, DollarSign, BarChart } from 'lucide-react';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface InsightCardProps {
  analysis: {
    response: string;
    insights?: {
      keyFindings?: string[];
      recommendations?: string[];
      metrics?: Record<string, any>;
    };
    chartData?: {
      type: string;
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
      }>;
    };
  };
}

export function InsightCard({ analysis }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleExportPDF = () => {
    try {
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(92, 75, 186); // Primary color
      pdf.text('Lumina Data Analysis Report', 20, 20);
      
      // Timestamp
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, 30);
      
      // Analysis content
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      let yPos = 50;
      const maxWidth = 170;
      
      // Split text into lines that fit the page width
      const lines = pdf.splitTextToSize(analysis.response, maxWidth);
      lines.forEach((line: string) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, 20, yPos);
        yPos += 6;
      });
      
      // Key findings
      if (analysis.insights?.keyFindings?.length) {
        yPos += 10;
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(92, 75, 186);
        pdf.text('Key Findings:', 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        analysis.insights.keyFindings.forEach((finding, index) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`• ${finding}`, 25, yPos);
          yPos += 8;
        });
      }
      
      // Recommendations
      if (analysis.insights?.recommendations?.length) {
        yPos += 10;
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(92, 75, 186);
        pdf.text('Recommendations:', 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        analysis.insights.recommendations.forEach((rec, index) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`• ${rec}`, 25, yPos);
          yPos += 8;
        });
      }
      
      pdf.save(`lumina-analysis-${Date.now()}.pdf`);
      
      toast({
        title: "PDF exported successfully!",
        description: "Your analysis report has been downloaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to generate PDF report.",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Lumina Analysis',
        text: analysis.response.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(analysis.response);
      toast({
        title: "Copied to clipboard",
        description: "Analysis text has been copied to clipboard.",
      });
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'revenue':
      case 'sales':
      case 'financial':
        return <DollarSign className="w-4 h-4" />;
      case 'customer':
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'trend':
      case 'growth':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <BarChart className="w-4 h-4" />;
    }
  };

  return (
    <Card className="insight-card mt-4">
      <CardContent className="p-6">
        <div className="grid gap-6">
          {/* Chart Section */}
          {analysis.chartData && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                {getInsightIcon(analysis.chartData.type)}
                <span className="ml-2">Data Visualization</span>
              </h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <ChartWrapper data={analysis.chartData} />
              </div>
            </div>
          )}

          {/* Insights Section */}
          {analysis.insights && (
            <div className="space-y-4">
              {analysis.insights.keyFindings && analysis.insights.keyFindings.length > 0 && (
                <div>
                  <h5 className="font-semibold text-primary mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Key Insights
                  </h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {analysis.insights.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2 mt-1">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.insights.recommendations && analysis.insights.recommendations.length > 0 && (
                <div className={`${!isExpanded && analysis.insights.recommendations.length > 2 ? 'max-h-20 overflow-hidden' : ''}`}>
                  <h5 className="font-semibold text-secondary mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Recommendations
                  </h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {analysis.insights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-secondary mr-2 mt-1">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {analysis.insights.recommendations.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 text-xs"
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </Button>
                  )}
                </div>
              )}

              {analysis.insights.metrics && Object.keys(analysis.insights.metrics).length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2">Key Metrics</h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis.insights.metrics).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="bg-primary/5 text-primary">
                        {key}: {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-4 border-t border-border">
          <Button
            onClick={handleExportPDF}
            className="gradient-button"
            size="sm"
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
