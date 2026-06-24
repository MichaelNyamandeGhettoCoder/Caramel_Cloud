export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { password, email } = await request.json();

    if (!password || !email) {
      return new Response(JSON.stringify({ success: false, error: 'Password and email required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if DB binding exists
    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, error: 'D1 binding missing' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Actually update the DB and check if it worked
    const result = await env.DB.prepare(
      `UPDATE users SET password_hash = ?, recovery_email = ?, is_default_password = 0 WHERE id = 1`
    ).bind(password_hash, email).run();

    if (result.success && result.meta.changes > 0) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database update failed',
        details: result 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
