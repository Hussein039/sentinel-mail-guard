-- Create table for monitored email addresses
CREATE TABLE public.monitored_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_address TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for email scans and results
CREATE TABLE public.email_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitored_email_id UUID NOT NULL REFERENCES public.monitored_emails(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_preview TEXT,
  scan_result TEXT NOT NULL DEFAULT 'clean' CHECK (scan_result IN ('clean', 'spam', 'phishing', 'malware', 'suspicious')),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_quarantined BOOLEAN NOT NULL DEFAULT false,
  threat_details JSONB,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for quarantined emails
CREATE TABLE public.quarantined_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_scan_id UUID NOT NULL REFERENCES public.email_scans(id) ON DELETE CASCADE,
  quarantine_reason TEXT NOT NULL,
  quarantined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  released_by UUID,
  status TEXT NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'released', 'deleted'))
);

-- Enable Row Level Security
ALTER TABLE public.monitored_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarantined_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monitored_emails
CREATE POLICY "Users can view their own monitored emails" 
ON public.monitored_emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitored emails" 
ON public.monitored_emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitored emails" 
ON public.monitored_emails 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitored emails" 
ON public.monitored_emails 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for email_scans
CREATE POLICY "Users can view scans for their monitored emails" 
ON public.email_scans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.monitored_emails 
    WHERE id = email_scans.monitored_email_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Service can insert email scans" 
ON public.email_scans 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for quarantined_emails
CREATE POLICY "Users can view quarantined emails for their monitored addresses" 
ON public.quarantined_emails 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.email_scans es
    JOIN public.monitored_emails me ON es.monitored_email_id = me.id
    WHERE es.id = quarantined_emails.email_scan_id 
    AND me.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update quarantined emails for their monitored addresses" 
ON public.quarantined_emails 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.email_scans es
    JOIN public.monitored_emails me ON es.monitored_email_id = me.id
    WHERE es.id = quarantined_emails.email_scan_id 
    AND me.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_monitored_emails_user_id ON public.monitored_emails(user_id);
CREATE INDEX idx_monitored_emails_email ON public.monitored_emails(email_address);
CREATE INDEX idx_email_scans_monitored_email ON public.email_scans(monitored_email_id);
CREATE INDEX idx_email_scans_scan_result ON public.email_scans(scan_result);
CREATE INDEX idx_email_scans_quarantined ON public.email_scans(is_quarantined);
CREATE INDEX idx_quarantined_emails_scan_id ON public.quarantined_emails(email_scan_id);
CREATE INDEX idx_quarantined_emails_status ON public.quarantined_emails(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_monitored_emails_updated_at
  BEFORE UPDATE ON public.monitored_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for real-time updates
ALTER TABLE public.monitored_emails REPLICA IDENTITY FULL;
ALTER TABLE public.email_scans REPLICA IDENTITY FULL;
ALTER TABLE public.quarantined_emails REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.monitored_emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quarantined_emails;