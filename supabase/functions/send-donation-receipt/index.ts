import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DonationReceiptRequest {
  donor_name: string;
  donor_email: string;
  amount: number;
  receipt_number: string;
  campaign_title: string;
  donation_date: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      donor_name,
      donor_email,
      amount,
      receipt_number,
      campaign_title,
      donation_date,
      message,
    }: DonationReceiptRequest = await req.json();

    console.log("Sending donation receipt to:", donor_email);

    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">SacchiSewa</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Making a difference together</p>
      </td>
    </tr>
    
    <!-- Thank You Message -->
    <tr>
      <td style="padding: 40px 30px 20px;">
        <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 24px; font-weight: 600;">Thank You, ${donor_name}! 🙏</h2>
        <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
          Your generous donation has been received successfully. Your support helps us create meaningful change in the lives of those who need it most.
        </p>
      </td>
    </tr>
    
    <!-- Receipt Card -->
    <tr>
      <td style="padding: 0 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="margin: 0 0 20px; color: #374151; font-size: 18px; font-weight: 600; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                📄 Donation Receipt
              </h3>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Receipt Number</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${receipt_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${donation_date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Campaign</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; max-width: 200px;">${campaign_title}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 15px 0 0;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0 0 5px; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount Donated</p>
                      <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${formattedAmount}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    ${message ? `
    <!-- Donor Message -->
    <tr>
      <td style="padding: 20px 30px 0;">
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 5px; color: #92400e; font-size: 12px; font-weight: 600;">Your Message</p>
          <p style="margin: 0; color: #78350f; font-size: 14px; font-style: italic;">"${message}"</p>
        </div>
      </td>
    </tr>
    ` : ''}
    
    <!-- Impact Message -->
    <tr>
      <td style="padding: 30px;">
        <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
            💚 Your contribution is making a real difference. Together, we're building a better tomorrow for those in need.
          </p>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #1f2937; padding: 30px; text-align: center;">
        <p style="margin: 0 0 10px; color: #ffffff; font-size: 16px; font-weight: 600;">SacchiSewa Foundation</p>
        <p style="margin: 0 0 15px; color: #9ca3af; font-size: 12px;">Registered Non-Profit Organization</p>
        <p style="margin: 0; color: #6b7280; font-size: 11px;">
          This is an auto-generated receipt. Please save this email for your records.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "SacchiSewa <onboarding@resend.dev>",
      to: [donor_email],
      subject: `Thank You for Your Donation - Receipt #${receipt_number}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-donation-receipt function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
