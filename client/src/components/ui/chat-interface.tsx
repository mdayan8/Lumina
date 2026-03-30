import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, AlertTriangle, Database, Lightbulb, Workflow, BarChart3, TrendingUp, Zap, Sparkles, Clock, FileText, Save, Share2, Trash2, History, ChevronLeft, ChevronRight, Eye, LightbulbIcon, Minus, PanelLeft, PanelRight, Loader2 } from 'lucide-react';
import { InsightCard } from './insight-card';
import { ExplainableAIPanel } from './explainable-ai-panel';
import { ChatDashboardCommands } from './chat-dashboard-commands';
import { DashboardCommandProcessor } from '@/lib/dashboard-command-processor';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { PythonCodePanel } from './python-code-panel';
import { ExecutingCodePanel } from './executing-code-panel';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AgentAutocomplete } from './agent-autocomplete';
import { detectAgentMentions } from '@shared/agent-registry';
import { EnhancedAgentThinkingSteps, ThinkingStep } from './agent-thinking-steps';
import { AgentResponseCard } from './agent-response-card';
import { getAllAgents } from '@shared/agent-registry';
import { Brain, Droplets, BarChart } from 'lucide-react';

const AGENT_ICONS: Record<string, any> = {
  Brain,
  FileText,
  Droplets,
  BarChart,
  Database,
  Sparkles,
  Zap
};

const AgentWorkingStatus = ({ agentName }: { agentName: string }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Get agent info
  const agents = getAllAgents();
  const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase() || a.id.toLowerCase() === agentName.toLowerCase());
  const IconComponent = agent ? AGENT_ICONS[agent.icon] : Sparkles;

  const messages = [
    ...(agentName.toLowerCase() === 'scribe' ? ['Analyzing dataset structure...', 'Identifying key insights...', 'Drafting report sections...', 'Formatting output...'] : []),
    ...(agentName.toLowerCase() === 'helios' ? ['Scanning data distribution...', 'Selecting best visualization...', 'Preparing chart data...', 'Rendering graphics...'] : []),
    ...(agentName.toLowerCase() === 'athena' ? ['Decomposing query...', 'Routing to sub-agents...', 'Synthesizing results...', 'Finalizing response...'] : []),
    ...(agentName.toLowerCase() === 'hermes' ? ['Analyzing schema...', 'Constructing query...', 'Optimizing performance...', 'Executing SQL...'] : []),
    ...(agentName.toLowerCase() === 'aegis' ? ['Scanning for anomalies...', 'Checking data types...', 'Imputing missing values...', 'Standardizing formats...'] : []),
    ...(!['scribe', 'helios', 'athena', 'hermes', 'aegis'].includes(agentName.toLowerCase()) ? ['Analyzing request...', 'Processing data...', 'Generating insights...', 'Finalizing response...'] : [])
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [agentName]);

  return (
    <div className="flex items-center gap-3">
      {/* Animated Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden animate-pulse"
        style={{
          background: agent ? `linear-gradient(135deg, ${agent.color}30, ${agent.color}50)` : 'linear-gradient(135deg, #8B5CF620, #8B5CF640)',
          border: agent ? `1.5px solid ${agent.color}40` : '1.5px solid #8B5CF630'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        {agent?.avatar ? (
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-full h-full object-cover relative z-10"
          />
        ) : (
          <IconComponent
            className="w-4 h-4 relative z-10"
            style={{ color: agent?.color || '#8B5CF6' }}
          />
        )}
      </div>

      {/* Animated Text */}
      <span className="animate-in fade-in slide-in-from-bottom-1 duration-500" key={messageIndex}>
        {messages[messageIndex]}
      </span>
    </div>
  );
};

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  analysis?: any;
  sql?: any;
  anomalies?: any[];
  recommendations?: any[];
  workflow?: any[];
  explanation?: string;
  method?: string;
  confidence?: number;
  dataPoints?: number;
  timestamp: Date;
  chartData?: any;
  preview?: {
    columns: any[];
    rowCount: number;
    sampleRows: any[];
  };
  pythonCode?: string;
  agentName?: string;
  agentColor?: string;
  thinkingSteps?: ThinkingStep[];
  isAgentWorking?: boolean;
  metadata?: any;
  // Inline agent response fields
  chatSummary?: string;
  fullResultsAvailable?: boolean;
  sessionId?: string;
  agentId?: string;
}

