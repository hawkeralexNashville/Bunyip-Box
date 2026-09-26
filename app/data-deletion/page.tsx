import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Data Deletion Instructions" };

export default function DataDeletionPage() {
  return (
    <LegalPage eyebrow="Your data" title="Data Deletion Instructions" intro={<p>You may ask Hawker Works LLC to delete your Bunyip Box account and personal data associated with it. You do not need to be signed in to view or follow these instructions.</p>}>
      <section><h2>How to submit a request</h2><ol><li>Use the verified Hawker Works LLC support or business contact channel published on the live Bunyip Box application.</li><li>State that you are requesting deletion of your Bunyip Box account and associated data.</li><li>Include the email address associated with the account. Do not send your password or access credentials.</li><li>Complete a reasonable identity-verification step if requested. This protects accounts from unauthorized deletion.</li></ol></section>
      <section><h2>What happens next</h2><p>We will acknowledge the request through the verified contact channel and, after verification, delete or de-identify account details, sessions, lists, saved-post relationships, private notes, and preferences unless retention is required by law, security, fraud prevention, or dispute resolution.</p></section>
      <section><h2>Public source records</h2><p>Deleting an account does not necessarily delete independently maintained records of public Pages or public posts that are not personal to the requesting account and may also support other users. Your user-owned relationships and private notes will be removed from those records.</p></section>
      <section><h2>Timing and confirmation</h2><p>We will process verified requests within the period required by applicable law and send confirmation when processing is complete. Backup copies may remain for a limited period until routinely overwritten, subject to access controls and legal obligations.</p></section>
    </LegalPage>
  );
}
