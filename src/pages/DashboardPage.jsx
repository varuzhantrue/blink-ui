import { useRef, useState } from 'react'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import { useFiles } from '../hooks/useFiles'
import { uploadFile } from '../api/files'
import { uploadFileMultipart } from '../api/multipartUpload'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString))
}

function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4].map((i) => (
        <TableCell key={i}>
          <div className="h-4 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  )
}

const MULTIPART_THRESHOLD = 10 * 1024 * 1024 // 10 MB

export default function DashboardPage() {
  const { files, loading, error, refresh } = useFiles()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null) // null = hidden, 0-100 = visible

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setProgress(null)
    try {
      if (file.size > MULTIPART_THRESHOLD) {
        setProgress(0)
        await uploadFileMultipart(file, setProgress)
      } else {
        await uploadFile(file)
      }
      toast.success(`"${file.name}" uploaded successfully.`)
      refresh()
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(null)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Files</h2>
          <Button onClick={() => fileInputRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload File'}
          </Button>
          <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
        </div>

        {progress !== null && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}

              {!loading && files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No files uploaded yet.
                  </TableCell>
                </TableRow>
              )}

              {!loading && files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.originalFileName}</TableCell>
                  <TableCell>{formatBytes(file.fileSize)}</TableCell>
                  <TableCell>{formatDate(file.uploadTimestamp)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">Download</Button>
                    <Button variant="outline" size="sm">Share</Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
