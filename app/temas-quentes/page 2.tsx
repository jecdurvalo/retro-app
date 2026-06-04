import { redirect } from 'next/navigation'

export default function LegacyHotTopicsPage() {
  redirect('/frentes?tipo=tema-sensivel')
}
