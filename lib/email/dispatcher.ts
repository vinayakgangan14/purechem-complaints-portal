import { supabase } from "@/lib/db/supabase";
import { formatWAT } from "@/lib/timer/resolution";

export interface EmailPayload {
  complaintId: string;
  complaintNumber: string;
  recipientEmail: string;
  recipientName: string;
  type: "REGISTRATION" | "STATUS_CHANGE" | "INFO_REQUIRED" | "RESOLVED" | "CLOSED";
  data: {
    customerName: string;
    companyName?: string;
    productName: string;
    batchNumber?: string;
    status: string;
    complaintDate: string;
    resolutionDate?: string;
    resolutionTime?: string;
    resolutionDetails?: string;
    comment?: string;
    actionRequired?: string;
  };
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.from("system_settings").select("key, value");
    const settings: Record<string, string> = {};
    if (data) {
      for (const row of data) {
        settings[row.key] = row.value;
      }
    }
    return settings;
  } catch (err) {
    return {};
  }
}

export async function sendNotificationEmail(payload: EmailPayload) {
  try {
    const settings = await getSystemSettings();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://purechem-complaints-portal.onrender.com";
    const trackingLink = `${baseUrl}/track?complaint_id=${encodeURIComponent(payload.complaintNumber)}&query=${encodeURIComponent(payload.recipientEmail)}`;

    let subject = "";
    let bodyHtml = "";

    const vars: Record<string, string> = {
      customer_name: payload.data.customerName || "Valued Customer",
      company_name: payload.data.companyName || "N/A",
      complaint_id: payload.complaintNumber,
      product_name: payload.data.productName,
      batch_number: payload.data.batchNumber || "Not Specified",
      complaint_status: payload.data.status,
      complaint_date: formatWAT(payload.data.complaintDate),
      resolution_date: payload.data.resolutionDate ? formatWAT(payload.data.resolutionDate) : "—",
      resolution_time: payload.data.resolutionTime || "—",
      tracking_link: trackingLink,
    };

    function replaceVars(tpl: string): string {
      let res = tpl;
      for (const [k, v] of Object.entries(vars)) {
        res = res.replaceAll(`{{${k}}}`, v);
      }
      return res;
    }

    switch (payload.type) {
      case "REGISTRATION":
        subject = `Purechem Complaint Registered – ${payload.complaintNumber}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0A2540; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">PURECHEM MANUFACTURING LIMITED</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Quality Customer Service Portal • Nigeria</p>
            </div>
            <div style="padding: 24px;">
              <h2 style="font-size: 18px; color: #0A2540; margin-top: 0;">Complaint Successfully Registered</h2>
              <p>Dear <strong>{{customer_name}}</strong>,</p>
              <p>Thank you for contacting Purechem Manufacturing Nigeria Ltd. Your product complaint has been logged into our quality tracking system.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #FF6900; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 3px 0;"><strong>Complaint Reference ID:</strong> <span style="font-family: monospace; color: #0A2540; font-weight: bold; font-size: 15px;">{{complaint_id}}</span></p>
                <p style="margin: 3px 0;"><strong>Product:</strong> {{product_name}}</p>
                <p style="margin: 3px 0;"><strong>Batch Number:</strong> {{batch_number}}</p>
                <p style="margin: 3px 0;"><strong>Status:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">OPEN</span></p>
                <p style="margin: 3px 0;"><strong>Registered Time (WAT):</strong> {{complaint_date}}</p>
              </div>
              <p>Our Quality and Technical team has been notified and will review your complaint shortly. You can track real-time progress using your reference number.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_link}}" style="background-color: #0A2540; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Complaint Online</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #64748b; margin: 0;">Purechem Manufacturing Limited, Afprint Compound – 2nd Gate, Oshodi-Apapa Exp., Isolo, Lagos, Nigeria.</p>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Helpline: +234 912 154 0036 / +234 915 065 5555</p>
            </div>
          </div>
        `;
        break;

      case "STATUS_CHANGE":
        subject = `Status Update: Purechem Complaint ${payload.complaintNumber} – ${payload.data.status}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0A2540; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold;">PURECHEM MANUFACTURING LIMITED</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Quality Customer Service Portal • Nigeria</p>
            </div>
            <div style="padding: 24px;">
              <h2 style="font-size: 18px; color: #0A2540; margin-top: 0;">Complaint Status Updated</h2>
              <p>Dear <strong>{{customer_name}}</strong>,</p>
              <p>Your product complaint <strong>{{complaint_id}}</strong> has been updated to:</p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; margin: 16px 0; border-radius: 6px; text-align: center;">
                <span style="font-size: 16px; font-weight: bold; color: #15803d;">{{complaint_status}}</span>
              </div>
              ${payload.data.comment ? `<p style="background: #f8fafc; padding: 12px; border-radius: 4px; font-style: italic; color: #475569;">"${payload.data.comment}"</p>` : ""}
              <div style="text-align: center; margin: 26px 0;">
                <a href="{{tracking_link}}" style="background-color: #0A2540; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Live Timeline</a>
              </div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Purechem Quality Management Team, Lagos, Nigeria.</p>
            </div>
          </div>
        `;
        break;

      case "INFO_REQUIRED":
        subject = `Action Required: Additional Information for Complaint ${payload.complaintNumber}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0A2540; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold;">PURECHEM MANUFACTURING LIMITED</h1>
            </div>
            <div style="padding: 24px;">
              <h2 style="font-size: 18px; color: #ea580c; margin-top: 0;">Additional Information Required</h2>
              <p>Dear <strong>{{customer_name}}</strong>,</p>
              <p>Our Quality investigation team requires additional details or sample submission for your complaint <strong>{{complaint_id}}</strong> (Product: {{product_name}}).</p>
              <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px; margin: 16px 0;">
                <p style="margin: 0; color: #9a3412;"><strong>Specific Request:</strong> ${payload.data.comment || "Please provide batch photo or clarify application conditions."}</p>
              </div>
              <p>Please visit the tracking page to reply or attach supporting documents:</p>
              <div style="text-align: center; margin: 26px 0;">
                <a href="{{tracking_link}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Provide Requested Information</a>
              </div>
            </div>
          </div>
        `;
        break;

      case "RESOLVED":
        subject = `Purechem Complaint Resolved – ${payload.complaintNumber}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0A2540; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold;">PURECHEM MANUFACTURING LIMITED</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Quality Assurance & Customer Service</p>
            </div>
            <div style="padding: 24px;">
              <h2 style="font-size: 18px; color: #16a34a; margin-top: 0;">Complaint Resolved Successfully</h2>
              <p>Dear <strong>{{customer_name}}</strong>,</p>
              <p>We are pleased to inform you that your complaint <strong>{{complaint_id}}</strong> for <strong>{{product_name}}</strong> has been resolved by our Quality Department.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; margin: 16px 0;">
                <p style="margin: 3px 0;"><strong>Resolution Details:</strong> ${payload.data.resolutionDetails || "Corrective action applied."}</p>
                <p style="margin: 3px 0;"><strong>Resolution Date (WAT):</strong> {{resolution_date}}</p>
                <p style="margin: 3px 0;"><strong>Total Resolution Time:</strong> <span style="font-weight: bold; color: #15803d;">{{resolution_time}}</span></p>
              </div>
              <p>We value your partnership. Please take 30 seconds to rate our resolution service:</p>
              <div style="text-align: center; margin: 26px 0;">
                <a href="{{tracking_link}}#feedback" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Submit Service Feedback</a>
              </div>
            </div>
          </div>
        `;
        break;

      case "CLOSED":
        subject = `Purechem Complaint Closed – ${payload.complaintNumber}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background-color: #0A2540; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 18px;">PURECHEM MANUFACTURING LIMITED</h1>
            </div>
            <div style="padding: 20px;">
              <p>Dear <strong>{{customer_name}}</strong>,</p>
              <p>Complaint <strong>{{complaint_id}}</strong> has now been confirmed CLOSED. Thank you for choosing Purechem.</p>
              <p><a href="{{tracking_link}}">View closed record</a></p>
            </div>
          </div>
        `;
        break;
    }

    const finalHtml = replaceVars(bodyHtml);
    const now = new Date().toISOString();

    // Record customer notification into Supabase notifications table
    await supabase.from("notifications").insert({
      complaint_id: payload.complaintId,
      recipient_email: payload.recipientEmail,
      recipient_name: payload.recipientName,
      notification_type: payload.type,
      subject,
      body_html: finalHtml,
      status: "SENT",
      sent_at: now,
    });

    // Record internal notification if registration
    if (payload.type === "REGISTRATION") {
      const internalComplaintEmail = settings.primary_complaint_email || "complaints@purechemmanufacturing.com";
      const internalSubject = `[NEW COMPLAINT] ${payload.complaintNumber} - ${payload.data.productName} (${payload.data.customerName})`;
      await supabase.from("notifications").insert({
        complaint_id: payload.complaintId,
        recipient_email: internalComplaintEmail,
        recipient_name: "Purechem Quality Dept",
        notification_type: "REGISTRATION_INTERNAL",
        subject: internalSubject,
        body_html: finalHtml,
        status: "SENT",
        sent_at: now,
      });
    }
  } catch (err: any) {
    console.warn("Notification email dispatch log:", err.message);
  }
}