interface ChatInterfaceProps {
  file: any;
  apiKey: string | null;
  hasApiKey: boolean;
  onShowApiKeyModal: () => void;
  initialAnalysis?: any;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onDashboardCommand?: (command: string) => void;
  onViewAgents?: (result?: any) => void;
}

export function ChatInterface({ file, apiKey, hasApiKey, onShowApiKeyModal, initialAnalysis, messages, setMessages, onDashboardCommand, onViewAgents }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [executingCode, setExecutingCode] = useState<string | null>(null);
  const [showExecutingCode, setShowExecutingCode] = useState(false);
  const [showAgentAutocomplete, setShowAgentAutocomplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Effect to handle automatic resizing when panels are collapsed
  useEffect(() => {
    // When output is collapsed, expand chat to full width
    // When chat is collapsed, expand output to full width
    // This creates a more dynamic and responsive layout
  }, [isOutputCollapsed, isChatCollapsed]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', file?.id],
    queryFn: async () => {
      if (!hasApiKey || !apiKey) return [];

      const token = localStorage.getItem("authToken");
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: file.id,
          apiKey
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to fetch suggestions');
      }

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

      const token = localStorage.getItem("authToken");

      // First, get the Python code that will be executed
      const codeResponse = await fetch('/api/generate-python-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId,
          query,
          apiKey
        }),
      });

      if (!codeResponse.ok) {
        if (codeResponse.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to generate Python code');
      }

      const codeData = await codeResponse.json();

      // Set the executing code to show in the UI
      setExecutingCode(codeData.pythonCode);
      setShowExecutingCode(true);

      // Now execute the analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId,
          query,
          apiKey
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to analyze data');
      }

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
        recommendations: data.recommendations,
        explanation: data.explanation || "I analyzed your data using statistical methods and identified key patterns and trends that match your query.",
        method: "Statistical Analysis",
        confidence: 92,
        dataPoints: file?.rowCount || 0,
        timestamp: new Date(),
        pythonCode: data.analysis.pythonCode
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      // Hide the executing code panel after a short delay
      setTimeout(() => {
        setShowExecutingCode(false);
      }, 3000);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message,
      });
      setIsTyping(false);
      setShowExecutingCode(false);
    }
  });

  const sqlMutation = useMutation({
    mutationFn: async ({ query, fileId }: { query: string; fileId: string }) => {
      if (!apiKey) {
        throw new Error('API key is required');
      }

      const token = localStorage.getItem("authToken");

      const response = await fetch('/api/sql-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId,
          query,
          apiKey
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to generate SQL');
      }

      return response.json();
    },
    onMutate: ({ query }) => {
      const userMessage: Message = {
        id: Date.now().toString() + '_sql',
        type: 'user',
        content: `SQL Query: ${query}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_sql_ai',
        type: 'ai',
        content: data.sql.explanation,
        sql: data.sql,
        explanation: "I translated your natural language query into a SQL statement by identifying the relevant tables, columns, and conditions needed to retrieve the requested information.",
        method: "Natural Language Processing",
        confidence: 95,
        dataPoints: file?.rowCount || 0,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "SQL Generation failed",
        description: error.message,
      });
      setIsTyping(false);
    }
  });

  const anomalyMutation = useMutation({
    mutationFn: async ({ fileId }: { fileId: string }) => {
      if (!apiKey) {
        throw new Error('API key is required');
      }

      const token = localStorage.getItem("authToken");

      const response = await fetch('/api/detect-anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId,
          apiKey
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to detect anomalies');
      }

      return response.json();
    },
    onMutate: () => {
      const userMessage: Message = {
        id: Date.now().toString() + '_anomaly',
        type: 'user',
        content: "Detect anomalies in my data",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_anomaly_ai',
        type: 'ai',
        content: `Detected ${data.anomalies.length} anomalies in your data.`,
        anomalies: data.anomalies,
        explanation: "I scanned your dataset using statistical methods to identify data points that deviate significantly from expected patterns, which could indicate errors or interesting events.",
        method: "Anomaly Detection Algorithm",
        confidence: 88,
        dataPoints: file?.rowCount || 0,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Anomaly Detection failed",
        description: error.message,
      });
      setIsTyping(false);
    }
  });

  const workflowMutation = useMutation({
    mutationFn: async ({ goal, fileId }: { goal: string; fileId: string }) => {
      if (!apiKey) {
        throw new Error('API key is required');
      }

      const token = localStorage.getItem("authToken");

      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId,
          goal,
          apiKey
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
        }
        throw new Error('Failed to generate workflow');
      }

      return response.json();
    },
    onMutate: ({ goal }) => {
      const userMessage: Message = {
        id: Date.now().toString() + '_workflow',
        type: 'user',
        content: `Create workflow for: ${goal}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_workflow_ai',
        type: 'ai',
        content: `Here's a guided workflow for your analysis:`,
        workflow: data.workflow,
        explanation: "I created this step-by-step workflow based on best practices for achieving your analysis goal, breaking it down into manageable tasks with clear actions.",
        method: "Workflow Generation",
        confidence: 90,
        dataPoints: file?.rowCount || 0,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Workflow Generation failed",
        description: error.message,
      });
      setIsTyping(false);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialAnalysis) {
      // Load the initial analysis
      const userMessage: Message = {
        id: Date.now().toString() + '_user',
        type: 'user',
        content: initialAnalysis.query,
        timestamp: new Date(initialAnalysis.createdAt),
      };

      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: initialAnalysis.response,
        analysis: {
          response: initialAnalysis.response,
          insights: initialAnalysis.insights,
          chartData: initialAnalysis.chartData,
        },
        explanation: initialAnalysis.explanation || "This analysis was generated by examining your data for patterns and trends related to your query.",
        method: initialAnalysis.method || "Historical Analysis",
        confidence: initialAnalysis.confidence || 85,
        dataPoints: file?.rowCount || 0,
        timestamp: new Date(initialAnalysis.createdAt),
        pythonCode: initialAnalysis.pythonCode
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
    } else if (file && hasApiKey && messages.length === 0) {
      const welcomeMessage: Message = {
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
      setMessages(prev => [...prev, welcomeMessage]);
    } else if (file && !hasApiKey && messages.length === 0) {
      const apiKeyMessage: Message = {
        id: 'api-key-required',
        type: 'ai',
        content: 'To start analyzing your data, please configure your DeepSeek API key first.',
        explanation: "I need your API key to access the DeepSeek AI engine that powers all data analysis capabilities.",
        method: "Authentication Required",
        confidence: 100,
        dataPoints: 0,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, apiKeyMessage]);
    }
  }, [file, hasApiKey, initialAnalysis]);

  // Save messages to localStorage whenever they change, associated with the current file
  useEffect(() => {
    if (messages.length > 0) {
      // Convert Date objects to strings for serialization
      const messagesToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem(`chatMessages_${file?.id || 'default'}`, JSON.stringify(messagesToSave));
    }
  }, [messages, file?.id]);

  const handleSendMessage = (query: string) => {
    if (!query.trim()) return;

    if (!hasApiKey) {
      onShowApiKeyModal();
      return;
    }

    // Check if this is a dashboard-related command
    const lowerQuery = query.toLowerCase();
    const isDashboardCommand = lowerQuery.includes('dashboard') ||
      lowerQuery.includes('lumadash') ||
      lowerQuery.includes('add') ||
      lowerQuery.includes('create') ||
      lowerQuery.includes('show') ||
      lowerQuery.includes('display') ||
      lowerQuery.includes('generate') ||
      lowerQuery.includes('remove') ||
      lowerQuery.includes('delete') ||
      lowerQuery.includes('update') ||
      lowerQuery.includes('modify') ||
      lowerQuery.includes('change') ||
      lowerQuery.includes('edit') ||
      lowerQuery.includes('theme') ||
      lowerQuery.includes('color') ||
      lowerQuery.includes('filter') ||
      lowerQuery.includes('sort') ||
      lowerQuery.includes('group') ||
      lowerQuery.includes('export') ||
      lowerQuery.includes('download') ||
      lowerQuery.includes('save') ||
      lowerQuery.includes('store') ||
      lowerQuery.includes('share') ||
      lowerQuery.includes('send') ||
      lowerQuery.includes('email') ||
      lowerQuery.includes('refresh') ||
      lowerQuery.includes('reload') ||
      lowerQuery.includes('sync') ||
      lowerQuery.includes('clear') ||
      lowerQuery.startsWith('/');

    if (isDashboardCommand) {
      // Handle dashboard commands
      const processedCommand = DashboardCommandProcessor.processCommand(query);

      if (processedCommand.success) {
        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: query,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Add AI response
        const aiMessage: Message = {
          id: Date.now().toString() + '_ai',
          type: 'ai',
          content: processedCommand.message,
          explanation: "I processed your dashboard command and executed the requested action.",
          method: "Dashboard Command Processing",
          confidence: 95,
          dataPoints: 0,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        // If we have a dashboard command handler, use it
        if (onDashboardCommand) {
          onDashboardCommand(query);
        }

        // Show toast notification
        toast({
          title: "Dashboard Command Processed",
          description: processedCommand.message,
        });

        return;
      }
    }

    // Check for @ mentions (agent invocation)
    const mentions = detectAgentMentions(query);
    if (mentions.length > 0) {
      // Agent message detected
      const agentName = mentions[0];
      setCurrentAgent(agentName);

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      // Call agent endpoint
      const token = localStorage.getItem("authToken");

      fetch('/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: file.id,
          message: query,
          apiKey
        })
      })
        .then(async res => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem("authToken");
              window.location.href = "/";
            }
            throw new Error('Agent execution failed');
          }
          return res.json();
        })
        .then(async data => {
          const results = data.session.results;
          const agentId = data.agent.id;

          // Import and use the summary generator
          const { generateAgentSummary } = await import('@/lib/agent-summary-generator');
          const summaryData = generateAgentSummary(agentId, results);

          let content = summaryData.summary;
          let explanation = "View full details in the Agents tab for complete analysis.";
          let analysisData = undefined;

          // Customize content based on agent results (for backwards compatibility)
          if (agentId === 'athena') {
            if (results.insights && results.insights.length > 0) {
              analysisData = {
                insights: results.insights,
              };
            }
          } else if (agentId === 'scribe') {
            explanation = "Full report is available in the Agents tab.";
          }

          const agentMessage: Message = {
            id: Date.now().toString() + '_agent',
            type: 'ai',
            content: content,
            method: `Agent: ${data.agent.displayName}`,
            confidence: 95,
            dataPoints: (results.rows || results.dataPoints || file?.rowCount || 0),
            timestamp: new Date(),
            agentName: data.agent.displayName,
            agentColor: data.agent.color,
            // Map specific results based on agent type
            sql: agentId === 'sql' ? results : undefined,
            pythonCode: agentId === 'viz' ? results.code : (agentId === 'athena' ? results.pythonCode : undefined),
            explanation: explanation,
            analysis: analysisData,
            // Inline agent response fields
            chatSummary: summaryData.summary,
            fullResultsAvailable: true,
            sessionId: data.session.id,
            agentId: agentId,
            // Pass the full results for the "View Result" button to potentially use
            metadata: {
              agentId,
              sessionId: data.session.id,
              highlights: summaryData.highlights,
              metrics: summaryData.metrics,
              chartData: summaryData.chartData,
              reportData: summaryData.reportData,
              fullResults: results
            }
          };

          setMessages(prev => [...prev, agentMessage]);
          setIsTyping(false);
          setCurrentAgent(null);

          toast({
            title: "Agent Complete",
            description: `${data.agent.displayName} has finished processing`
          });
        })
        .catch(error => {
          console.error('Agent error:', error);
          setIsTyping(false);
          setCurrentAgent(null);
          toast({
            variant: "destructive",
            title: "Agent Error",
            description: error.message
          });
        });

      return;
    }

    // Check if this is a special command
    if (query.toLowerCase().startsWith('/sql ')) {
      const sqlQuery = query.substring(5).trim();
      sqlMutation.mutate({ query: sqlQuery, fileId: file.id });
    } else if (query.toLowerCase() === '/anomalies') {
      anomalyMutation.mutate({ fileId: file.id });
    } else if (query.toLowerCase().startsWith('/workflow ')) {
      const goal = query.substring(10).trim();
      workflowMutation.mutate({ goal, fileId: file.id });
    } else {
      analyzeMutation.mutate({ query, fileId: file.id });
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const fileSchema = file?.schema;

  // Render anomalies
  const renderAnomalies = (anomalies: any[]) => {
    if (!anomalies || anomalies.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
          Detected Anomalies
        </h4>
        <div className="space-y-2">
          {anomalies.map((anomaly, index) => (
            <Card key={index} className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{anomaly.metric}</div>
                    <div className="text-sm text-muted-foreground">{anomaly.description}</div>
                  </div>
                  <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                    {anomaly.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm mt-2">
                  <div>Current: {anomaly.currentValue.toLocaleString()}</div>
                  <div>Expected: {anomaly.expectedValue.toLocaleString()}</div>
                  <div>Deviation: {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(2)}%</div>
                </div>
                {anomaly.recommendation && (
                  <div className="text-sm mt-2 italic">
                    Recommendation: {anomaly.recommendation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render SQL query
  const renderSQL = (sql: any) => {
    if (!sql) return null;

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          Generated SQL Query
        </h4>
        <Card className="bg-muted">
          <CardContent className="p-3 font-mono text-sm">
            <pre>{sql.query}</pre>
          </CardContent>
        </Card>
        <div className="mt-2 text-sm">
          <strong>Columns:</strong> {sql.columns.join(', ')}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {sql.explanation}
        </div>
      </div>
    );
  };

  // Render recommendations
  const renderRecommendations = (recommendations: any[]) => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-blue-500" />
          Smart Recommendations
        </h4>
        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <Card key={index} className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-sm text-muted-foreground">{rec.description}</div>
                  </div>
                  <Badge variant="secondary">{rec.type.toUpperCase()}</Badge>
                </div>
                {rec.suggestedQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => handleQuickQuestion(rec.suggestedQuery)}
                  >
                    Ask: {rec.suggestedQuery}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render workflow
  const renderWorkflow = (workflow: any[]) => {
    if (!workflow || workflow.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Workflow className="w-4 h-4 mr-2" />
          Guided Workflow
        </h4>
        <div className="space-y-3">
          {workflow.map((step, index) => (
            <Card key={step.id}>
              <CardContent className="p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{step.description}</div>
                    <div className="text-sm mt-2">
                      <strong>Action:</strong> {step.action}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estimated time: {step.estimatedTime}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render data preview
  const renderDataPreview = (preview: any) => {
    if (!preview || !preview.columns || !preview.sampleRows) return null;

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Data Preview (First 10 rows)
        </h4>
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-xs border-collapse min-w-full">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">#</th>
                {preview.columns.map((column: any, index: number) => (
                  <th
                    key={index}
                    className="border p-2 text-left relative min-w-[100px]"
                    onMouseEnter={() => setHoveredColumn(column.name)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    {column.name}
                    <div className="text-xs text-muted-foreground">{column.type}</div>
                    {hoveredColumn === column.name && (
                      <div className="absolute z-10 left-0 top-full mt-1 w-48 p-2 bg-card border rounded shadow-lg text-xs">
                        <div className="font-semibold mb-1">Suggestions:</div>
                        <ul className="space-y-1">
                          <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`Show me a chart of ${column.name}`)}>
                            Show chart of {column.name}
                          </li>
                          <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`What are the top values in ${column.name}?`)}>
                            Top values in {column.name}
                          </li>
                          <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`Analyze distribution of ${column.name}`)}>
                            Distribution of {column.name}
                          </li>
                        </ul>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.sampleRows.slice(0, 10).map((row: any, rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-muted/50' : 'bg-background'}
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="border p-2">{rowIndex + 1}</td>
                  {preview.columns.map((column: any, colIndex: number) => (
                    <td key={colIndex} className="border p-2 max-w-[200px] truncate">
                      {row[column.name] !== undefined ? String(row[column.name]) : ''}
                    </td>
                  ))}
                  {hoveredRow === rowIndex && (
                    <div className="absolute z-10 right-0 top-0 mt-8 mr-4 w-48 p-2 bg-card border rounded shadow-lg text-xs">
                      <div className="font-semibold mb-1">Row Actions:</div>
                      <ul className="space-y-1">
                        <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`Analyze row ${rowIndex + 1}`)}>
                          Analyze this row
                        </li>
                        <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`Compare row ${rowIndex + 1} with average`)}>
                          Compare with average
                        </li>
                      </ul>
                    </div>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Add a function to clear chat history for the current file
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem(`chatMessages_${file?.id || 'default'}`);
    toast({
      title: "Chat History Cleared",
      description: "Chat messages for this file have been removed.",
    });
  };

  // Add a function to load chat history for the current file
  const loadChatHistory = () => {
    const savedMessages = localStorage.getItem(`chatMessages_${file?.id || 'default'}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        toast({
          title: "Chat History Loaded",
          description: `Loaded ${messagesWithDates.length} messages from history.`,
        });
      } catch (e) {
        console.error('Failed to parse saved messages', e);
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: "Failed to load chat history.",
        });
      }
    } else {
      toast({
        title: "No History Found",
        description: "No saved chat history was found for this file.",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden">
      {/* Chat Section - Top on mobile, Left on desktop */}
      <div className={`${isChatCollapsed ? 'w-12' : isOutputCollapsed ? 'w-full md:w-full' : 'w-full md:w-1/2'} border-r-0 md:border-r border-b md:border-b-0 border-border flex flex-col transition-all duration-300 h-full overflow-hidden`}>
        {/* Chat Header with Collapse Button */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          {!isChatCollapsed && (
            <div>
              <h3 className="text-md font-semibold" data-testid="text-filename">
                <FileText className="w-4 h-4 inline mr-2" />
                Chat
              </h3>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newCollapsedState = !isChatCollapsed;
              setIsChatCollapsed(newCollapsedState);
              // When chat is collapsed, optionally expand output to use the space
              if (newCollapsedState && isOutputCollapsed) {
                setIsOutputCollapsed(false);
              }
            }}
            className="h-8 w-8 p-0 ml-auto"
          >
            {isChatCollapsed ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!isChatCollapsed && (
          <>
            {/* Data Preview */}
            <div className="bg-card border-b border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold" data-testid="text-filename">
                  <FileText className="w-4 h-4 inline mr-2" />
                  {file?.originalName || 'Unknown File'}
                </h3>
                <Badge variant="secondary" className="personalization-chip text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {file?.rowCount || 0} rows
                </Badge>
              </div>

              {fileSchema?.columns && (
                <div className="flex flex-wrap gap-1">
                  {fileSchema.columns.slice(0, 5).map((column: any, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-primary/10 text-primary text-xs relative"
                      onMouseEnter={() => setHoveredColumn(column.name)}
                      onMouseLeave={() => setHoveredColumn(null)}
                    >
                      {column.name}
                      {hoveredColumn === column.name && (
                        <div className="absolute z-10 left-0 top-full mt-1 w-48 p-2 bg-card border rounded shadow-lg text-xs">
                          <div className="font-semibold mb-1">Suggestions:</div>
                          <ul className="space-y-1">
                            <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`Show me a chart of ${column.name}`)}>
                              Show chart of {column.name}
                            </li>
                            <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`What are the top values in ${column.name}?`)}>
                              Top values in {column.name}
                            </li>
                            <li className="cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleQuickQuestion(`Analyze distribution of ${column.name}`)}>
                              Distribution of {column.name}
                            </li>
                          </ul>
                        </div>
                      )}
                    </Badge>
                  ))}
                  {fileSchema.columns.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{fileSchema.columns.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" data-testid="chat-messages">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-1">Welcome to Lumina Chat</h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Ask questions about your data or request visualizations
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion('Show me a chart of sales by region')}
                      className="personalization-chip text-xs"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Chart Example
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadChatHistory}
                      className="personalization-chip text-xs"
                    >
                      <History className="w-3 h-3 mr-1" />
                      Load History
                    </Button>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Check if this is an agent response with inline summary */}
                  {message.type === 'ai' && message.fullResultsAvailable && message.agentId ? (
                    <div className="max-w-full">
                      <AgentResponseCard
                        agentId={message.agentId}
                        agentName={message.agentName || 'Agent'}
                        agentColor={message.agentColor}
                        summary={message.chatSummary || message.content}
                        highlights={message.metadata?.highlights || []}
                        metrics={message.metadata?.metrics || {}}
                        chartData={message.metadata?.chartData}
                        reportData={message.metadata?.reportData}
                        onViewDetails={() => {
                          if (onViewAgents) {
                            onViewAgents(message.metadata?.fullResults || message.metadata);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`max-w-full ${message.type === 'user' ? 'chat-bubble-user text-white' : 'chat-bubble-ai text-card-foreground'} px-4 py-3 rounded-2xl ${message.type === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'} ${message.type === 'ai' ? 'cursor-pointer transition-all hover:shadow-md' : ''} ${selectedMessageId === message.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
                      onClick={() => {
                        if (message.type === 'ai') {
                          setSelectedMessageId(message.id);
                          // Expand output panel if collapsed
                          if (isOutputCollapsed) {
                            setIsOutputCollapsed(false);
                          }
                        }
                      }}
                    >
                      {message.type === 'ai' && (
                        <div className="flex items-center mb-1 justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-2">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-semibold text-sm">Lumina Assistant</span>
                          </div>
                          {selectedMessageId === message.id && (
                            <Badge variant="default" className="text-[10px] h-5">
                              <Eye className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      )}

                      <p className="mb-1 text-sm">{message.content}</p>

                      {message.preview && renderDataPreview(message.preview)}
                      {message.analysis && (
                        <InsightCard analysis={message.analysis} />
                      )}

                      {message.thinkingSteps && (
                        <div className="mt-2 mb-2">
                          <EnhancedAgentThinkingSteps steps={message.thinkingSteps} />
                        </div>
                      )}

                      {message.pythonCode && (
                        <PythonCodePanel code={message.pythonCode} />
                      )}

                      {message.sql && renderSQL(message.sql)}
                      {message.anomalies && renderAnomalies(message.anomalies)}
                      {message.recommendations && renderRecommendations(message.recommendations)}
                      {message.workflow && renderWorkflow(message.workflow)}

                      {message.explanation && (
                        <ExplainableAIPanel
                          explanation={message.explanation}
                          method={message.method || "Statistical Analysis"}
                          confidence={message.confidence || 90}
                          dataPoints={message.dataPoints || 0}
                        />
                      )}

                      {/* View Result Button for Agents - only show if not using AgentResponseCard */}
                      {message.type === 'ai' && !message.fullResultsAvailable && (message.analysis || message.sql || message.pythonCode) && onViewAgents && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent message selection when clicking button
                            onViewAgents && onViewAgents(message.analysis || message.sql || message.pythonCode || message.metadata);
                          }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          View Full Result in Agent Tab
                        </Button>
                      )}

                    </div>
                  )}
                </div>
              ))}



              {isTyping && (
                <div className="flex justify-start w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-muted/50 w-full shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Agent Avatar with Animation */}
                      {(() => {
                        const agents = getAllAgents();
                        const agent = currentAgent ? agents.find(a => a.name.toLowerCase() === currentAgent.toLowerCase() || a.id.toLowerCase() === currentAgent.toLowerCase()) : null;
                        const IconComponent = agent ? AGENT_ICONS[agent.icon] : Sparkles;

                        return (
                          <div
                            className="relative flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden animate-pulse"
                            style={{
                              background: agent ? `linear-gradient(135deg, ${agent.color}20, ${agent.color}40)` : 'linear-gradient(135deg, #8B5CF620, #8B5CF640)',
                              border: agent ? `2px solid ${agent.color}30` : '2px solid #8B5CF630'
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            <span className="absolute inset-0 rounded-lg ring-4 animate-ping duration-1000" style={{ ringColor: agent ? `${agent.color}10` : '#8B5CF610' }} />
                            {agent?.avatar ? (
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-full h-full object-cover relative z-10"
                              />
                            ) : (
                              <IconComponent
                                className="w-5 h-5 relative z-10"
                                style={{ color: agent?.color || '#8B5CF6' }}
                              />
                            )}
                          </div>
                        );
                      })()}

                      {/* Text Content */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {currentAgent ? (currentAgent.startsWith('@') ? currentAgent : `@${currentAgent}`) : 'Lumina AI'}
                          </span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            Working
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <AgentWorkingStatus agentName={currentAgent || 'Lumina'} />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Show executing code panel when code is being executed */}
              {showExecutingCode && executingCode && (
                <ExecutingCodePanel
                  code={executingCode}
                  isExecuting={isTyping}
                  onExecutionComplete={() => setShowExecutingCode(false)}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Clear and Load History Buttons - only show when using local state */}
            <div className="flex justify-end space-x-2 px-4 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadChatHistory}
                className="personalization-chip text-xs"
              >
                <History className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                className="personalization-chip text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border">
              {!hasApiKey && (
                <Card className="mb-3 border-yellow-500/20 bg-yellow-500/5">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <p className="text-xs">
                        Please configure your DeepSeek API key to start analyzing your data.
                      </p>
                      <Button size="sm" onClick={onShowApiKeyModal} data-testid="button-configure-api-key" className="h-6 text-xs px-2">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2 relative">
                {/* Agent Autocomplete */}
                <AgentAutocomplete
                  inputValue={inputValue}
                  cursorPosition={cursorPosition}
                  onSelectAgent={(agentName) => {
                    const textBeforeCursor = inputValue.slice(0, cursorPosition);
                    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

                    if (lastAtIndex >= 0) {
                      const beforeAt = inputValue.slice(0, lastAtIndex);
                      const afterCursor = inputValue.slice(cursorPosition);
                      const newValue = `${beforeAt}@${agentName} ${afterCursor}`;

                      setInputValue(newValue);
                      setShowAgentAutocomplete(false);

                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }
                  }}
                  isVisible={showAgentAutocomplete}
                />

                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cursorPos = e.target.selectionStart || 0;

                    setInputValue(value);
                    setCursorPosition(cursorPos);

                    // Check if @ was just typed
                    const textBeforeCursor = value.slice(0, cursorPos);
                    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

                    // Show autocomplete if @ is present and not completed
                    if (lastAtIndex >= 0) {
                      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
                      // Show if @ is at the end or followed by partial agent name (no spaces)
                      if (!textAfterAt.includes(' ')) {
                        setShowAgentAutocomplete(true);
                      } else {
                        setShowAgentAutocomplete(false);
                      }
                    } else {
                      setShowAgentAutocomplete(false);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={hasApiKey ? "Ask about your data or type @ for agents..." : "Configure API key to continue"}
                  disabled={!hasApiKey || isTyping}
                  className="flex-1 h-9 text-sm"
                  data-testid="input-chat"
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!hasApiKey || !inputValue.trim() || isTyping}
                  className="gradient-button h-9 w-9 p-0"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Dashboard Commands */}
              {hasApiKey && (
                <ChatDashboardCommands onCommand={handleSendMessage} />
              )}

              {/* Quick Reply Chips */}
              {hasApiKey && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(suggestion)}
                      disabled={isTyping}
                      className="text-xs hover:bg-accent personalization-chip h-6 px-2"
                      data-testid={`button-suggestion-${index}`}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Output Panel - Bottom on mobile, Right on desktop */}
      <div className={`${isOutputCollapsed ? 'w-12' : isChatCollapsed ? 'w-full md:w-full' : 'w-full md:w-1/2'} flex flex-col border-l-0 md:border-l border-t md:border-t-0 border-border transition-all duration-300 h-full overflow-hidden`}>
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          {!isOutputCollapsed && (
            <div>
              <h3 className="text-md font-semibold">Analysis Output</h3>
              <p className="text-xs text-muted-foreground">Results from your latest query</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newCollapsedState = !isOutputCollapsed;
              setIsOutputCollapsed(newCollapsedState);
              // When output is collapsed, optionally expand chat to use the space
              if (newCollapsedState && isChatCollapsed) {
                setIsChatCollapsed(false);
              }
            }}
            className="h-8 w-8 p-0 ml-auto"
          >
            {isOutputCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {!isOutputCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {messages.length > 0 ? (
              <div className="space-y-4">
                {/* Show the latest AI response */}
                {messages
                  .slice()
                  .reverse()
                  .find((msg) => msg.type === 'ai' && (msg.analysis || msg.analysis?.chartData)) ? (
                  <>
                    {messages
                      .slice()
                      .reverse()
                      .find((msg) => msg.type === 'ai')
                      ?.analysis && (
                        <InsightCard
                          analysis={
                            messages
                              .slice()
                              .reverse()
                              .find((msg) => msg.type === 'ai')
                              ?.analysis
                          }
                        />
                      )}

                    {/* Show Python code if available */}
                    {messages
                      .slice()
                      .reverse()
                      .find((msg) => msg.type === 'ai')
                      ?.pythonCode && (
                        <PythonCodePanel
                          code={
                            messages
                              .slice()
                              .reverse()
                              .find((msg) => msg.type === 'ai')
                              ?.pythonCode || ''
                          }
                        />
                      )}

                    {/* Show chart if available */}
                    {messages
                      .slice()
                      .reverse()
                      .find((msg) => msg.type === 'ai')
                      ?.analysis?.chartData && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Visualization</h4>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <ChartWrapper
                              data={
                                messages
                                  .slice()
                                  .reverse()
                                  .find((msg) => msg.type === 'ai')
                                  ?.analysis?.chartData
                              }
                            />
                          </div>
                        </div>
                      )}

                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Ask a question about your data to see insights and visualizations here.
                    </p>
                    <Button
                      onClick={() => handleQuickQuestion('Show me a chart of sales trends')}
                      className="gradient-button"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Try Example Query
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Data to Begin</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a CSV or Excel file to start analyzing your data with AI.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}