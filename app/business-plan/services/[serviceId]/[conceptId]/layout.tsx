'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ConceptSubMenu, { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';

const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社サービス事業',
  'ai-dx': 'AI駆動開発・DX支援事業',
  'consulting': '業務コンサル・プロセス可視化・改善事業',
  'education-training': '人材育成・教育・AI導入ルール設計事業',
};

export default function ConceptDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const serviceName = SERVICE_NAMES[serviceId] || '事業企画';

  const [conceptName, setConceptName] = useState<string>('');

  useEffect(() => {
    if (serviceId && conceptId) {
      loadConcept();
    }
  }, [serviceId, conceptId]);

  const loadConcept = async () => {
    const fixedConcepts: { [key: string]: { [key: string]: string } } = {
      'own-service': {
        'maternity-support': '出産支援パーソナルアプリケーション',
        'care-support': '介護支援パーソナルアプリケーション',
      },
      'ai-dx': {
        'medical-dx': '医療法人向けDX',
        'sme-dx': '中小企業向けDX',
      },
      'consulting': {
        'sme-process': '中小企業向け業務プロセス可視化・改善',
        'medical-care-process': '医療・介護施設向け業務プロセス可視化・改善',
      },
      'education-training': {
        'corporate-ai-training': '企業向けAI人材育成・教育',
        'ai-governance': 'AI導入ルール設計・ガバナンス支援',
        'sme-ai-education': '中小企業向けAI導入支援・教育',
      },
    };
    setConceptName(fixedConcepts[serviceId]?.[conceptId] || conceptId);
  };

  // 現在のサブメニュー項目を判定
  const getCurrentSubMenu = () => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === conceptId) {
      return 'overview'; // デフォルトは概要・コンセプト
    }
    return SUB_MENU_ITEMS.find(item => item.path === lastSegment)?.id || 'overview';
  };

  const currentSubMenu = getCurrentSubMenu();

  return (
    <Layout>
      <div style={{ display: 'flex', gap: '32px' }}>
        <ConceptSubMenu serviceId={serviceId} conceptId={conceptId} currentSubMenuId={currentSubMenu} />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => router.push(`/business-plan/services/${serviceId}`)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                padding: 0,
              }}
            >
              ← {serviceName}に戻る
            </button>
            <h2 style={{ marginBottom: '4px' }}>{conceptName}</h2>
          </div>
          {children}
        </div>
      </div>
    </Layout>
  );
}

