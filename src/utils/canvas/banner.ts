let canvasModule: any = null;
try { canvasModule = require('@napi-rs/canvas'); } catch {}

export async function createBanBanner(data: { username: string; avatarURL: string; reason: string; moderator: string }): Promise<Buffer | null> {
  if (!canvasModule) return null;
  const { createCanvas, loadImage, GlobalFonts } = canvasModule;
  const canvas = createCanvas(800, 250);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 800, 250);
  gradient.addColorStop(0, '#1a0000');
  gradient.addColorStop(1, '#3d0000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 250);

  // Red border
  ctx.strokeStyle = '#FF4444';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 792, 242);

  // Avatar
  try {
    const avatar = await loadImage(data.avatarURL.replace('.webp', '.png') + '?size=128');
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 90, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 35, 35, 180, 180);
    ctx.restore();
    // Circle border
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(125, 125, 91, 0, Math.PI * 2);
    ctx.stroke();
  } catch {}

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('BANNED', 250, 80);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#FFaaaa';
  ctx.fillText(data.username.slice(0, 24), 250, 130);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`Reason: ${data.reason.slice(0, 40)}`, 250, 175);
  ctx.fillText(`By: ${data.moderator.slice(0, 30)}`, 250, 210);

  return canvas.toBuffer('image/png');
}

export async function createWelcomeBanner(data: { username: string; avatarURL: string; guildName: string; memberCount: number }): Promise<Buffer | null> {
  if (!canvasModule) return null;
  const { createCanvas, loadImage } = canvasModule;
  const canvas = createCanvas(800, 250);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 800, 250);
  gradient.addColorStop(0, '#0a0a2e');
  gradient.addColorStop(1, '#1a1a4e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 250);

  ctx.strokeStyle = '#5865F2';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 792, 242);

  try {
    const avatar = await loadImage(data.avatarURL.replace('.webp', '.png') + '?size=128');
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 90, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 35, 35, 180, 180);
    ctx.restore();
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(125, 125, 91, 0, Math.PI * 2);
    ctx.stroke();
  } catch {}

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('Welcome!', 250, 75);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#aaaaff';
  ctx.fillText(data.username.slice(0, 24), 250, 125);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`to ${data.guildName.slice(0, 30)}`, 250, 170);
  ctx.fillText(`Member #${data.memberCount.toLocaleString()}`, 250, 210);

  return canvas.toBuffer('image/png');
}

export async function createBattleWinnerBanner(data: { username: string; avatarURL: string; era: string }): Promise<Buffer | null> {
  if (!canvasModule) return null;
  const { createCanvas, loadImage } = canvasModule;
  const canvas = createCanvas(800, 250);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 800, 250);
  gradient.addColorStop(0, '#1a0a2e');
  gradient.addColorStop(1, '#3d2263');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 250);

  ctx.strokeStyle = '#9B59B6';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 792, 242);

  try {
    const avatar = await loadImage(data.avatarURL.replace('.webp', '.png') + '?size=128');
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 90, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 35, 35, 180, 180);
    ctx.restore();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(125, 125, 91, 0, Math.PI * 2);
    ctx.stroke();
  } catch {}

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('WINNER!', 250, 80);
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(data.username.slice(0, 24), 250, 130);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#cc99ff';
  ctx.fillText(`${data.era} Era Battle`, 250, 175);

  return canvas.toBuffer('image/png');
}
