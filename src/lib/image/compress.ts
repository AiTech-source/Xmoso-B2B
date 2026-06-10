export function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Compression failed"));
      }, "image/webp", quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
