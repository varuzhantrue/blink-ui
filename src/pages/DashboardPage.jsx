import { useRef, useState } from 'react'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import { useFiles } from '../hooks/useFiles'
import { uploadFile, downloadFile, deleteFile, shareFile } from '../api/files'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog'

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
  const [fileToDelete, setFileToDelete] = useState(null) // file object or null
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteConfirm() {
    if (!fileToDelete) return
    setDeleting(true)
    try {
      await deleteFile(fileToDelete.id)
      toast.success(`"${fileToDelete.originalFileName}" deleted.`)
      setFileToDelete(null)
      refresh()
    } catch {
      toast.error('Delete failed. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleShare(id) {
    try {
      const response = await shareFile(id)
      await navigator.clipboard.writeText(response.data.url)
      toast.success('Link copied to clipboard — expires in 1 hour.')
    } catch {
      toast.error('Failed to generate share link. Please try again.')
    }
  }

  async function handleDownload(file) {
    try {
      const response = await downloadFile(file.id)
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalFileName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed. Please try again.')
    }
  }

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
                    <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>Download</Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare(file.id)}>Share</Button>
                    <Button variant="destructive" size="sm" onClick={() => setFileToDelete(file)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={!!fileToDelete} onOpenChange={(open) => { if (!open) setFileToDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.originalFileName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
