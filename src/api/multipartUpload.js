import {
  initiateMultipartUpload,
  uploadPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from './files'

const CHUNK_SIZE = 10 * 1024 * 1024 // 10 MB per part
const MAX_RETRIES = 3

async function uploadPartWithRetry(partUrl, chunk, attempt = 1) {
  try {
    const response = await uploadPart(partUrl, chunk)
    const eTag = response.headers['etag']
    return eTag
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      return uploadPartWithRetry(partUrl, chunk, attempt + 1)
    }
    throw err
  }
}

/**
 * Uploads a file using the multipart API.
 * onProgress(percent: number) is called after each part completes.
 * Returns the fileId on success, throws on failure (abort is called automatically).
 */
export async function uploadFileMultipart(file, onProgress) {
  const partCount = Math.ceil(file.size / CHUNK_SIZE)

  const initiateResponse = await initiateMultipartUpload(
    file.name,
    file.size,
    file.type || 'application/octet-stream',
    partCount,
  )

  const { fileId, partUrls } = initiateResponse.data

  const parts = []
  try {
    for (let i = 0; i < partCount; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const eTag = await uploadPartWithRetry(partUrls[i], chunk)
      parts.push({ partNumber: i + 1, eTag })

      onProgress(Math.round(((i + 1) / partCount) * 100))
    }

    await completeMultipartUpload(fileId, parts)
    return fileId
  } catch (err) {
    await abortMultipartUpload(fileId).catch(() => {})
    throw err
  }
}
