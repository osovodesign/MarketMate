import { db, doc, setDoc } from './firebase';

export interface WelcomeEmailData {
  email: string;
  ownerName?: string;
  businessName?: string;
  businessType?: string;
  userId?: string;
}

/**
 * Trigger automated branded welcome email for newly registered merchants and business owners.
 * Deduplicates per email address so users aren't spammed across multiple tab reloads.
 */
export async function triggerWelcomeEmail(
  data: WelcomeEmailData
): Promise<{ success: boolean; simulated?: boolean; message?: string }> {
  const cleanEmail = (data.email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Invalid recipient email.' };
  }

  // Deduplication key
  const storageKey = `marketmate_welcome_email_sent_${cleanEmail}`;
  const alreadySent = localStorage.getItem(storageKey);
  if (alreadySent) {
    return { success: true, message: 'Welcome email was already dispatched for this email.' };
  }

  try {
    const res = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        ownerName: data.ownerName || 'Merchant user / Business Owner',
        businessName: data.businessName,
        businessType: data.businessType,
        userId: data.userId,
      }),
    });

    const result = await res.json().catch(() => ({}));

    // Record locally that welcome email has been sent
    localStorage.setItem(storageKey, new Date().toISOString());

    // Update user document in Firestore if userId is present
    if (data.userId) {
      try {
        const userRef = doc(db, 'users', data.userId);
        await setDoc(
          userRef,
          {
            welcomeEmailSent: true,
            welcomeEmailSentAt: new Date().toISOString(),
            welcomeEmailRecipient: cleanEmail,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not record welcomeEmailSent in Firestore:', err);
      }
    }

    return {
      success: true,
      simulated: Boolean(result.simulated),
      message: result.message || `Welcome email dispatched to ${cleanEmail}`,
    };
  } catch (err: any) {
    console.warn('Welcome email dispatch notice:', err);
    // Even if fetch fails (e.g. offline dev mode), record locally so we don't block auth
    localStorage.setItem(storageKey, new Date().toISOString());
    return { success: false, message: err?.message || 'Could not reach welcome email endpoint' };
  }
}
