import axios from 'axios'
import client from './client'

export function listFiles() {
  return client.get('/api/files')
}

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function downloadFile(id) {
  return client.get(`/api/files/${id}/download`, { responseType: 'blob' })
}

export function deleteFile(id) {
  return client.delete(`/api/files/${id}`)
}

export function shareFile(id) {
  return client.post(`/api/files/${id}/share`)
}

export function initiateMultipartUpload(fileName, fileSize, contentType, partCount) {
  return client.post('/api/files/multipart/initiate', { fileName, fileSize, contentType, partCount })
}

export function uploadPart(partUrl, chunk) {
  return axios.put(partUrl, chunk, {
    headers: { 'Content-Type': 'application/octet-stream' },
  })
}

// parts: [{ partNumber: number, eTag: string }] — ETags come from MinIO's response to each uploadPart call
export function completeMultipartUpload(fileId, parts) {
  return client.post(`/api/files/multipart/${fileId}/complete`, { parts })
}

export function abortMultipartUpload(fileId) {
  return client.delete(`/api/files/multipart/${fileId}/abort`)
}
