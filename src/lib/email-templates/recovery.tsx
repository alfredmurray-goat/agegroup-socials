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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>reset your {siteName} password</Preview>
    <Body style={main}>
      <Container className="dm-card" style={container}>
        <span style={logo}>low key social</span>
        <Heading className="dm-h1" style={h1}>
          reset your password
        </Heading>
        <Text className="dm-text" style={text}>
          tap below to pick a new password. the link only works once.
        </Text>
        <Button style={button} href={confirmationUrl}>
          set a new password
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          didn't request this? ignore it and your password stays the same.
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

export default RecoveryEmail
