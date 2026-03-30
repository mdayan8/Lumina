import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AgentWorkspace } from "@/components/ui/agent-workspace";
import { AgentsTab } from "@/components/ui/agents-tab";
import { Message } from "@/components/ui/chat-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { ChatInterface } from "@/components/ui/chat-interface";
import { ApiKeyModal } from "@/components/ui/api-key-modal";
import { PersonalizationPanel } from "@/components/ui/personalization-panel";
import { AutomationPanel } from "@/components/ui/automation-panel";
import { AdvancedLumaDash } from "@/components/ui/advanced-lumadash";
import { useApiKey } from "@/hooks/use-api-key";
import { Settings, Home, FileText, MessageSquare, Trash2, Sun, Moon, Sparkles, Zap, BarChart3, MessageCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

export default function AppPage() {
  const [, setLocation] = useLocation();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [selectedAgentResult, setSelectedAgentResult] = useState<any>(null);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'dashboard' | 'agents'>('chat');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { apiKey, hasApiKey } = useApiKey();
  const { theme, setTheme } = useTheme();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLocation("/");
    }
  }, [setLocation]);

  const { data: analyses = [], isLoading, error } = useQuery({
    queryKey: ['analyses'],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch('/api/analyses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          setLocation("/");
        }
        throw new Error('Failed to fetch analyses');
      }
      return res.json();
    },
    enabled: true,
  });

  const { data: files = [], isLoading: filesLoading, error: filesError } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          setLocation("/");
        }
        throw new Error('Failed to fetch files');
      }
      return res.json();
    },
    enabled: true,
  });

  const handleFileUploaded = (file: any, summaryMessage?: any) => {
    setCurrentFile(file);
    setSelectedAnalysis(null); // Reset selected analysis when new file is uploaded

    // Load messages for this file
    const savedMessages = localStorage.getItem(`chatMessages_${file.id}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (e) {
        console.error('Failed to parse saved messages', e);
        // Use the provided summary message or create a default one
        const messageToAdd: Message = summaryMessage || {
          id: 'welcome',
          type: 'ai',
          content: "Hi! Your data has been loaded successfully.",
          explanation: "I've scanned your file to understand its structure, including column names and data types, to prepare for your analysis questions.",
          method: "Data Profiling",
          confidence: 98,
          dataPoints: file?.rowCount || 0,
          timestamp: new Date(),
          preview: {
            columns: file.schema?.columns || [],
            rowCount: file.rowCount || 0,
            sampleRows: file.schema?.previewData || []
          }
        };

        // Clear existing messages and add summary message
        setMessages([messageToAdd]);
      }
    } else {
      // Use the provided summary message or create a default one
      const messageToAdd: Message = summaryMessage || {
        id: 'welcome',
        type: 'ai',
        content: "Hi! Your data has been loaded successfully.",
        explanation: "I've scanned your file to understand its structure, including column names and data types, to prepare for your analysis questions.",
        method: "Data Profiling",
        confidence: 98,
        dataPoints: file?.rowCount || 0,
        timestamp: new Date(),
        preview: {
          columns: file.schema?.columns || [],
          rowCount: file.rowCount || 0,
          sampleRows: file.schema?.previewData || []
        }
      };

      // Clear existing messages and add summary message
      setMessages([messageToAdd]);
    }
  };

  // State for chat messages - now managed per file
  const [messages, setMessages] = useState<Message[]>([]);

  // Save messages to localStorage whenever they change and we have a file
  useEffect(() => {
    if (currentFile && messages.length > 0) {
      // Convert Date objects to strings for serialization
      const messagesToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem(`chatMessages_${currentFile.id}`, JSON.stringify(messagesToSave));
    }
  }, [messages, currentFile]);

  // Load messages for the current file when it changes
  useEffect(() => {
    if (currentFile) {
      const savedMessages = localStorage.getItem(`chatMessages_${currentFile.id}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } catch (e) {
          console.error('Failed to parse saved messages', e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [currentFile]);

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleLoadAnalysis = (analysis: any) => {
    // Find the file associated with this analysis
    const file = (files as any[]).find((f: any) => f.id === analysis.fileId);

    if (file) {
      setCurrentFile(file);
      setSelectedAnalysis(analysis);

      // Load messages for this file
      const savedMessages = localStorage.getItem(`chatMessages_${file.id}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } catch (e) {
          console.error('Failed to parse saved messages', e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      // If file not found, still set the analysis but show a message
      setSelectedAnalysis(analysis);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, analysisQuery: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          setLocation("/");
          return;
        }
        throw new Error('Failed to delete analysis');
      }

      // Refresh the analyses list
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast({
        title: "Analysis deleted",
        description: `Successfully deleted analysis: "${analysisQuery}"`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete analysis. Please try again.",
      });
      console.error('Delete analysis error:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSuggestionClick = (suggestion: string) => {
    // This would typically send the suggestion to the chat
    console.log("Suggestion clicked:", suggestion);
  };

  const handleAddChart = async (command: string) => {
    // This would typically call an API to process the natural language command
    console.log("Adding chart with command:", command);
    // In a real implementation, this would process the command and add the chart to the dashboard
  };

  const handleRemoveChart = (chartId: string) => {
    // This would typically remove the chart from the dashboard
    console.log("Removing chart with ID:", chartId);
  };

  const handleUpdateChart = (chartId: string, updates: any) => {
    // This would typically update the chart configuration
    console.log("Updating chart with ID:", chartId, "with updates:", updates);
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
            {/* View Toggle Buttons */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === 'chat' ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                variant={viewMode === 'dashboard' ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('dashboard')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={viewMode === 'agents' ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('agents')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Agents
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
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

      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 bg-card border-r border-border p-6 overflow-y-auto max-h-screen flex-shrink-0">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recent Analyses
              </h2>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPersonalization(!showPersonalization)}
                  className={showPersonalization ? "bg-accent" : ""}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAutomation(!showAutomation)}
                  className={showAutomation ? "bg-accent" : ""}
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showPersonalization ? (
              <PersonalizationPanel onSuggestionClick={handleSuggestionClick} />
            ) : showAutomation ? (
              <AutomationPanel />
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Loading analyses...
                    </div>
                  ) : Array.isArray(analyses) && analyses.length > 0 ? (
                    analyses.slice(0, 5).map((analysis: any) => (
                      <Card
                        key={analysis.id}
                        className="hover:bg-accent transition-colors cursor-pointer insight-card"
                        onClick={() => handleLoadAnalysis(analysis)}
                      >
                        <CardContent className="p-3 relative">
                          <div className="cursor-pointer">
                            <div className="text-sm font-medium truncate">{analysis.query}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnalysis(analysis.id, analysis.query);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No analyses yet
                    </div>
                  )}
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
                        className="w-full text-left justify-start text-xs personalization-chip"
                        disabled={!currentFile}
                        data-testid={`button-quick-question-${index}`}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          {!currentFile ? (
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
              <div className="max-w-2xl w-full">
                <FileUpload onFileUploaded={handleFileUploaded} />
              </div>
            </div>
          ) : viewMode === 'chat' ? (
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                file={currentFile}
                apiKey={apiKey}
                hasApiKey={hasApiKey}
                onShowApiKeyModal={() => setShowApiKeyModal(true)}
                initialAnalysis={selectedAnalysis}
                messages={messages}
                setMessages={setMessages}
                onDashboardCommand={handleAddChart}
                onViewAgents={(result) => {
                  setSelectedAgentResult(result);
                  setViewMode('agents');
                }}
              />
            </div>
          ) : viewMode === 'agents' ? (
            <div className="flex-1 overflow-auto">
              <AgentsTab
                fileId={currentFile?.id}
                apiKey={apiKey}
                initialResult={selectedAgentResult}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <AdvancedLumaDash
                file={currentFile}
                onAddChart={handleAddChart}
                onRemoveChart={handleRemoveChart}
                onUpdateChart={handleUpdateChart}
              />
            </div>
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