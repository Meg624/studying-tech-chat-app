// src/components/auth/LogoutButton.tsx
'use client'
import { logout } from '@/app/logout/actions'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('ログアウトエラー:', error)
      // エラーが出ても強制的にログインページへ
      window.location.href = '/login'
    }
  }
  
  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
    >
      ログアウト
    </button>
  )
}