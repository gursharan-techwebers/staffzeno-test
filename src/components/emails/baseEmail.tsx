import { env } from "@/env";
import { BaseEmailProps } from "@/types/email/common";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

const APP_NAME = env.NEXT_PUBLIC_COMPANY_NAME || "StaffZeno";
const APP_LOGO_URL = env.APP_LOGO_URL;

export function BaseEmailTemplate({
  previewText,
  heading,
  name,
  introText,
  url,
  buttonText,
  infoText,
  troubleText,
  changedAt,
  location,
}: BaseEmailProps) {
  return (
    <Html>
      <Head />

      <Preview>{previewText}</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Main content */}
          <Section style={styles.content}>
            <Img
              style={styles.logo}
              src={APP_LOGO_URL}
              alt={APP_NAME}
              width={110}
              className="block"
            />

            <Heading style={styles.heading}>{heading}</Heading>

            <Text style={styles.text}>Hi {name ? name : "there"},</Text>

            <Text style={styles.text}>{introText}</Text>

            {(changedAt || location) && (
              <Section style={styles.securityDetails}>
                {changedAt && (
                  <Text style={styles.detailText}>
                    <strong>Password changed:</strong> {changedAt}
                  </Text>
                )}

                {location && (
                  <Text style={styles.detailText}>
                    <strong>Location:</strong> {location}
                  </Text>
                )}
              </Section>
            )}

            {url && buttonText && (
              <Section style={styles.buttonWrapper}>
                <Button href={url} style={styles.button}>
                  {buttonText}
                </Button>
              </Section>
            )}

            {infoText && <Text style={styles.smallText}>{infoText}</Text>}

            {troubleText && <Text style={styles.smallText}>{troubleText}</Text>}

            {url && (
              <Link href={url} style={styles.link}>
                {url}
              </Link>
            )}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: "0px",
  },

  container: {
    margin: "0 auto",
    maxWidth: "560px",
    overflow: "hidden" as const,
  },

  logo: {
    margin: "0px 0px 40px",
  },

  content: {
    padding: "36px 0",
  },

  heading: {
    color: "#111827",
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.6px",
    lineHeight: "36px",
    margin: "0 0 24px",
  },

  text: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },

  email: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    color: "#374151",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "20px 0 28px",
    padding: "10px 12px",
  },

  buttonWrapper: {
    margin: "0 0 28px",
  },

  securityDetails: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 16px",
    margin: "4px 0 24px",
  },

  detailText: {
    color: "#374151",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 4px",
  },

  button: {
    backgroundColor: "#1447e6",
    borderRadius: "7px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: "20px",
    padding: "12px 20px",
    textDecoration: "none",
  },

  smallText: {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 12px",
  },

  link: {
    color: "#1447e6",
    fontSize: "12px",
    lineHeight: "18px",
    wordBreak: "break-all" as const,
  },

  footer: {
    borderTop: "1px solid #f0f1f3",
    padding: "20px 32px",
  },

  footerText: {
    color: "#9ca3af",
    fontSize: "12px",
    lineHeight: "18px",
    margin: 0,
    textAlign: "center" as const,
  },
};

export default BaseEmailTemplate;
