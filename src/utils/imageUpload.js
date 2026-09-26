const IMAGE_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
const IMAGE_EXTENSIONS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif' }

export function validatePortfolioImageMetadata(file) {
  if (!file || !IMAGE_TYPES.has(file.type)) throw new Error('WebP, JPEG, PNG, AVIF 이미지만 업로드할 수 있습니다.')
  if (file.size > 8 * 1024 * 1024) throw new Error('파일은 8MB 이하여야 합니다.')
  if (file.size <= 0) throw new Error('비어 있는 이미지 파일은 업로드할 수 없습니다.')
  return IMAGE_EXTENSIONS[file.type]
}

export async function validatePortfolioImageDimensions(file) {
  if (typeof createImageBitmap !== 'function') return
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width < 320 || bitmap.height < 180) throw new Error('이미지는 최소 320×180px 이상이어야 합니다.')
    if (bitmap.width > 12000 || bitmap.height > 12000) throw new Error('이미지 한 변은 12,000px 이하여야 합니다.')
  } finally {
    bitmap.close()
  }
}
