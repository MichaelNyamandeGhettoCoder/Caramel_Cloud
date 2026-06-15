export async function onRequestPost({ request, env }) {
  try {
    const { image } = await request.json();

    const formData = new FormData();
    formData.append('image', image);
    
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Upload failed');
    
    return Response.json({ url: data.data.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
