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

interface EmailChangeEmailProps {
  siteName: string
  siteUrl: string
  oldEmail?: string
  newEmail?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  siteUrl,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>confirm your new email for {siteName}</Preview>
    <Body style={main}>
      <Container className="dm-card" style={container}>
        <Link href={siteUrl} style={logo}>
          low key social
        </Link>
        <Heading className="dm-h1" style={h1}>
          confirm your new email
        </Heading>
        <Text className="dm-text" style={text}>
          {oldEmail && newEmail
            ? `you asked to move your account from ${oldEmail} to ${newEmail}.`
            : 'you asked to change the email on your account.'}{' '}
          tap below to confirm it.
        </Text>
        <Button style={button} href={confirmationUrl}>
          confirm change
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          didn't request this? ignore it and your old email stays active.
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

export default EmailChangeEmail
