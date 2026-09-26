import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" intro={<p>Bunyip Box (&ldquo;Bunyip Box,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a product and service owned and operated by Hawker Works LLC.</p>}>
      <section><h2>Information we collect</h2><p>When account features become available, we may collect account details you provide, such as your name, email address, password hash, timezone, saved items, private notes, and list preferences. We also collect limited technical information needed to secure, operate, and diagnose the service, such as session, request, and error data.</p></section>
      <section><h2>Public content data</h2><p>The service is designed to store selected public Page and post information obtained through authorized platform interfaces. This may include Page names, identifiers, public post text, publication times, permitted media links, and available aggregate engagement counts. Bunyip Box is not designed to collect private messages, commenter identities, or comment text.</p></section>
      <section><h2>How information is used</h2><p>We use information to provide and secure the service, authenticate users, retain user-directed research, maintain service reliability, respond to requests, and comply with law. We do not sell personal information.</p></section>
      <section><h2>Sharing and service providers</h2><p>Information may be processed by hosting, infrastructure, and software providers acting on our behalf, or disclosed when reasonably necessary to comply with law, protect rights and safety, or complete a corporate transaction. Providers receive only the access reasonably needed for their role.</p></section>
      <section><h2>Retention and security</h2><p>We retain information while it is needed to provide the service, preserve user-directed historical research, meet legal obligations, or resolve disputes. We use reasonable administrative and technical safeguards, but no method of storage or transmission is completely secure.</p></section>
      <section><h2>Your choices</h2><p>You may request access, correction, or deletion where applicable. Follow our public Data Deletion Instructions to request account and associated-data deletion.</p></section>
      <section><h2>Changes and contact</h2><p>We may update this policy as the service changes and will publish the revised effective date here. Privacy questions may be sent through the verified Hawker Works LLC contact channel published with the live service. We will not publish an unverified contact address.</p></section>
    </LegalPage>
  );
}

