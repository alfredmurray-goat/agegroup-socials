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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>you're invited to {siteName}</Preview>
    <Body style={main}>
      <Container className="dm-card" style={container}>
        <Link href={siteUrl} style={logo}>
          low key social
        </Link>
        <Heading className="dm-h1" style={h1}>
          you're invited
        </Heading>
        <Text className="dm-text" style={text}>
          someone wants you on {siteName} — a calmer social app where your feed
          only shows people in your own age group.
        </Text>
        <Button style={button} href={confirmationUrl}>
          accept invite
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          not interested? no worries, you can ignore this email.
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

export default InviteEmail
