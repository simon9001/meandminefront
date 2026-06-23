import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How MeAndMine.shop collects, uses, and protects your personal data under Kenya\'s Data Protection Act 2019.',
};

const LAST_UPDATED = '9 June 2026';

export default function PrivacyPage() {
  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-2">Legal</p>
          <h1 className="text-3xl font-black text-forest-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-bark-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-sm text-bark-600 leading-relaxed bg-earth-50 border border-earth-200 rounded-2xl p-4">
            MeAndMine.shop is committed to protecting your personal data in accordance with
            Kenya&apos;s <strong>Data Protection Act No. 24 of 2019</strong> and its subsidiary regulations.
            This Policy explains what data we collect, why we collect it, and your rights as a data subject.
          </p>
        </div>

        <div className="space-y-8 text-bark-700 text-sm leading-relaxed">

          <Section title="1. Data Controller">
            <p><strong>MeAndMine.shop</strong> (hereinafter &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is the data controller
            responsible for your personal data. We are registered with the
            <strong> Office of the Data Protection Commissioner (ODPC)</strong> of Kenya.</p>
            <div className="mt-3 bg-white border border-bark-100 rounded-xl p-4 text-sm space-y-1">
              <p><strong>MeAndMine.shop</strong> — Nairobi, Kenya</p>
              <p>Email: <a href="mailto:privacy@meandmine.shop" className="text-forest-700 underline">privacy@meandmine.shop</a></p>
              <p>Tel / WhatsApp: +254 700 000 000</p>
            </div>
          </Section>

          <Section title="2. Data We Collect">
            <p>We may collect the following categories of personal data:</p>
            <TableLike rows={[
              ['Identity Data',  'First name, last name, username or similar identifier'],
              ['Contact Data',   'Email address, phone number (including M-Pesa-registered number), delivery address'],
              ['Transaction Data','Details of products purchased, order history, payment method used (M-Pesa transaction IDs, masked card numbers)'],
              ['Technical Data', 'IP address, browser type, device information, pages visited, referral source'],
              ['Usage Data',     'Information about how you use our website and services'],
              ['Communications', 'Records of emails, WhatsApp messages, or calls with our support team'],
            ]} />
          </Section>

          <Section title="3. How We Collect Your Data">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Directly from you</strong> — when you register, place an order, or contact us.</li>
              <li><strong>Automatically</strong> — via cookies and similar tracking technologies when you browse our site.</li>
              <li><strong>Third parties</strong> — payment processors (e.g., M-Pesa/Safaricom), delivery partners, and analytics providers.</li>
            </ul>
          </Section>

          <Section title="4. Purpose &amp; Legal Basis for Processing">
            <TableLike rows={[
              ['Process and fulfil your orders',       'Performance of a contract (Section 30, Data Protection Act)'],
              ['Create and manage your account',       'Performance of a contract / Your consent'],
              ['Send order confirmations and updates', 'Performance of a contract'],
              ['Process payments (M-Pesa, card)',      'Performance of a contract / Legal obligation'],
              ['Provide customer support',             'Legitimate interest'],
              ['Send promotional communications',      'Your explicit consent (opt-in only)'],
              ['Prevent fraud and ensure security',    'Legitimate interest / Legal obligation'],
              ['Comply with Kenyan laws (KRA, CAK)',   'Legal obligation'],
              ['Improve our platform (analytics)',     'Legitimate interest'],
            ]} />
            <p className="mt-3">You may withdraw consent for marketing communications at any time by emailing
            <a href="mailto:privacy@meandmine.shop" className="text-forest-700 underline ml-1">privacy@meandmine.shop</a> or using
            the unsubscribe link in any email we send.</p>
          </Section>

          <Section title="5. Data Sharing &amp; Third Parties">
            <p>We do not sell your personal data. We may share it with the following categories of recipients:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Payment processors:</strong> Safaricom (M-Pesa), card acquirers — for transaction processing only.</li>
              <li><strong>Delivery partners:</strong> DHL, Aramex, Fargo, EasyCoach, Little — to fulfil your orders.</li>
              <li><strong>IT service providers:</strong> Hosting, analytics, and email providers bound by confidentiality obligations.</li>
              <li><strong>Regulators &amp; law enforcement:</strong> Where required by Kenyan law (KRA, CAK, police).</li>
            </ul>
            <p className="mt-3">All third parties are contractually required to protect your data and use it only for the
            specified purpose.</p>
          </Section>

          <Section title="6. International Data Transfers">
            <p>Some of our service providers may process data outside Kenya. Where this occurs, we ensure
            adequate safeguards are in place (such as standard contractual clauses) in line with Section 48
            of the Data Protection Act 2019.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your personal data only as long as necessary for the purposes outlined in this Policy
            or as required by Kenyan law (e.g., tax records must be retained for 5 years under the Tax
            Procedures Act). When data is no longer needed, it is securely deleted or anonymised.</p>
          </Section>

          <Section title="8. Your Rights as a Data Subject (Data Protection Act 2019)">
            <p>Under the Data Protection Act 2019, you have the following rights:</p>
            <TableLike rows={[
              ['Right of Access (s.26(a))',       'Request a copy of the personal data we hold about you'],
              ['Right to Rectification (s.26(b))','Ask us to correct inaccurate or incomplete data'],
              ['Right to Erasure (s.26(c))',      'Request deletion of your data where there is no lawful basis for continued processing'],
              ['Right to Restriction (s.26(d))',  'Request that we restrict processing of your data in certain circumstances'],
              ['Right to Portability (s.26(e))',  'Receive your data in a structured, machine-readable format'],
              ['Right to Object (s.26(f))',        'Object to processing based on legitimate interests or for direct marketing'],
              ['Right to withdraw consent',        'Withdraw consent for any processing based on consent at any time'],
            ]} />
            <p className="mt-3">To exercise any of these rights, please contact our Data Protection Officer at{' '}
            <a href="mailto:privacy@meandmine.shop" className="text-forest-700 underline">privacy@meandmine.shop</a>.
            We will respond within <strong>21 days</strong> as required by law.</p>
            <p className="mt-3">If you are unsatisfied with our response, you may lodge a complaint with the
            <strong> Office of the Data Protection Commissioner (ODPC)</strong> at{' '}
            <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-forest-700 underline">www.odpc.go.ke</a>.</p>
          </Section>

          <Section title="9. Cookies">
            <p>We use cookies and similar technologies to enhance your browsing experience. Cookies we use include:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Strictly necessary cookies:</strong> Required for the platform to function (session management, security). These cannot be disabled.</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors use our site (e.g., Google Analytics). You can opt out via your browser settings.</li>
              <li><strong>Preference cookies:</strong> Remember your choices (language, region).</li>
            </ul>
            <p className="mt-3">You may control cookies via your browser settings. Disabling cookies may affect the functionality of our platform.</p>
          </Section>

          <Section title="10. Security Measures">
            <p>We implement appropriate technical and organisational measures to protect your personal data
            against unauthorised access, alteration, disclosure, or destruction, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>SSL/TLS encryption for all data transmitted over our platform.</li>
              <li>Secure password hashing (bcrypt).</li>
              <li>Access controls limiting staff access to personal data on a need-to-know basis.</li>
              <li>Regular security assessments.</li>
            </ul>
            <p className="mt-3">In the event of a data breach that poses a risk to your rights, we will notify the ODPC within
            72 hours and affected users without undue delay, in accordance with Section 43 of the Data
            Protection Act 2019.</p>
          </Section>

          <Section title="11. Children&apos;s Privacy">
            <p>Our platform is not directed at children under the age of 18. We do not knowingly collect
            personal data from minors. If you believe we have inadvertently collected such data, please
            contact us immediately and we will delete it.</p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. The updated version will be posted on
            this page with a revised &ldquo;Last updated&rdquo; date. We encourage you to review this Policy
            periodically. Material changes will be communicated via email or a prominent notice on our site.</p>
          </Section>

          <Section title="13. Contact Us">
            <div className="bg-white border border-bark-100 rounded-2xl p-5 space-y-2">
              <p><strong>Data Protection Officer — MeAndMine.shop</strong></p>
              <p>Email: <a href="mailto:privacy@meandmine.shop" className="text-forest-700 underline">privacy@meandmine.shop</a></p>
              <p>WhatsApp: +254 700 000 000</p>
              <p>Physical address: Nairobi, Kenya</p>
            </div>
          </Section>

        </div>

        {/* Bottom nav */}
        <div className="mt-12 pt-8 border-t border-bark-100 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-forest-700 font-semibold hover:underline">Terms &amp; Conditions →</Link>
          <Link href="/products" className="text-bark-500 hover:underline">Back to Shopping</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-black text-forest-900 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TableLike({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-bark-100">
      {rows.map(([left, right], i) => (
        <div key={i} className={`flex text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}`}>
          <div className="w-2/5 px-4 py-2.5 font-semibold text-forest-900 border-r border-bark-100">{left}</div>
          <div className="flex-1 px-4 py-2.5 text-bark-600">{right}</div>
        </div>
      ))}
    </div>
  );
}
