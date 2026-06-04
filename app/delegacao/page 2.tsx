import { redirect } from 'next/navigation'

export default function LegacyDelegationPage() {
  redirect('/pessoas?visao=delegacao')
}
