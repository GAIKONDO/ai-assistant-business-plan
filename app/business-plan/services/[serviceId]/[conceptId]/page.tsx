'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';


export default function ConceptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;

  useEffect(() => {
    // デフォルトで「概要・コンセプト」ページにリダイレクト
    router.replace(`/business-plan/services/${serviceId}/${conceptId}/overview`);
  }, [router, serviceId, conceptId]);

  return null;
}

