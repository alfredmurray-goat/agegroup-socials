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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>one tap to confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container className="dm-card" style={container}>
        <Link href={siteUrl} style={logo}>
          low key social
        </Link>
        <Heading className="dm-h1" style={h1}>
          confirm your email
        </Heading>
        <Text className="dm-text" style={text}>
          hey — you're almost in. tap below to confirm {recipient} and finish
          setting up your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          confirm email
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          didn't sign up? just ignore this email, nothing happens.
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

export default SignupEmail
