export const validateInvitationService = async (token) => {
  console.log("Validating invitation...");
  console.log("Token received:", Boolean(token));
  console.log("Token length:", token?.length);

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  console.log("Token hash generated:", Boolean(tokenHash));

  const invitation = await Invitation.findOne({
    where: { tokenHash },
  });

  console.log("Invitation found:", Boolean(invitation));

  if (!invitation) {
    throw new Error("Invalid invitation link");
  }

  // Keep your remaining validation logic.
};