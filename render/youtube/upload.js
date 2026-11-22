// Point d'entrée prévu pour une publication YouTube future. Volontairement désactivé en version 1 (voir README.md).
export const YOUTUBE_UPLOAD_ENABLED = false;

export function canUpload(env = process.env) {
  return YOUTUBE_UPLOAD_ENABLED && env.STICK_YOUTUBE_UPLOAD === 'enabled'
    && Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN);
}

export async function uploadVideo() {
  throw new Error('Publication YouTube désactivée dans cette version : téléchargez la vidéo et publiez-la vous-même.');
}
