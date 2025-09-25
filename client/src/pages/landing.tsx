import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Upload, MessageCircle, Download, Zap, TrendingUp, Users, DollarSign } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/app");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold gradient-text">Lumina</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#usecases" className="text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost">Sign In</Button>
              <Button onClick={handleGetStarted} className="gradient-button pulse-glow">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Floating 3D Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-animation absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl transform rotate-12" style={{animationDelay: '0s'}}></div>
          <div className="floating-animation absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-full" style={{animationDelay: '1s'}}></div>
          <div className="floating-animation absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-lg transform -rotate-12" style={{animationDelay: '2s'}}></div>
          <div className="floating-animation absolute bottom-20 right-32 w-14 h-14 bg-gradient-to-br from-secondary/25 to-primary/25 rounded-xl transform rotate-45" style={{animationDelay: '3s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Turn Data Into <span className="gradient-text">Decisions</span><br />
            Through Conversation
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload spreadsheets. Ask questions. Get insights instantly. Powered by DeepSeek AI that understands your business data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleGetStarted} size="lg" className="gradient-button pulse-glow">
              Get Started for Free
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
          
          {/* Interactive Chat Preview */}
          <div className="mt-16 max-w-2xl mx-auto">
            <Card className="card-3d glow-purple">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="chat-bubble-user text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs">
                      What were my top 5 customers last quarter?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="chat-bubble-ai text-card-foreground px-4 py-2 rounded-2xl rounded-bl-sm max-w-md">
                      Based on your Q3 data, here are your top 5 customers by revenue: TechCorp ($24K), InnovateLLC ($18K), DataSys ($15K), CloudGen ($12K), and StartupHub ($9K). TechCorp represents 31% of your top-tier revenue.
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full typing-indicator"></div>
                      <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features for Modern Analytics</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to transform your spreadsheets into actionable business insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-3d neon-border">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">One-Click Upload</h3>
                <p className="text-muted-foreground">
                  Drag and drop Excel or CSV files. Our AI instantly understands your data structure and prepares it for analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="card-3d neon-border">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Chat with Data</h3>
                <p className="text-muted-foreground">
                  Ask questions in plain English. Get instant insights, trends, and recommendations powered by DeepSeek AI.
                </p>
              </CardContent>
            </Card>

            <Card className="card-3d neon-border">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4 flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Export Reports</h3>
                <p className="text-muted-foreground">
                  Generate beautiful PDF reports with charts and insights. Share findings with your team instantly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Every Business Need</h2>
            <p className="text-xl text-muted-foreground">
              From sales analysis to financial planning, Lumina adapts to your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Card className="insight-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-6 h-6 text-primary mr-2" />
                    <h3 className="text-2xl font-semibold gradient-text">Sales Analytics</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Which products drove the most revenue last quarter?"
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Top Performers:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Product A</span>
                        <span className="text-primary font-semibold">$124K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Product B</span>
                        <span className="text-primary font-semibold">$98K</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="insight-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-primary mr-2" />
                    <h3 className="text-2xl font-semibold gradient-text">Customer Insights</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Show me customer retention trends and at-risk accounts"
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-green-400 mb-2">✓ 85% retention rate</p>
                    <p className="text-sm text-yellow-400">⚠ 12 accounts need attention</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="insight-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-6 h-6 text-primary mr-2" />
                    <h3 className="text-2xl font-semibold gradient-text">Financial Planning</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "What's our projected cash flow for next quarter?"
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-end justify-around px-4 pb-4">
                      <div className="bg-primary w-4 h-16 rounded"></div>
                      <div className="bg-primary w-4 h-20 rounded"></div>
                      <div className="bg-primary w-4 h-12 rounded"></div>
                      <div className="bg-primary w-4 h-24 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="insight-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Zap className="w-6 h-6 text-primary mr-2" />
                    <h3 className="text-2xl font-semibold gradient-text">Operations</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Identify cost optimization opportunities"
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-primary mb-2">💡 Potential savings: $15K/month</p>
                    <p className="text-sm text-muted-foreground">Reduce vendor A spend by 20%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Start free, scale as you grow. All plans include DeepSeek AI integration.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="card-3d">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Free</h3>
                <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-muted-foreground">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> 5 queries/month</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Basic insights</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Your own API key</li>
                </ul>
                <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="card-3d">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Starter</h3>
                <div className="text-4xl font-bold mb-4">$49<span className="text-lg text-muted-foreground">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> 100 queries/month</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> PDF export</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Basic charts</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Choose Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="card-3d glow-purple-strong border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Business</h3>
                <div className="text-4xl font-bold mb-4">$99<span className="text-lg text-muted-foreground">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Unlimited queries</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Smart suggestions</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> History & search</li>
                </ul>
                <Button className="w-full gradient-button">
                  Choose Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="card-3d">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Enterprise</h3>
                <div className="text-4xl font-bold mb-4">$199<span className="text-lg text-muted-foreground">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Multi-user access</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Custom reports</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Priority support</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold gradient-text">Lumina</span>
            </div>
            <p className="text-muted-foreground">© 2024 Lumina. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
