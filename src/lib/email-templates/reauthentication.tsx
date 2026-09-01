import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import {
  code,
  container,
  darkModeCss,
  footer,
  h1,
  hr,
  link,
  logo,
  main,
  text,
} from './brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>your verification code</Preview>
    <Body style={main}>
      <Container className="dm-card" style={container}>
        <span style={logo}>low key social</span>
        <Heading className="dm-h1" style={h1}>
          quick identity check
        </Heading>
        <Text className="dm-text" style={text}>
          type this code in the app to confirm it's really you:
        </Text>
        <Text style={code}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          didn't request this? ignore it — the code expires on its own.
          <br />
          low key social is in beta — feedback goes to{' '}
          <Link href="mailto:alfredcasper1010@gmail.com" style={link}>
            alfredcasper1010@gmail.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
