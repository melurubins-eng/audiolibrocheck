import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Audiolibro — PDF a Audio',
  description: 'Convierte cualquier PDF en un audiolibro con voces en español de España, México, Argentina y Colombia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
