import Navbar from '../components/Navbar'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground">File list coming.</p>
      </main>
    </div>
  )
}
