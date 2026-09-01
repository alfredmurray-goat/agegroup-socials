import * as React from 'react'

import {
  Body,
  Button,
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
  button,
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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>your login link for {siteName}</Preview>
    <Body style={main}>
      <Container className="dm-card" style={container}>
        <span style={logo}>low key social</span>
        <Heading className="dm-h1" style={h1}>
          your login link
        </Heading>
        <Text className="dm-text" style={text}>
          no password needed. tap below to log back in — the link works once and
          expires soon.
        </Text>
        <Button style={button} href={confirmationUrl}>
          log me in
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          didn't ask for this? ignore it, your account stays locked.
          <br />
          {siteName} is in beta — feedback goes to{' '}
          <Link href="mailto:alfredcasper1010@gmail.com" style={link}>
            alfredcasper1010@gmail.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
