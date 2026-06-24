export async function onRequestPost(context) {
  const { request, env } = context;
  const { step, email, code, newPassword } = await request.json();

  const hash = async (p) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  if (step === 'send_code') {
    const user = await env.DB.prepare("SELECT id FROM users WHERE email =?").bind(email).first();
    if (!user) return Response.json({ success: false, error: 'Email not found' }, { status: 404 });

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Math.floor(Date.now() / 1000) + 600;

    await env.DB.prepare(
      "UPDATE users SET recovery_code =?, recovery_expires =? WHERE email =?"
    ).bind(recoveryCode, expires, email).run();

    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@caramel-cloud.pages.dev', name: 'Caramel Cloud' }, // Change to your domain
        subject: 'Caramel Cloud Password Reset Code',
        content: [{ 
          type: 'text/plain', 
          value: `Your Caramel Cloud password reset code is: ${recoveryCode}\n\nThis code expires in 10 minutes.\n\nNEVER SHARE THIS CODE WITH ANYONE. Caramel Cloud staff will never ask for this code.\n\nIf you didn't request this, ignore this email.` 
        }]
      })
    });

    return Response.json({ success: true });
  }

if (step === 'reset') {
  const strong = newPassword && newPassword.length >= 8 &&
                 /[A-Z]/.test(newPassword) &&
                 /[a-z]/.test(newPassword) &&
                 /[0-9]/.test(newPassword) &&
                 /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  
  if (!strong) {
    return Response.json({ 
      success: false, 
      error: 'Password must be 8+ chars with uppercase, lowercase, number, and special character' 
    }, { status: 400 });
  }
    const newHash = await hash(newPassword);
    const now = Math.floor(Date.now() / 1000);

    const { meta } = await env.DB.prepare(
      "UPDATE users SET password_hash =?, recovery_code = NULL, recovery_expires = NULL WHERE email =? AND recovery_code =? AND recovery_expires >?"
    ).bind(newHash, email, code, now).run();

    if (meta.changes > 0) return Response.json({ success: true });
    return Response.json({ success: false, error: 'Code wrong or expired' }, { status: 400 });
  }
}
