import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - iAgrin Admin",
  description: "Sign in to the iAgrin Admin Console",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
