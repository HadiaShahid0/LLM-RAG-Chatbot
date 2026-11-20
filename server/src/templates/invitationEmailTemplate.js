export const invitationEmailTemplate = ({
  companyName,
  inviterName,
  invitationLink,
  message,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #eee; border-radius: 10px;">

      <h2 style="color: #333;">You're Invited!</h2>

      <p>Hello,</p>

      <p>
        <strong>${inviterName}</strong> has invited you to join
        <strong>${companyName}</strong>.
      </p>

      ${message ? `<p>${message}</p>` : ""}

      <p>Click the button below to accept your invitation.</p>

      <a href="${invitationLink}"
        style="display: inline-block; background: #4f46e5; color: white; padding: 12px 22px; text-decoration: none; border-radius: 6px;">
        Accept Invitation
      </a>

      <p style="margin-top: 25px; color: #777; font-size: 13px;">
        This invitation will expire in 7 days.
      </p>

    </div>
  `;
};
