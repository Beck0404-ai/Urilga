/* ==========================================================================
   SOUVENIR CARD CANVAS GENERATOR
   Renders downloadable guest wish card on HTML5 Canvas
   ========================================================================== */

export function drawSouvenirCard(canvas, { groom, bride, guestName, message, imageSrc, dateStr }) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Background gradient (Dark luxury parchment)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#14100B');
  bgGrad.addColorStop(0.5, '#231C16');
  bgGrad.addColorStop(1, '#0B0906');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Gold Border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner Subtle Border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F3E5AB';
  ctx.font = '22px "Forum", serif';
  ctx.fillText('ХҮНДЭТГЭЛИЙН ДУРСГАЛ', width / 2, 70);

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 28px "Philosopher", serif';
  ctx.fillText(`${groom} · ${bride}`, width / 2, 110);

  // Decorative Rule
  ctx.strokeStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 80, 130);
  ctx.lineTo(width / 2 + 80, 130);
  ctx.stroke();

  // Guest Image / Avatar area
  if (imageSrc) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 230, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, width / 2 - 70, 160, 140, 140);
      ctx.restore();

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, 230, 70, 0, Math.PI * 2);
      ctx.stroke();

      renderMessage();
    };
    img.src = imageSrc;
  } else {
    // Ölzi center ornament if no image
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(width / 2 - 40, 180, 80, 80);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.fillRect(width / 2 - 40, 180, 80, 80);
    
    ctx.fillStyle = '#D4AF37';
    ctx.font = '32px sans-serif';
    ctx.fillText('❖', width / 2, 230);
    
    renderMessage();
  }

  function renderMessage() {
    const textStartY = imageSrc ? 340 : 310;

    // Guest Name
    ctx.fillStyle = '#F5F0E6';
    ctx.font = 'bold 24px "Manrope", sans-serif';
    ctx.fillText(`" ${guestName} "`, width / 2, textStartY);

    // Message Body Wrapping
    ctx.fillStyle = '#C8BFB0';
    ctx.font = 'italic 18px "Manrope", sans-serif';
    
    const words = message.split(' ');
    let line = '';
    let y = textStartY + 45;
    const maxWidth = width - 100;
    const lineHeight = 28;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);

    // Footer
    ctx.fillStyle = '#8C8275';
    ctx.font = '14px "Manrope", sans-serif';
    ctx.fillText(`urilga.online · ${dateStr}`, width / 2, height - 50);
  }
}
