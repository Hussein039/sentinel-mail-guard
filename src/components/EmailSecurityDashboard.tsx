import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, AlertTriangle, CheckCircle, Clock, User, LogOut, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { useEmailMonitoring } from '@/hooks/useEmailMonitoring';
import { formatDistanceToNow } from 'date-fns';


const EmailSecurityDashboard = () => {
  const [emailToMonitor, setEmailToMonitor] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();
  const { 
    monitoredEmails, 
    emailScans, 
    quarantinedEmails, 
    loading, 
    addEmailToMonitor, 
    releaseQuarantinedEmail, 
    deleteQuarantinedEmail,
    quarantineEmail,
    simulateEmails 
  } = useEmailMonitoring();
  const { toast } = useToast();

  const handleAddEmail = async () => {
    if (!emailToMonitor.trim()) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      await addEmailToMonitor(emailToMonitor);
      setEmailToMonitor('');
      toast({
        title: "Email Added",
        description: `Now monitoring ${emailToMonitor} for threats`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add email for monitoring",
        variant: "destructive",
      });
    }
  };

  const handleReleaseEmail = async (emailId: string) => {
    try {
      await releaseQuarantinedEmail(emailId);
      toast({
        title: "Email Released",
        description: "Email has been released from quarantine",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to release email",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuarantined = async (emailId: string) => {
    try {
      await deleteQuarantinedEmail(emailId);
      toast({
        title: "Email Deleted",
        description: "Threat email has been permanently deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email",
        variant: "destructive",
      });
    }
  };

  const handleQuarantineEmail = async (emailId: string) => {
    try {
      await quarantineEmail(emailId);
      toast({
        title: "Email Quarantined",
        description: "Email has been moved to quarantine",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to quarantine email",
        variant: "destructive",
      });
    }
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
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
          
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          )}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="monitor">Email Monitoring</TabsTrigger>
            <TabsTrigger value="incoming">Incoming ({emailScans.filter(email => !monitoredEmails.some(monitored => monitored.email_address === email.sender_email)).length})</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing ({emailScans.filter(email => monitoredEmails.some(monitored => monitored.email_address === email.sender_email)).length})</TabsTrigger>
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
                  {!user ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Authentication Required</p>
                      <p className="text-muted-foreground mb-4">Sign in to start monitoring your emails</p>
                      <Button onClick={() => setShowAuthModal(true)}>
                        Sign In / Sign Up
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading monitored emails...</p>
                    </div>
                  ) : monitoredEmails.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No emails being monitored</p>
                      <p className="text-muted-foreground">Add an email address above to start monitoring</p>
                    </div>
                  ) : (
                    monitoredEmails.map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${email.status === 'active' ? 'bg-secure' : 'bg-muted'}`} />
                          <div>
                            <p className="font-medium text-foreground">{email.email_address}</p>
                            <p className="text-sm text-muted-foreground">
                              Last checked: {email.lastScan ? formatDistanceToNow(new Date(email.lastScan), { addSuffix: true }) : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {(email.threatCount || 0) > 0 ? (
                            <Badge variant="outline" className="text-threat border-threat">
                              {email.threatCount} threats
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-secure border-secure">
                              Clean
                            </Badge>
                          )}
                          <Badge variant={email.status === 'active' ? 'default' : 'secondary'}>
                            {email.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              simulateEmails(email.email_address);
                              toast({
                                title: "Simulating emails...",
                                description: "Generating sample emails for demonstration",
                              });
                            }}
                          >
                            Simulate Emails
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Emails</CardTitle>
                <CardDescription>
                  All incoming emails to your monitored addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!user ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Authentication Required</p>
                      <p className="text-muted-foreground mb-4">Sign in to view incoming emails</p>
                      <Button onClick={() => setShowAuthModal(true)}>
                        Sign In / Sign Up
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading incoming emails...</p>
                    </div>
                  ) : emailScans.filter(email => !monitoredEmails.some(monitored => monitored.email_address === email.sender_email)).length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No incoming emails</p>
                      <p className="text-muted-foreground">No incoming emails found for monitored addresses</p>
                    </div>
                  ) : (
                    emailScans
                      .filter(email => !monitoredEmails.some(monitored => monitored.email_address === email.sender_email))
                      .map((email) => (
                        <div key={email.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className={`text-${getThreatBadgeVariant(email.scan_result)} border-${getThreatBadgeVariant(email.scan_result)}`}>
                                  {email.scan_result}
                                </Badge>
                                <Badge variant="outline" className={`text-${getRiskBadgeVariant(email.risk_level)} border-${getRiskBadgeVariant(email.risk_level)}`}>
                                  {email.risk_level} risk
                                </Badge>
                                {email.is_quarantined && (
                                  <Badge variant="outline" className="text-quarantine border-quarantine">
                                    Quarantined
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{email.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                  From: {email.sender_email} → To: {email.recipient_email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Received: {formatDistanceToNow(new Date(email.email_received_at), { addSuffix: true })}
                                </p>
                                {email.content_preview && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{email.content_preview.slice(0, 100)}..."
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!email.is_quarantined && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuarantineEmail(email.id)}
                                  className="text-quarantine border-quarantine hover:bg-quarantine hover:text-quarantine-foreground"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Quarantine
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Outgoing Emails</CardTitle>
                <CardDescription>
                  All outgoing emails from your monitored addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!user ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Authentication Required</p>
                      <p className="text-muted-foreground mb-4">Sign in to view outgoing emails</p>
                      <Button onClick={() => setShowAuthModal(true)}>
                        Sign In / Sign Up
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading outgoing emails...</p>
                    </div>
                  ) : emailScans.filter(email => monitoredEmails.some(monitored => monitored.email_address === email.sender_email)).length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No outgoing emails</p>
                      <p className="text-muted-foreground">No outgoing emails found from monitored addresses</p>
                    </div>
                  ) : (
                    emailScans
                      .filter(email => monitoredEmails.some(monitored => monitored.email_address === email.sender_email))
                      .map((email) => (
                        <div key={email.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className={`text-${getThreatBadgeVariant(email.scan_result)} border-${getThreatBadgeVariant(email.scan_result)}`}>
                                  {email.scan_result}
                                </Badge>
                                <Badge variant="outline" className={`text-${getRiskBadgeVariant(email.risk_level)} border-${getRiskBadgeVariant(email.risk_level)}`}>
                                  {email.risk_level} risk
                                </Badge>
                                {email.is_quarantined && (
                                  <Badge variant="outline" className="text-quarantine border-quarantine">
                                    Quarantined
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{email.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                  From: {email.sender_email} → To: {email.recipient_email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Received: {formatDistanceToNow(new Date(email.email_received_at), { addSuffix: true })}
                                </p>
                                {email.content_preview && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{email.content_preview.slice(0, 100)}..."
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!email.is_quarantined && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuarantineEmail(email.id)}
                                  className="text-quarantine border-quarantine hover:bg-quarantine hover:text-quarantine-foreground"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Quarantine
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
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
                  {!user ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">Authentication Required</p>
                      <p className="text-muted-foreground mb-4">Sign in to view quarantined emails</p>
                      <Button onClick={() => setShowAuthModal(true)}>
                        Sign In / Sign Up
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading quarantined emails...</p>
                    </div>
                  ) : quarantinedEmails.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-secure mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No quarantined emails</p>
                      <p className="text-muted-foreground">All your monitored emails are clean!</p>
                    </div>
                  ) : (
                    quarantinedEmails.map((email) => (
                      <div key={email.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={`text-${getThreatBadgeVariant(email.scan_result)} border-${getThreatBadgeVariant(email.scan_result)}`}>
                                {email.scan_result}
                              </Badge>
                              <Badge variant="outline" className={`text-${getRiskBadgeVariant(email.risk_level)} border-${getRiskBadgeVariant(email.risk_level)}`}>
                                {email.risk_level} risk
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{email.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                From: {email.sender_email} → To: {email.recipient_email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Received: {formatDistanceToNow(new Date(email.email_received_at), { addSuffix: true })}
                              </p>
                              {email.content_preview && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  "{email.content_preview.slice(0, 100)}..."
                                </p>
                              )}
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
                    ))
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
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    </div>
  );
};

export default EmailSecurityDashboard;