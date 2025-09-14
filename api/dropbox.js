// api/dropbox.js - Fichier unique pour Vercel
export default async function handler(req, res) {
  // CORS headers pour GPT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { operation, path, query } = req.body;
  const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;

  if (!DROPBOX_TOKEN) {
    return res.status(500).json({ error: 'Token Dropbox manquant' });
  }

  try {
    let response;
    
    switch (operation) {
      case 'list':
        response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: path || '',
            recursive: true
          })
        });
        break;

      case 'download':
        response = await fetch('https://content.dropboxapi.com/2/files/download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_TOKEN}`,
            'Dropbox-API-Arg': JSON.stringify({ path })
          }
          // Pas de body pour download !
        });
        
        if (response.ok) {
          const content = await response.text();
          return res.json({ 
            success: true, 
            content,
            filename: path.split('/').pop()
          });
        }
        break;

      case 'search':
        response = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: query || path,
            options: {
              path: '',
              max_results: 100
            }
          })
        });
        break;

      case 'metadata':
        response = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DROPBOX_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path,
            include_media_info: false
          })
        });
        break;

      default:
        return res.status(400).json({ error: 'Opération non supportée' });
    }

    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, data });
    } else {
      const error = await response.text();
      return res.status(response.status).json({ 
        success: false, 
        error: error || 'Erreur Dropbox'
      });
    }

  } catch (error) {
    console.error('Erreur proxy:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
