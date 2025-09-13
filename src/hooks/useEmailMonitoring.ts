import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export interface MonitoredEmail {
  id: string;
  email_address: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  threatCount?: number;
  lastScan?: string;
}

export interface EmailScan {
  id: string;
  message_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  content_preview?: string;
  scan_result: 'clean' | 'spam' | 'phishing' | 'malware' | 'suspicious';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  is_quarantined: boolean;
  threat_details?: any;
  scanned_at: string;
  email_received_at: string;
}

export function useEmailMonitoring() {
  const { user } = useAuth();
  const [monitoredEmails, setMonitoredEmails] = useState<MonitoredEmail[]>([]);
  const [emailScans, setEmailScans] = useState<EmailScan[]>([]);
  const [quarantinedEmails, setQuarantinedEmails] = useState<EmailScan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch monitored emails
  const fetchMonitoredEmails = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('monitored_emails')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching monitored emails:', error);
      return;
    }

    // Get threat counts for each monitored email
    const emailsWithStats = await Promise.all(
      data.map(async (email) => {
        const { count: threatCount } = await supabase
          .from('email_scans')
          .select('*', { count: 'exact', head: true })
          .eq('monitored_email_id', email.id)
          .neq('scan_result', 'clean');

        const { data: lastScan } = await supabase
          .from('email_scans')
          .select('scanned_at')
          .eq('monitored_email_id', email.id)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: email.id,
          email_address: email.email_address,
          status: email.status as 'active' | 'inactive',
          created_at: email.created_at,
          updated_at: email.updated_at,
          threatCount: threatCount || 0,
          lastScan: lastScan?.scanned_at
        };
      })
    );

    setMonitoredEmails(emailsWithStats);
  };

  // Fetch email scans
  const fetchEmailScans = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('email_scans')
      .select(`
        *,
        monitored_emails!inner(user_id)
      `)
      .eq('monitored_emails.user_id', user.id)
      .order('email_received_at', { ascending: false });

    if (error) {
      console.error('Error fetching email scans:', error);
      return;
    }

    const typedData = data?.map(scan => ({
      id: scan.id,
      message_id: scan.message_id,
      sender_email: scan.sender_email,
      recipient_email: scan.recipient_email,
      subject: scan.subject,
      content_preview: scan.content_preview,
      scan_result: scan.scan_result as 'clean' | 'spam' | 'phishing' | 'malware' | 'suspicious',
      risk_level: scan.risk_level as 'low' | 'medium' | 'high' | 'critical',
      is_quarantined: scan.is_quarantined,
      threat_details: scan.threat_details,
      scanned_at: scan.scanned_at,
      email_received_at: scan.email_received_at
    })) || [];

    setEmailScans(typedData);
    setQuarantinedEmails(typedData.filter(scan => scan.is_quarantined));
  };

  // Add email to monitoring
  const addEmailToMonitor = async (emailAddress: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('monitored_emails')
      .insert({
        user_id: user.id,
        email_address: emailAddress,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    await fetchMonitoredEmails();
    return data;
  };

  // Release quarantined email
  const releaseQuarantinedEmail = async (scanId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('email_scans')
      .update({ is_quarantined: false })
      .eq('id', scanId);

    if (error) throw error;

    await fetchEmailScans();
  };

  // Delete quarantined email
  const deleteQuarantinedEmail = async (scanId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('email_scans')
      .delete()
      .eq('id', scanId);

    if (error) throw error;

    await fetchEmailScans();
  };

  useEffect(() => {
    if (user) {
      fetchMonitoredEmails();
      fetchEmailScans();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const emailScansChannel = supabase
      .channel('email_scans_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_scans'
        },
        () => {
          fetchEmailScans();
          fetchMonitoredEmails();
        }
      )
      .subscribe();

    const monitoredEmailsChannel = supabase
      .channel('monitored_emails_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitored_emails'
        },
        () => {
          fetchMonitoredEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(emailScansChannel);
      supabase.removeChannel(monitoredEmailsChannel);
    };
  }, [user]);

  return {
    monitoredEmails,
    emailScans,
    quarantinedEmails,
    loading,
    addEmailToMonitor,
    releaseQuarantinedEmail,
    deleteQuarantinedEmail,
    refetch: () => {
      fetchMonitoredEmails();
      fetchEmailScans();
    }
  };
}