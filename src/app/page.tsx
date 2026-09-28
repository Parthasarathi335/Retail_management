import { redirect } from 'next/navigation'

export default function Home() {
  // Authorization is enforced in proxy.ts:
  // authenticated admins go to /dashboard, everyone else to /login.
  redirect('/login')
}