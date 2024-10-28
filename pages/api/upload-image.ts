import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageUrl } = req.body

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' })
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    const imageBuffer = await response.arrayBuffer()

    // Generate a unique filename
    const filename = `task-image-${Date.now()}.png`

    // Upload the image to Supabase
    const { data, error } = await supabase.storage
      .from('task-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png'
      })

    if (error) throw error

    // Get the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('task-images')
      .getPublicUrl(filename)

    res.status(200).json({ url: publicUrl })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
}
