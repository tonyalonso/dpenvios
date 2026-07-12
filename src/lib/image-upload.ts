'use client';

/**
 * Optimiza una imagen de archivo (File) y la devuelve como data URL WebP.
 *
 * - Rechaza archivos > 2MB.
 * - Redimensiona la imagen si su ancho supera `maxW` (mantiene aspect ratio).
 * - Re-codifica como WebP con la calidad indicada.
 *
 * Sólo para uso en el cliente (usa FileReader, Image y Canvas).
 */
export function optimizeImage(file: File, maxW = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('El archivo excede 2MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxW) {
          height = (height * maxW) / width;
          width = maxW;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
