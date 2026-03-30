import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Bell, FileText, TrendingUp } from "lucide-react";

export function AutomationPanel() {
  // Mock data for automation
  const automatedReports = [
    { id: 1, name: "Weekly Sales Summary", schedule: "Every Monday at 9 AM", lastRun: "2 days ago" },
    { id: 2, name: "Monthly Financial Report", schedule: "1st of every month", lastRun: "1 week ago" },
    { id: 3, name: "Customer Churn Analysis", schedule: "Every Friday", lastRun: "1 day ago" },
  ];

  const proactiveAlerts = [
    { id: 1, name: "Revenue Drop Alert", trigger: "When revenue drops >15%", status: "Active" },
    { id: 2, name: "High-Value Customer Alert", trigger: "New customer >$10K", status: "Active" },
    { id: 3, name: "Data Anomaly Alert", trigger: "Unusual patterns detected", status: "Active" },
  ];

  const workflowTriggers = [
    { id: 1, name: "Quarterly Business Review", trigger: "Start of each quarter", nextRun: "Jan 1, 2024" },
    { id: 2, name: "Budget Planning Workflow", trigger: "November annually", nextRun: "Nov 1, 2023" },
  ];

  return (
    <div className="space-y-6">
      <Card className="insight-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Automated Reports
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Schedule recurring reports to be delivered automatically:
          </p>
          <div className="space-y-3">
            {automatedReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-xs text-muted-foreground">{report.schedule}</div>
                  <div className="text-xs text-muted-foreground">Last run: {report.lastRun}</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Edit
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4 gradient-button">
            <Zap className="w-4 h-4 mr-2" />
            Create New Report
          </Button>
        </CardContent>
      </Card>

      <Card className="insight-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary" />
            Proactive Alerts
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified when important events occur in your data:
          </p>
          <div className="space-y-3">
            {proactiveAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <div className="font-medium">{alert.name}</div>
                  <div className="text-xs text-muted-foreground">Trigger: {alert.trigger}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {alert.status}
                </Badge>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4 gradient-button">
            <Bell className="w-4 h-4 mr-2" />
            Create New Alert
          </Button>
        </CardContent>
      </Card>

      <Card className="insight-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Workflow Triggers
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Automate complex analyses based on schedules or events:
          </p>
          <div className="space-y-3">
            {workflowTriggers.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-xs text-muted-foreground">Trigger: {workflow.trigger}</div>
                  <div className="text-xs text-muted-foreground">Next run: {workflow.nextRun}</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Configure
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4 gradient-button">
            <Clock className="w-4 h-4 mr-2" />
            Create New Workflow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}