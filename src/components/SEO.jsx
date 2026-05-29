import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, url }) {
  const siteTitle = '간단하게 간단하자: EASY IF';
  const defaultDescription = '복잡한 칼로리 계산은 그만. 먹은 것을 기록하고 정해진 시간만 지키세요. 간헐적 단식을 위한 가장 직관적인 도우미, 간단하게 간단하자: EASY IF';
  const defaultKeywords = '간헐적단식, 다이어트, 단식어플, 식단기록, 건강, Easy IF, 간헐적단식방법, 16대8단식';
  const siteUrl = 'https://easy-if.com'; // 배포될 도메인 예시

  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const currentUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:site_name" content="간단하게 간단하자: EASY IF" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      
      {/* 모바일 뷰포트 최적화 */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    </Helmet>
  );
}
