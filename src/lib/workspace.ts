import { getSupabase, supabase } from './supabase';

// Workspace actions need separate Google OAuth permission: normal RankNova
// Google sign-in must NOT ask for Gmail and Forms access.
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/forms.body'
];

function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

let cachedAccessToken: string | null = null;
supabase?.auth.onAuthStateChange((_event, session) => {
  // Provider token is only present after Google grants the requested scopes.
  cachedAccessToken = session?.provider_token || null;
});

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export async function googleWorkspaceSignIn(): Promise<{ accessToken: string }> {
  if (cachedAccessToken) return { accessToken: cachedAccessToken };
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: WORKSPACE_SCOPES.join(' '),
      redirectTo: window.location.href.split('#')[0],
      queryParams: { prompt: 'consent' }
    }
  });
  if (error) throw error;
  // OAuth redirects to Google and back; do not pretend a token already exists.
  throw new Error('Google Workspace permission flow started. Return here after granting consent.');
}

/**
 * Sends an email using the Gmail API (users.messages.send).
 * Requires confirmed user interaction.
 */
export async function sendAuditEmailViaGmail(params: {
  toEmail: string;
  subject: string;
  summaryText: string;
  htmlContent: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!cachedAccessToken) {
    return { success: false, error: 'Authentication required. Please sign in with Google Workspace.' };
  }

  try {
    const fromUser = (await getSupabase().auth.getUser()).data.user?.email || 'me';
    const emailLines = [
      `From: ${fromUser}`,
      `To: ${params.toEmail}`,
      `Subject: =?utf-8?B?${toBase64Utf8(params.subject)}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      toBase64Utf8(params.htmlContent)
    ];

    const rawMessage = emailLines.join('\r\n');
    const encodedMessage = toBase64Utf8(rawMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gmail API returned ${response.status}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Creates an intake form via Google Forms API (forms.body).
 */
export async function createAuditIntakeForm(title: string): Promise<{
  success: boolean;
  formUrl?: string;
  responderUri?: string;
  formId?: string;
  error?: string;
}> {
  if (!cachedAccessToken) {
    return { success: false, error: 'Authentication required. Please sign in with Google Workspace.' };
  }

  try {
    const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        info: {
          title: title || 'RankNova SEO Audit & Optimization Request',
          documentTitle: title || 'RankNova SEO Request'
        }
      })
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Google Forms API returned ${createRes.status}`);
    }

    const formData = await createRes.json();
    const formId = formData.formId;

    // Add standard SEO questions to the form
    const batchUpdateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            createItem: {
              item: {
                title: 'What is your website URL?',
                description: 'Provide the exact homepage or landing page you want audited.',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false }
                  }
                }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: 'What are your top 3 target keywords?',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: 'What is your primary SEO objective?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Fix technical SEO issues' },
                        { value: 'Improve Google SERP click-through rates' },
                        { value: 'Implement Schema markup' },
                        { value: 'Full site audit and rankings growth' }
                      ]
                    }
                  }
                }
              },
              location: { index: 2 }
            }
          }
        ]
      })
    });

    const responderUri = formData.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
    const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

    return {
      success: true,
      formId,
      formUrl: editUrl,
      responderUri
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
