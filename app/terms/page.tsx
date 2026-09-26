import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" intro={<p>These Terms govern access to Bunyip Box, a product provided and operated by Hawker Works LLC. By using the service, you agree to these Terms.</p>}>
      <section><h2>Private service</h2><p>Bunyip Box is a private research and curation application. Access may be limited, suspended, or withdrawn. You must provide accurate account information, protect your credentials, and promptly report suspected unauthorized access.</p></section>
      <section><h2>Acceptable use</h2><p>You may use the service only lawfully and in accordance with applicable third-party platform terms. You may not attempt unauthorized access, disrupt the service, introduce malicious code, scrape or misuse third-party services, evade access controls, or use the service to infringe another person&apos;s rights.</p></section>
      <section><h2>Third-party content and services</h2><p>The service may display or link to public content and services controlled by others. Hawker Works LLC does not own or endorse that content and is not responsible for its availability, accuracy, or third-party practices. Third-party terms may apply.</p></section>
      <section><h2>Your content</h2><p>You retain rights in notes and other material you submit. You grant Hawker Works LLC the limited permission needed to host, process, and display that material solely to operate and improve the service.</p></section>
      <section><h2>Service availability and disclaimers</h2><p>The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis to the extent permitted by law. Features and third-party data may change or become unavailable. Hawker Works LLC disclaims warranties not expressly required by law.</p></section>
      <section><h2>Limitation and termination</h2><p>To the extent permitted by law, Hawker Works LLC will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost data, profits, or opportunities. You may stop using the service at any time. We may suspend access for security, legal, or material Terms violations.</p></section>
      <section><h2>Changes and questions</h2><p>We may update these Terms and will publish the revised effective date here. Questions may be sent through the verified Hawker Works LLC contact channel published with the live service.</p></section>
    </LegalPage>
  );
}

