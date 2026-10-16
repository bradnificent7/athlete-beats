import { sendEmailVerification } from "firebase/auth";

export async function sendVerify(user) {
  try {
    // the link sends them back to the site afterwards
    await sendEmailVerification(user, { url: window.location.origin });
  } catch (e) {
    if (
      e.code === "auth/unauthorized-continue-uri" ||
      e.code === "auth/invalid-continue-uri"
    ) {
      await sendEmailVerification(user); // plain version still works
    } else {
      throw e;
    }
  }
}