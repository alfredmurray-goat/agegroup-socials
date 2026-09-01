// Shared "lowkey" email styling: warm off-white paper, charcoal ink, one calm
// yellow accent. Body background stays #ffffff for email-client safety.

export const brand = {
  yellow: '#f4cd4b',
  yellowSoft: '#fdf3d2',
  ink: '#26231f',
  inkSoft: '#5c574f',
  muted: '#9a938a',
  line: '#eee9de',
  paper: '#fbf8f1',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
}

export const container = {
  backgroundColor: brand.paper,
  border: `1px solid ${brand.line}`,
  borderRadius: '20px',
  margin: '0 auto',
  maxWidth: '520px',
  padding: '32px 28px',
}

export const logo = {
  backgroundColor: brand.yellow,
  borderRadius: '12px',
  color: brand.ink,
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.5px',
  margin: '0 0 24px',
  padding: '7px 13px',
  textDecoration: 'none',
}

export const h1 = {
  color: brand.ink,
  fontSize: '24px',
  fontWeight: 'bold' as const,
  letterSpacing: '-0.4px',
  lineHeight: '1.25',
  margin: '0 0 16px',
}

export const text = {
  color: brand.inkSoft,
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

export const link = { color: brand.ink, textDecoration: 'underline' }

export const button = {
  backgroundColor: brand.yellow,
  borderRadius: '999px',
  color: brand.ink,
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '13px 26px',
  textDecoration: 'none',
}

export const code = {
  backgroundColor: brand.yellowSoft,
  border: `1px solid ${brand.yellow}`,
  borderRadius: '14px',
  color: brand.ink,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '30px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  margin: '0 0 24px',
  padding: '16px 20px',
  textAlign: 'center' as const,
}

export const hr = {
  border: 'none',
  borderTop: `1px solid ${brand.line}`,
  margin: '28px 0 18px',
}

export const footer = {
  color: brand.muted,
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0',
}

// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-card { background-color: #201e1a !important; border-color: #3a352d !important; }
    .dm-h1 { color: #f7f3ea !important; }
    .dm-text { color: #cfc8bc !important; }
    .dm-link { color: #f4cd4b !important; }
  }
  [data-ogsc] .dm-h1 { color: #f7f3ea !important; }
  [data-ogsc] .dm-text { color: #cfc8bc !important; }
`
