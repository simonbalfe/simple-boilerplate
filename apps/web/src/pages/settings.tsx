import { useUser } from '@shared/hooks/use-user'
import { client } from '@shared/lib/api'
import { authClient } from '@shared/lib/auth-client'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { toast } from 'sonner'

export function SettingsPage() {
  const { user } = useUser()

  const handleDeleteAccount = async () => {
    if (!user) return
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return

    try {
      await client.users.delete({ userId: user.id })
      await authClient.signOut()
      window.location.href = '/auth'
    } catch {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Permanently delete your account and all data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
