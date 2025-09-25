import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { ChatInterface } from "@/components/ui/chat-interface";
import { ApiKeyModal } from "@/components/ui/api-key-modal";
import { useApiKey } from "@/hooks/use-api-key";
import { Settings, Home, FileText, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AppPage() {
  const [, setLocation] = useLocation();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const { apiKey, hasApiKey } = useApiKey();

  const { data: analyses = [] } = useQuery({
    queryKey: ['/api/analyses'],
    enabled: !!currentFile,
  });

  const { data: files = [] } = useQuery({
    queryKey: ['/api/files'],
  });

  const handleFileUploaded = (file: any) => {
    setCurrentFile(file);
  };

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* App Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold gradient-text">Lumina</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowApiKeyModal(true)}
              data-testid="button-api-key"
            >
              <Settings className="w-4 h-4 mr-2" />
              API Key
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleBackToLanding}
              data-testid="button-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Recent Analyses
            </h2>
            <div className="space-y-3">
              {Array.isArray(analyses) && analyses.length > 0 ? (
                analyses.slice(0, 5).map((analysis: any) => (
                  <Card key={analysis.id} className="cursor-pointer hover:bg-accent transition-colors">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium truncate">{analysis.query}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No analyses yet
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Quick Questions
            </h2>
            <div className="space-y-2">
              {[
                'Top 5 customers by revenue?',
                'Monthly sales trends?',
                'Cost breakdown analysis?',
                'Customer churn prediction?'
              ].map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start text-xs"
                  disabled={!currentFile}
                  data-testid={`button-quick-question-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {!currentFile ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-2xl w-full">
                <FileUpload onFileUploaded={handleFileUploaded} />
              </div>
            </div>
          ) : (
            <ChatInterface 
              file={currentFile} 
              apiKey={apiKey}
              hasApiKey={hasApiKey}
              onShowApiKeyModal={() => setShowApiKeyModal(true)}
            />
          )}
        </main>
      </div>

      <ApiKeyModal 
        open={showApiKeyModal} 
        onOpenChange={setShowApiKeyModal} 
      />
    </div>
  );
}
