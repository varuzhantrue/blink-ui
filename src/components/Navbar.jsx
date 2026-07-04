import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <span className="text-lg font-semibold tracking-tight">Blink</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
