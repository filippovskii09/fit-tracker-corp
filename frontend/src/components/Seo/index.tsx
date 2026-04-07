import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  SOCIAL_IMAGE_PATH,
} from './constant';
import type { SeoProps } from './types';

const upsertMeta = (
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const upsertCanonical = (url: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }

  element.setAttribute('href', url);
};

export const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path,
  noIndex = false,
}: SeoProps) => {
  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${path || window.location.pathname}`;
    const socialImageUrl = `${window.location.origin}${SOCIAL_IMAGE_PATH}`;

    document.title = title;
    upsertCanonical(canonicalUrl);

    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow',
    );
    upsertMeta(
      'meta[name="application-name"]',
      'name',
      'application-name',
      SITE_NAME,
    );
    upsertMeta(
      'meta[property="og:site_name"]',
      'property',
      'og:site_name',
      SITE_NAME,
    );
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta(
      'meta[property="og:description"]',
      'property',
      'og:description',
      description,
    );
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta(
      'meta[property="og:image"]',
      'property',
      'og:image',
      socialImageUrl,
    );
    upsertMeta(
      'meta[name="twitter:card"]',
      'name',
      'twitter:card',
      'summary_large_image',
    );
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      description,
    );
    upsertMeta(
      'meta[name="twitter:image"]',
      'name',
      'twitter:image',
      socialImageUrl,
    );
  }, [description, noIndex, path, title]);

  return null;
};
