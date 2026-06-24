export async function onRequestPost({ request, env }) {
  try {
    const { password, email } = await request.json();
    
    if (!password || !email) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the new password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update user: new hash, email, turn off default flag
    await env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, 
          recovery_email = ?, 
          is_default_password = 0 
      WHERE id = 1
    `).bind(newHash, email).run();

    // Set auth cookie and log them in
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth=${token}; Path=/; Expires=${expiry.toUTCString()}; HttpOnly; Secure; SameSite=Strict`
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Setup failed',
      debug: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
