export async function onRequestPost({ request, env }) {
  const { newPassword } = await request.json();
  await env.USERS.put('admin_password', newPassword);
  return Response.json({ success: true });
}
