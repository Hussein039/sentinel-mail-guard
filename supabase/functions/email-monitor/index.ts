import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  messageId: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  receivedAt: string;
}

function simulateEmailScan(email: EmailData) {
  const suspiciousKeywords = ['urgent', 'click here', 'verify account', 'suspended', 'prize', 'winner'];
  const phishingKeywords = ['login', 'password', 'update payment', 'confirm identity'];
  const spamKeywords = ['free', 'limited time', 'act now', 'congratulations'];
  
  const content = email.content.toLowerCase();
  const subject = email.subject.toLowerCase();
  
  let scanResult: 'clean' | 'spam' | 'phishing' | 'malware' | 'suspicious' = 'clean';
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let threatDetails = null;
  
  if (phishingKeywords.some(keyword => content.includes(keyword) || subject.includes(keyword))) {
    scanResult = 'phishing';
    riskLevel = 'critical';
    threatDetails = { type: 'phishing', indicators: ['suspicious_links', 'credential_harvesting'] };
  } else if (spamKeywords.some(keyword => content.includes(keyword) || subject.includes(keyword))) {
    scanResult = 'spam';
    riskLevel = 'medium';
    threatDetails = { type: 'spam', indicators: ['promotional_content'] };
  } else if (suspiciousKeywords.some(keyword => content.includes(keyword) || subject.includes(keyword))) {
    scanResult = 'suspicious';
    riskLevel = 'medium';
    threatDetails = { type: 'suspicious', indicators: ['suspicious_content'] };
  }
  
  return {
    scanResult,
    riskLevel,
    threatDetails,
    isQuarantined: scanResult !== 'clean' && riskLevel === 'critical'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, emailAddress, userId } = await req.json()

    if (action === 'simulate') {
      // Get monitored email record
      const { data: monitoredEmail } = await supabaseClient
        .from('monitored_emails')
        .select('*')
        .eq('email_address', emailAddress)
        .eq('user_id', userId)
        .single()

      if (!monitoredEmail) {
        return new Response(
          JSON.stringify({ error: 'Email not monitored' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Simulate incoming and outgoing emails
      const sampleEmails = [
        {
          messageId: `msg_${Date.now()}_1`,
          sender: 'notifications@bank.com',
          recipient: emailAddress,
          subject: 'Urgent: Verify your account to prevent suspension',
          content: 'Dear customer, your account will be suspended. Click here to verify your login credentials immediately.',
          receivedAt: new Date().toISOString(),
          direction: 'incoming'
        },
        {
          messageId: `msg_${Date.now()}_2`,
          sender: emailAddress,
          recipient: 'colleague@company.com',
          subject: 'Meeting notes from today',
          content: 'Hi, please find attached the meeting notes from our discussion today. Let me know if you have any questions.',
          receivedAt: new Date(Date.now() - 30000).toISOString(),
          direction: 'outgoing'
        },
        {
          messageId: `msg_${Date.now()}_3`,
          sender: 'newsletter@tech-company.com',
          recipient: emailAddress,
          subject: 'Weekly Tech Updates',
          content: 'Here are this week\'s technology updates and industry news.',
          receivedAt: new Date(Date.now() - 60000).toISOString(),
          direction: 'incoming'
        },
        {
          messageId: `msg_${Date.now()}_4`,
          sender: 'no-reply@suspicious-site.com',
          recipient: emailAddress,
          subject: 'You\'ve won a prize! Act now!',
          content: 'Congratulations! You\'ve won $1000. Click here to claim your free prize now. Limited time offer!',
          receivedAt: new Date(Date.now() - 90000).toISOString(),
          direction: 'incoming'
        }
      ]

      // Process and store emails
      for (const email of sampleEmails) {
        const scanResults = simulateEmailScan(email)
        
        await supabaseClient
          .from('email_scans')
          .insert({
            monitored_email_id: monitoredEmail.id,
            message_id: email.messageId,
            sender_email: email.sender,
            recipient_email: email.recipient,
            subject: email.subject,
            content_preview: email.content.substring(0, 200),
            scan_result: scanResults.scanResult,
            risk_level: scanResults.riskLevel,
            is_quarantined: scanResults.isQuarantined,
            threat_details: scanResults.threatDetails,
            scanned_at: new Date().toISOString(),
            email_received_at: email.receivedAt
          })
      }

      return new Response(
        JSON.stringify({ success: true, processed: sampleEmails.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})