'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CompanyPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  useEffect(() => {
    // デフォルトで概要・コンセプトページにリダイレクト
    router.replace(`/business-plan/company/${planId}/overview`);
  }, [planId, router]);

  return null;
}

