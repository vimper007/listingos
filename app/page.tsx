import { redirect } from 'next/navigation'

// Middleware handles redirect logic (logged-in → /dashboard, anon → /auth/login)
export default function HomePage() {
  redirect('/auth/login')
}
