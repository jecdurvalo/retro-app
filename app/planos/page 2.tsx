import { redirect } from 'next/navigation'

export default function LegacyPlansPage() {
  redirect('/frentes?tipo=plano-de-acao')
}
