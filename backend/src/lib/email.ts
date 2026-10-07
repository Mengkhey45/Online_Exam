import { Resend } from "resend";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export async function sendTeamInvitation(input: {
  email: string;
  name: string;
  role: "teacher" | "admin";
}): Promise<void> {
  if (!resend) {
    throw new AppError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Invitation email is not configured.",
    );
  }

  const loginUrl = `${env.WEB_ORIGIN}/login`;
  const name = escapeHtml(input.name);
  const role = escapeHtml(input.role);
  const { error } = await resend.emails.send({
    from: `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_ADDRESS}>`,
    to: [input.email],
    subject: "You have been invited to Examroom",
    text: `You have been invited to join an Examroom organisation as a ${input.role}. Sign in with Google using ${input.email} to confirm your invitation: ${loginUrl}`,
    html: `<p>Hello ${name},</p><p>You have been invited to join an Examroom organisation as a ${role}.</p><p><a href="${loginUrl}">Confirm your invitation and sign in</a> with Google using <strong>${escapeHtml(input.email)}</strong>.</p><p>Your access remains pending until you sign in with this verified email address.</p>`,
  });

  if (error) {
    throw new AppError(502, "EMAIL_SEND_FAILED", "Could not send the invitation email.");
  }
}