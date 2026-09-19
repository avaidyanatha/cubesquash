import { Link } from 'react-router-dom';

import { useHead } from '../hooks/useHead';

export default function NotFoundPage() {
  useHead({ title: 'Page not found', noindex: true });
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-text-secondary">There is nothing at this address.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-link hover:text-link-active">
        Back home
      </Link>
    </div>
  );
}
