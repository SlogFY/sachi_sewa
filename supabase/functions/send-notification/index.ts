import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type: "donation" | "campaign" | "milestone" | "info" | "success" | "warning";
  send_email?: boolean;
  email_subject?: string;
  related_campaign_id?: string;
  related_donation_id?: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: NotificationRequest = await req.json();

    const {
      user_id,
      title,
      message,
      type,
      send_email = false,
      email_subject,
      related_campaign_id,
      related_donation_id,
      metadata = {},
    } = body;

    // Validate required fields
    if (!user_id || !title || !message || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user email for email notifications
    let userEmail = "";
    let userName = "";
    if (send_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user_id)
        .single();

      if (profile) {
        userEmail = profile.email || "";
        userName = profile.full_name || "";
      }

      // Fallback to auth.users if profile doesn't have email
      if (!userEmail) {
        const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
        userEmail = authUser?.user?.email || "";
      }
    }

    // Insert notification into database
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type,
        related_campaign_id,
        related_donation_id,
        metadata,
        email_sent: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting notification:", insertError);
      throw insertError;
    }

    // Send email if requested
    let emailSent = false;
    if (send_email && userEmail) {
      try {
        const emailHtml = generateEmailHtml(title, message, type, userName);
        
        const { error: emailError } = await resend.emails.send({
          from: "SacchiSewa <onboarding@resend.dev>",
          to: [userEmail],
          subject: email_subject || title,
          html: emailHtml,
        });

        if (emailError) {
          console.error("Error sending email:", emailError);
        } else {
          emailSent = true;
          // Update notification to mark email as sent
          await supabase
            .from("notifications")
            .update({ email_sent: true })
            .eq("id", notification.id);
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        email_sent: emailSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailHtml(
  title: string,
  message: string,
  type: string,
  userName: string
): string {
  const typeColors: Record<string, string> = {
    donation: "#f97316",
    campaign: "#ec4899",
    milestone: "#10b981",
    success: "#22c55e",
    warning: "#eab308",
    info: "#3b82f6",
  };

  const color = typeColors[type] || "#f97316";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${color}, #f97316); padding: 30px 40px; border-radius: 12px 12px 0 0;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                            ❤️ SacchiSewa
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    ${userName ? `<p style="margin: 0 0 20px 0; color: #71717a; font-size: 16px;">Hello ${userName},</p>` : ''}
                    
                    <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px; font-weight: 600;">
                      ${title}
                    </h2>
                    
                    <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                      ${message}
                    </p>
                    
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td>
                          <a href="https://sacchisewa.org/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${color}, #f97316); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                            View Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; text-align: center;">
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
                      Thank you for being part of SacchiSewa!
                    </p>
                    <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 12px;">
                      © ${new Date().getFullYear()} SacchiSewa. Making giving simple.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

serve(handler);