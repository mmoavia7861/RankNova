import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly'
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear cached token when user signs out
onAuthStateChanged(auth, user => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export async function googleWorkspaceSignIn(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google sign in.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Workspace Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
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
    const fromUser = auth.currentUser?.email || 'me';
    const emailLines = [
      `From: ${fromUser}`,
      `To: ${params.toEmail}`,
      `Subject: =?utf-8?B?${Buffer.from(params.subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(params.htmlContent).toString('base64')
    ];

    const rawMessage = emailLines.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
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
