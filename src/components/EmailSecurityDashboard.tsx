import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, AlertTriangle, CheckCircle, Clock, Eye, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonitoredEmail {
  id: string;
  email: string;
  status: 'active' | 'inactive';
  threatsDetected: number;
  lastChecked: string;
}

interface QuarantinedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  threatType: 'spam' | 'phishing' | 'malware' | 'suspicious';
  receivedAt: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const EmailSecurityDashboard = () => {
  const [emailToMonitor, setEmailToMonitor] = useState('');
  const [monitoredEmails, setMonitoredEmails] = useState<MonitoredEmail[]>([
    {
      id: '1',
      email: 'john.doe@company.com',
      status: 'active',
      threatsDetected: 3,
      lastChecked: '2 minutes ago'
    },
    {
      id: '2',
      email: 'admin@website.org',
      status: 'active',
      threatsDetected: 0,
      lastChecked: '5 minutes ago'
    }
  ]);

  const [quarantinedEmails, setQuarantinedEmails] = useState<QuarantinedEmail[]>([
    {
      id: '1',
      from: 'suspicious@fake-bank.com',
      to: 'john.doe@company.com',
      subject: 'URGENT: Verify your account now!',
      threatType: 'phishing',
      receivedAt: '10 minutes ago',
      riskLevel: 'critical'
    },
    {
      id: '2',
      from: 'noreply@lottery-winner.net',
      to: 'john.doe@company.com',
      subject: 'Congratulations! You won $1,000,000',
      threatType: 'spam',
      receivedAt: '1 hour ago',
      riskLevel: 'medium'
    },
    {
      id: '3',
      from: 'admin@bank-security.fake',
      to: 'admin@website.org',
      subject: 'Security Alert - Click here immediately',
      threatType: 'malware',
      receivedAt: '2 hours ago',
      riskLevel: 'high'
    }
  ]);

  const { toast } = useToast();

  const handleAddEmail = () => {
    if (!emailToMonitor.trim()) return;
    
    const newEmail: MonitoredEmail = {
      id: Date.now().toString(),
      email: emailToMonitor,
      status: 'active',
      threatsDetected: 0,
      lastChecked: 'Just now'
    };
    
    setMonitoredEmails([...monitoredEmails, newEmail]);
    setEmailToMonitor('');
    toast({
      title: "Email Added",
      description: `Now monitoring ${emailToMonitor} for threats`,
    });
  };

  const handleReleaseEmail = (emailId: string) => {
    const email = quarantinedEmails.find(e => e.id === emailId);
    setQuarantinedEmails(quarantinedEmails.filter(e => e.id !== emailId));
    toast({
      title: "Email Released",
      description: `Email from ${email?.from} has been released to inbox`,
    });
  };

  const handleDeleteQuarantined = (emailId: string) => {
    const email = quarantinedEmails.find(e => e.id === emailId);
    setQuarantinedEmails(quarantinedEmails.filter(e => e.id !== emailId));
    toast({
      title: "Email Deleted",
      description: `Threat email from ${email?.from} has been permanently deleted`,
    });
  };

  const getThreatBadgeVariant = (threatType: string) => {
    switch (threatType) {
      case 'phishing': return 'threat';
      case 'malware': return 'threat';
      case 'spam': return 'quarantine';
      case 'suspicious': return 'warning';
      default: return 'secondary';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'threat';
      case 'high': return 'threat';
      case 'medium': return 'quarantine';
      case 'low': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Email Security Center</h1>
              <p className="text-muted-foreground">Monitor and protect your email communications</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{monitoredEmails.length}</div>
              <p className="text-xs text-muted-foreground">Active monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
              <AlertTriangle className="h-4 w-4 text-threat" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-threat">{quarantinedEmails.length}</div>
              <p className="text-xs text-muted-foreground">In quarantine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-secure" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secure">Protected</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2m</div>
              <p className="text-xs text-muted-foreground">ago</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitor">Email Monitoring</TabsTrigger>
            <TabsTrigger value="quarantine">Quarantine ({quarantinedEmails.length})</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-4">
            {/* Add Email to Monitor */}
            <Card>
              <CardHeader>
                <CardTitle>Add Email to Monitor</CardTitle>
                <CardDescription>
                  Enter an email address to start monitoring for threats and malicious content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={emailToMonitor}
                    onChange={(e) => setEmailToMonitor(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddEmail} className="px-6">
                    <Shield className="h-4 w-4 mr-2" />
                    Monitor
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Monitored Emails List */}
            <Card>
              <CardHeader>
                <CardTitle>Currently Monitored Emails</CardTitle>
                <CardDescription>
                  Real-time monitoring of incoming and outgoing email traffic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monitoredEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${email.status === 'active' ? 'bg-secure' : 'bg-muted'}`} />
                        <div>
                          <p className="font-medium text-foreground">{email.email}</p>
                          <p className="text-sm text-muted-foreground">Last checked: {email.lastChecked}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {email.threatsDetected > 0 ? (
                          <Badge variant="outline" className="text-threat border-threat">
                            {email.threatsDetected} threats
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-secure border-secure">
                            Clean
                          </Badge>
                        )}
                        <Badge variant={email.status === 'active' ? 'default' : 'secondary'}>
                          {email.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarantine" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quarantined Emails</CardTitle>
                <CardDescription>
                  Review and manage emails flagged as threats or spam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quarantinedEmails.map((email) => (
                    <div key={email.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`text-${getThreatBadgeVariant(email.threatType)} border-${getThreatBadgeVariant(email.threatType)}`}>
                              {email.threatType}
                            </Badge>
                            <Badge variant="outline" className={`text-${getRiskBadgeVariant(email.riskLevel)} border-${getRiskBadgeVariant(email.riskLevel)}`}>
                              {email.riskLevel} risk
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{email.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              From: {email.from} → To: {email.to}
                            </p>
                            <p className="text-xs text-muted-foreground">Received: {email.receivedAt}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReleaseEmail(email.id)}
                            className="text-secure border-secure hover:bg-secure hover:text-secure-foreground"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Release
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuarantined(email.id)}
                            className="text-threat border-threat hover:bg-threat hover:text-threat-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {quarantinedEmails.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-secure mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No quarantined emails</p>
                      <p className="text-muted-foreground">All your monitored emails are clean!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Configuration</CardTitle>
                <CardDescription>
                  Configure threat detection and monitoring settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Advanced threat protection is enabled. All incoming emails are scanned for malware, phishing attempts, and spam.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Scan Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Real-time scanning enabled</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Threat Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Last updated: Today</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailSecurityDashboard;