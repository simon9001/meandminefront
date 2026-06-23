import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'MeAndMine.shop Terms and Conditions — governing the use of our platform in Kenya.',
};

const LAST_UPDATED = '9 June 2026';

export default function TermsPage() {
  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-2">Legal</p>
          <h1 className="text-3xl font-black text-forest-900 mb-3">Terms &amp; Conditions</h1>
          <p className="text-sm text-bark-500">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-sm text-bark-600 leading-relaxed bg-earth-50 border border-earth-200 rounded-2xl p-4">
            These Terms &amp; Conditions govern your use of the MeAndMine.shop platform and constitute a
            legally binding agreement between you and MeAndMine.shop in accordance with the laws of Kenya,
            including the Consumer Protection Act 2012, the Data Protection Act 2019, the Electronic
            Transactions Act 2007 (Cap 9A), and the Computer Misuse and Cybercrimes Act 2018.
          </p>
        </div>

        <div className="space-y-8 text-bark-700 text-sm leading-relaxed">

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using the MeAndMine.shop website, mobile site, or any associated service, you
            confirm that you have read, understood, and agree to be bound by these Terms &amp; Conditions and
            our Privacy Policy. If you do not agree, you must discontinue use of our platform immediately.</p>
            <p className="mt-3">Your continued use of MeAndMine.shop after any amendment to these Terms constitutes your acceptance
            of the revised Terms. We recommend you review this page periodically.</p>
          </Section>

          <Section title="2. Eligibility">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must be at least <strong>18 years of age</strong> to create an account or make a purchase.</li>
              <li>If you are under 18, a parent or legal guardian must complete transactions on your behalf.</li>
              <li>You must provide accurate, complete, and current information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately of any unauthorised use of your account.</li>
            </ul>
          </Section>

          <Section title="3. Account Registration &amp; Security">
            <p>When you register an account you agree to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Provide truthful and accurate personal information.</li>
              <li>Keep your password secure and not share it with any third party.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify MeAndMine.shop at <a href="mailto:support@meandmine.shop" className="text-forest-700 underline">support@meandmine.shop</a> of any suspected security breach.</li>
            </ul>
            <p className="mt-3">MeAndMine.shop reserves the right to suspend or terminate accounts that violate these Terms or engage
            in fraudulent activity, without prior notice.</p>
          </Section>

          <Section title="4. Products &amp; Pricing">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All prices are displayed in <strong>Kenya Shillings (KES)</strong> and are inclusive of applicable Value Added Tax (VAT) at the prevailing rate set by the Kenya Revenue Authority (KRA).</li>
              <li>Product images are for illustration purposes only; actual products may differ slightly.</li>
              <li>MeAndMine.shop reserves the right to change prices at any time without prior notice.</li>
              <li>In the event of a pricing error, we reserve the right to cancel orders placed at an incorrect price and will notify you immediately.</li>
              <li>Product availability is subject to stock levels and may change without notice.</li>
            </ul>
          </Section>

          <Section title="5. Orders &amp; Payments">
            <p>By placing an order you make an offer to purchase the selected products. Your order is accepted
            when you receive an order confirmation email or WhatsApp message from us.</p>
            <p className="mt-3">We accept the following payment methods:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>M-Pesa (Lipa na M-Pesa Paybill)</strong> — instant electronic payment.</li>
              <li><strong>Visa / Mastercard</strong> — via our secure payment gateway.</li>
              <li><strong>Bank Transfer</strong> — details provided at checkout.</li>
              <li><strong>Cash on Delivery (COD)</strong> — available in select delivery zones; a deposit may be required.</li>
            </ul>
            <p className="mt-3">All electronic transactions are processed in accordance with the <em>Electronic Transactions Act 2007 (Cap 9A)</em>.
            Payment details are encrypted and we do not store full card information.</p>
          </Section>

          <Section title="6. Delivery &amp; Shipping">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Nairobi:</strong> Same-day dispatch for orders placed before 12:00 PM (Mon–Sat).</li>
              <li><strong>Nationwide:</strong> Delivery within 2–4 business days via our partner couriers (DHL, Aramex, Fargo, EasyCoach).</li>
              <li>Free delivery on orders above <strong>KES 3,000</strong>. A delivery fee applies to orders below this threshold.</li>
              <li>Delivery timelines are estimates; MeAndMine.shop is not liable for delays caused by third-party logistics providers, natural disasters, or government actions.</li>
              <li>Risk of loss or damage passes to you upon delivery to the address provided.</li>
            </ul>
          </Section>

          <Section title="7. Returns &amp; Refunds (Consumer Protection Act 2012)">
            <p>In accordance with the <em>Consumer Protection Act No. 46 of 2012</em>:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>You may return eligible products within <strong>7 calendar days</strong> of delivery.</li>
              <li>Items must be unused, in original packaging, with all tags and accessories intact.</li>
              <li>Refunds are processed within <strong>7 business days</strong> via the original payment method.</li>
              <li>Perishable goods, custom orders, and items marked &ldquo;Final Sale&rdquo; are not eligible for return.</li>
              <li>Return shipping costs are the customer&apos;s responsibility unless the product is defective or incorrectly delivered.</li>
              <li>To initiate a return, contact us at <a href="mailto:returns@meandmine.shop" className="text-forest-700 underline">returns@meandmine.shop</a> or via WhatsApp.</li>
            </ul>
          </Section>

          <Section title="8. Product Warranties">
            <p>Products sold by MeAndMine.shop carry the manufacturer&apos;s warranty where applicable.
            MeAndMine.shop does not extend its own warranty beyond that offered by the manufacturer unless
            otherwise stated in writing. Warranty claims must be submitted with proof of purchase.</p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>All content on the MeAndMine.shop platform — including but not limited to logos, photographs,
            product descriptions, and design elements — is owned by or licensed to MeAndMine.shop and is
            protected under the <em>Copyright Act (Cap 130)</em> of Kenya. You may not reproduce, distribute,
            or create derivative works without our prior written consent.</p>
          </Section>

          <Section title="10. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Use the platform for any unlawful purpose or in violation of any Kenyan law.</li>
              <li>Submit false, misleading, or fraudulent orders or information.</li>
              <li>Interfere with or disrupt the platform&apos;s infrastructure or security (contrary to the <em>Computer Misuse and Cybercrimes Act 2018</em>).</li>
              <li>Scrape, crawl, or harvest data from the platform without written permission.</li>
              <li>Engage in any conduct that could damage the reputation of MeAndMine.shop.</li>
            </ul>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>To the maximum extent permitted by Kenyan law, MeAndMine.shop shall not be liable for any
            indirect, incidental, special, or consequential damages arising out of your use of (or inability
            to use) the platform, including loss of data or profits.</p>
            <p className="mt-3">Our total liability for any claim arising from these Terms shall not exceed
            the total amount you paid for the relevant order.</p>
          </Section>

          <Section title="12. Privacy &amp; Data Protection">
            <p>Your use of this platform is also governed by our{' '}
            <Link href="/privacy" className="text-forest-700 font-semibold underline">Privacy Policy</Link>,
            which forms part of these Terms. We process your personal data in compliance with the
            <em> Data Protection Act No. 24 of 2019</em> and are registered with the
            Office of the Data Protection Commissioner (ODPC).</p>
          </Section>

          <Section title="13. Governing Law &amp; Jurisdiction">
            <p>These Terms are governed by and construed in accordance with the laws of the
            Republic of Kenya. Any dispute shall be subject to the exclusive jurisdiction of the
            courts of Kenya.</p>
          </Section>

          <Section title="14. Dispute Resolution">
            <p>We encourage you to contact us first at{' '}
            <a href="mailto:support@meandmine.shop" className="text-forest-700 underline">support@meandmine.shop</a> to
            resolve any dispute amicably. If a resolution cannot be reached, disputes may be referred to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>The <strong>Competition Authority of Kenya (CAK)</strong> for consumer protection matters.</li>
              <li>The <strong>Office of the Data Protection Commissioner (ODPC)</strong> for data-related complaints.</li>
              <li>The relevant court of competent jurisdiction in Kenya.</li>
            </ul>
          </Section>

          <Section title="15. Amendments">
            <p>MeAndMine.shop reserves the right to modify these Terms at any time. Changes take effect
            immediately upon posting. You are advised to review this page regularly. Continued use of
            the platform after changes constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="16. Contact Information">
            <p>For any questions regarding these Terms:</p>
            <div className="mt-3 bg-white border border-bark-100 rounded-2xl p-5 space-y-2 text-sm">
              <p><strong>MeAndMine.shop</strong></p>
              <p>Nairobi, Kenya</p>
              <p>Email: <a href="mailto:legal@meandmine.shop" className="text-forest-700 underline">legal@meandmine.shop</a></p>
              <p>WhatsApp: +254 700 000 000</p>
            </div>
          </Section>

        </div>

        {/* Bottom nav */}
        <div className="mt-12 pt-8 border-t border-bark-100 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-forest-700 font-semibold hover:underline">Privacy Policy →</Link>
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
