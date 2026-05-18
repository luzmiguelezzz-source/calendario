export const metadata = {
  title: 'Content Calendar | @luz.psicosex',
  description: 'Calendario de contenido para redes sociales',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
