import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  order_id: string;
  order_number: string;
  new_status: string;
  user_email?: string;
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending_quote': 'Pending Quote',
    'queued': 'Queued',
    'sand-blasting': 'Sand Blasting',
    'coating': 'Coating',
    'curing': 'Curing',
    'quality-check': 'Quality Check',
    'completed': 'Completed',
    'delayed': 'Delayed',
  };
  return statusMap[status] || status;
};

const getEmailContent = (orderNumber: string, status: string): { subject: string; html: string } => {
  const statusLabel = getStatusLabel(status);
  
  if (status === 'completed') {
    return {
      subject: `🎉 Order ${orderNumber} Completed!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;">Great News! Your Order is Complete</h1>
          <p style="font-size: 16px; color: #333;">
            Your order <strong>${orderNumber}</strong> has been completed and is ready for pickup/delivery.
          </p>
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;">Thank you for choosing our services!</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please don't hesitate to contact us.
          </p>
        </div>
      `
    };
  }
  
  if (status === 'delayed') {
    return {
      subject: `⚠️ Order ${orderNumber} Delayed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Order Update: Delay Notice</h1>
          <p style="font-size: 16px; color: #333;">
            We apologize, but your order <strong>${orderNumber}</strong> has been delayed.
          </p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">We will update you as soon as possible with more information.</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            We sincerely apologize for any inconvenience this may cause.
          </p>
        </div>
      `
    };
  }
  
  return {
    subject: `📦 Order ${orderNumber} Status Update`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6;">Order Status Update</h1>
        <p style="font-size: 16px; color: #333;">
          Your order <strong>${orderNumber}</strong> status has been updated.
        </p>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">
            <strong>New Status:</strong> ${statusLabel}
          </p>
        </div>
        <p style="color: #666; font-size: 14px;">
          You can log in to your account to view more details about your order.
        </p>
      </div>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, order_id, order_number, new_status, user_email }: NotificationRequest = await req.json();
    
    console.log("Notification request:", { user_id, order_id, order_number, new_status, user_email });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailToSend = user_email;

    // If no email provided, get it from auth.users using admin client
    if (!emailToSend) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);

      if (userError) {
        console.error("Error fetching user:", userError);
        return new Response(
          JSON.stringify({ error: "Could not find user email", details: userError }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      emailToSend = userData?.user?.email;
    }

    if (!emailToSend) {
      console.log("No email found for user, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email to send to" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = getEmailContent(order_number, new_status);

    console.log("Sending email to:", emailToSend);

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Top Powdercoating <notifications@updates.dlsu.edu.ph>",
        to: [emailToSend],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-order-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
