const Instagram = require('instagram-web-api');
const axios = require('axios');

/**
 * Obtiene las últimas publicaciones de un perfil de Instagram (público)
 * @param {string} username - Nombre de usuario
 * @param {number} limit - Número máximo de publicaciones a obtener
 * @param {number} retries - Número de reintentos en caso de fallo
 * @returns {Promise<Array>} - Lista de publicaciones normalizadas
 */
async function scrapeProfile(username, limit = 20, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = new Instagram({});
      const profile = await client.getProfile(username);
      
      if (!profile || !profile.edge_owner_to_timeline_media) {
        throw new Error('No se pudo obtener el perfil o no hay publicaciones');
      }

      const edges = profile.edge_owner_to_timeline_media.edges;
      const posts = edges.slice(0, limit).map(edge => {
        const node = edge.node;
        const mediaType = node.__typename === 'GraphVideo' ? 'video' 
                          : node.__typename === 'GraphImage' ? 'image' 
                          : 'carousel';
        
        let mediaUrl = '';
        let thumbnailUrl = null;
        
        if (mediaType === 'video') {
          mediaUrl = node.video_url;
          thumbnailUrl = node.display_url;
        } else if (mediaType === 'image') {
          mediaUrl = node.display_url;
        } else if (mediaType === 'carousel' && node.edge_sidecar_to_children) {
          const firstChild = node.edge_sidecar_to_children.edges[0]?.node;
          mediaUrl = firstChild?.display_url || node.display_url;
          thumbnailUrl = node.display_url;
        } else {
          mediaUrl = node.display_url;
        }

        return {
          postId: node.id,
          shortcode: node.shortcode,
          caption: node.edge_media_to_caption?.edges[0]?.node?.text || '',
          mediaType,
          mediaUrl,
          thumbnailUrl,
          permalink: `https://www.instagram.com/p/${node.shortcode}/`,
          timestamp: new Date(node.taken_at_timestamp * 1000),
          likes: node.edge_liked_by?.count || 0,
          comments: node.edge_media_to_comment?.count || 0,
        };
      });

      return posts;
    } catch (error) {
      lastError = error;
      console.log(`Intento ${attempt} falló para ${username}: ${error.message}`);
      if (attempt < retries) {
        // Esperar exponencialmente antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

module.exports = { scrapeProfile };