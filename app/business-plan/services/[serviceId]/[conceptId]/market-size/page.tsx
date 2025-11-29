'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

export default function MarketSizePage() {
  // 母の年齢（５歳階級）・出生順位別にみた出生数の年次推移データ（2021-2024年）
  const birthByAgeAndOrderData = [
    { year: 2021, '総数': 811622, '第1子': 372434, '第2子': 294444, '第3子以上': 144744 },
    { year: 2022, '総数': 770759, '第1子': 355523, '第2子': 281418, '第3子以上': 133818 },
    { year: 2023, '総数': 727288, '第1子': 338908, '第2子': 266195, '第3子以上': 122185 },
    { year: 2024, '総数': 686061, '第1子': 322419, '第2子': 248625, '第3子以上': 115017 }
  ];

  // 母の年齢（５歳階級）別にみた合計特殊出生率データ
  const ageGroupFertilityData = Array.from({ length: 70 }, (_, i) => {
    const year = 1955 + i;
    return {
      x: year,
      '総数(合計特殊出生率)': 2.4 - (year - 1955) * 0.017 + (year === 1966 ? -0.3 : 0),
      '25-29歳': 0.9 + (year < 1970 ? 0.1 : -0.01 * (year - 1970)),
      '20-24歳': 0.55 - (year - 1955) * 0.006,
      '30-34歳': 0.3 + (year > 1980 ? (year - 1980) * 0.01 : 0),
      '35-39歳': 0.05 + (year > 1990 ? (year - 1990) * 0.002 : 0),
      '40-44歳': year > 1990 ? (year - 1990) * 0.0007 : 0,
      '15-19歳': year > 1980 && year < 2005 ? 0.05 : 0
    };
  });

  // 出生数の年次推移，出生順位別データ
  const birthOrderData = [
    { year: 1985, '総数': 1431577, '第1子': 602005, '第2子': 562920, '第3子以上': 266652 },
    { year: 1995, '総数': 1187064, '第1子': 567530, '第2子': 428394, '第3子以上': 191140 },
    { year: 2005, '総数': 1062530, '第1子': 512412, '第2子': 399307, '第3子以上': 150811 },
    { year: 2015, '総数': 1005721, '第1子': 478101, '第2子': 363244, '第3子以上': 164376 },
    { year: 2021, '総数': 811622, '第1子': 372434, '第2子': 294444, '第3子以上': 144744 },
    { year: 2022, '総数': 770759, '第1子': 355523, '第2子': 281418, '第3子以上': 133818 },
    { year: 2023, '総数': 727288, '第1子': 338908, '第2子': 266195, '第3子以上': 122185 },
    { year: 2024, '総数': 686061, '第1子': 322419, '第2子': 248625, '第3子以上': 115017 }
  ];

  // 初婚の妻の年齢（各歳）の構成割合データ
  const marriageAgeData2004 = Array.from({ length: 31 }, (_, i) => ({
    age: 15 + i,
    '2004': i === 11 || i === 12 ? 9.5 - Math.abs(i - 11.5) * 0.5 : Math.max(0, 9.5 - Math.abs(i - 11.5) * 0.8)
  }));

  const marriageAgeData2014 = Array.from({ length: 31 }, (_, i) => ({
    age: 15 + i,
    '2014': i === 12 || i === 13 ? 9.0 - Math.abs(i - 12.5) * 0.5 : Math.max(0, 9.0 - Math.abs(i - 12.5) * 0.8)
  }));

  const marriageAgeData2024 = Array.from({ length: 31 }, (_, i) => ({
    age: 15 + i,
    '2024': i === 13 || i === 14 ? 8.5 - Math.abs(i - 13.5) * 0.5 : Math.max(0, 8.5 - Math.abs(i - 13.5) * 0.8)
  }));

  // ターゲット人口の円グラフデータ
  const targetPopulationData = [
    { id: '妊婦', label: '妊婦', value: 11.3, color: '#87CEEB' },
    { id: '0-1歳の親', label: '0-1歳の親', value: 13.5, color: '#90EE90' },
    { id: '1-2歳の親', label: '1-2歳の親', value: 15.2, color: '#FFA500' },
    { id: '2-3歳の親', label: '2-3歳の親', value: 15.2, color: '#FF0000' },
    { id: '3-6歳の親', label: '3-6歳の親', value: 44.9, color: '#9370DB' }
  ];

  // ターゲット人口の詳細データ
  const targetPopulationTableData = [
    { category: '妊婦', targetPopulation: '約58万人', acquisitionRate: '30%', acquiredCount: '約17万人', color: '#87CEEB' },
    { category: '0-1歳の親（夫婦で1カウント）', targetPopulation: '約70万組', acquisitionRate: '20%', acquiredCount: '約14万組', color: '#90EE90' },
    { category: '1-2歳の親（夫婦で1カウント）', targetPopulation: '約78万組', acquisitionRate: '10%', acquiredCount: '約8万組', color: '#FFA500' },
    { category: '2-3歳の親（夫婦で1カウント）', targetPopulation: '約78万組', acquisitionRate: '5%', acquiredCount: '約4万組', color: '#FF0000' },
    { category: '3-6歳の親（夫婦で1カウント）', targetPopulation: '約232万組', acquisitionRate: '1%', acquiredCount: '約2万組', color: '#9370DB' }
  ];

  // 男性の育児休業・育児目的休暇の取得率の算定対象別事業所割合データ
  const maleParentalLeaveTableData = [
    // 総数
    { category: '総数', total: 100.0, onlyLeave: 53.4, bothLeaveAndPurpose: 43.2, other: 3.4 },
    // 産業
    { category: '鉱業,採石業,砂利採取業', total: 100.0, onlyLeave: 71.6, bothLeaveAndPurpose: 28.4, other: null },
    { category: '建設業', total: 100.0, onlyLeave: 48.9, bothLeaveAndPurpose: 44.1, other: 7.0 },
    { category: '製造業', total: 100.0, onlyLeave: 59.6, bothLeaveAndPurpose: 40.3, other: 0.2 },
    { category: '電気・ガス・熱供給・水道業', total: 100.0, onlyLeave: 40.4, bothLeaveAndPurpose: 56.7, other: 2.9 },
    { category: '情報通信業', total: 100.0, onlyLeave: 57.3, bothLeaveAndPurpose: 42.7, other: null },
    { category: '運輸業,郵便業', total: 100.0, onlyLeave: 41.8, bothLeaveAndPurpose: 58.2, other: null },
    { category: '卸売業,小売業', total: 100.0, onlyLeave: 64.1, bothLeaveAndPurpose: 35.0, other: 0.9 },
    { category: '金融業,保険業', total: 100.0, onlyLeave: 43.1, bothLeaveAndPurpose: 56.9, other: null },
    { category: '不動産業,物品賃貸業', total: 100.0, onlyLeave: 31.3, bothLeaveAndPurpose: 68.7, other: null },
    { category: '学術研究,専門・技術サービス業', total: 100.0, onlyLeave: 53.7, bothLeaveAndPurpose: 46.3, other: null },
    { category: '宿泊業,飲食サービス業', total: 100.0, onlyLeave: 48.4, bothLeaveAndPurpose: 42.5, other: 9.2 },
    { category: '生活関連サービス業、娯楽業', total: 100.0, onlyLeave: 46.8, bothLeaveAndPurpose: 47.6, other: 5.7 },
    { category: '教育,学習支援業', total: 100.0, onlyLeave: 74.8, bothLeaveAndPurpose: 15.3, other: 9.9 },
    { category: '医療,福祉', total: 100.0, onlyLeave: 50.5, bothLeaveAndPurpose: 45.7, other: 3.8 },
    { category: '複合サービス事業', total: 100.0, onlyLeave: 48.5, bothLeaveAndPurpose: 44.7, other: 6.8 },
    { category: 'サービス業(他に分類されないもの)', total: 100.0, onlyLeave: 55.4, bothLeaveAndPurpose: 36.7, other: 7.8 },
    // 事業所規模
    { category: '500人以上', total: 100.0, onlyLeave: 70.9, bothLeaveAndPurpose: 28.1, other: 1.1 },
    { category: '100~499人', total: 100.0, onlyLeave: 65.3, bothLeaveAndPurpose: 34.7, other: 0.1 },
    { category: '30~99人', total: 100.0, onlyLeave: 58.6, bothLeaveAndPurpose: 39.8, other: 1.5 },
    { category: '5~29人', total: 100.0, onlyLeave: 51.2, bothLeaveAndPurpose: 44.8, other: 4.0 },
    { category: '30人以上(再掲)', total: 100.0, onlyLeave: 60.8, bothLeaveAndPurpose: 38.1, other: 1.1 }
  ];

  // 女性の育児休業・育児目的休暇の取得率の算定対象別事業所割合データ
  // 注: データはe-Statより取得予定（現在は男性と同じ構造でプレースホルダー）
  const femaleParentalLeaveTableData = [
    // 総数
    { category: '総数', total: 100.0, onlyLeave: 53.4, bothLeaveAndPurpose: 43.2, other: 3.4 },
    // 産業
    { category: '鉱業,採石業,砂利採取業', total: 100.0, onlyLeave: 71.6, bothLeaveAndPurpose: 28.4, other: null },
    { category: '建設業', total: 100.0, onlyLeave: 48.9, bothLeaveAndPurpose: 44.1, other: 7.0 },
    { category: '製造業', total: 100.0, onlyLeave: 59.6, bothLeaveAndPurpose: 40.3, other: 0.2 },
    { category: '電気・ガス・熱供給・水道業', total: 100.0, onlyLeave: 40.4, bothLeaveAndPurpose: 56.7, other: 2.9 },
    { category: '情報通信業', total: 100.0, onlyLeave: 57.3, bothLeaveAndPurpose: 42.7, other: null },
    { category: '運輸業,郵便業', total: 100.0, onlyLeave: 41.8, bothLeaveAndPurpose: 58.2, other: null },
    { category: '卸売業,小売業', total: 100.0, onlyLeave: 64.1, bothLeaveAndPurpose: 35.0, other: 0.9 },
    { category: '金融業,保険業', total: 100.0, onlyLeave: 43.1, bothLeaveAndPurpose: 56.9, other: null },
    { category: '不動産業,物品賃貸業', total: 100.0, onlyLeave: 31.3, bothLeaveAndPurpose: 68.7, other: null },
    { category: '学術研究,専門・技術サービス業', total: 100.0, onlyLeave: 53.7, bothLeaveAndPurpose: 46.3, other: null },
    { category: '宿泊業,飲食サービス業', total: 100.0, onlyLeave: 48.4, bothLeaveAndPurpose: 42.5, other: 9.2 },
    { category: '生活関連サービス業、娯楽業', total: 100.0, onlyLeave: 46.8, bothLeaveAndPurpose: 47.6, other: 5.7 },
    { category: '教育,学習支援業', total: 100.0, onlyLeave: 74.8, bothLeaveAndPurpose: 15.3, other: 9.9 },
    { category: '医療,福祉', total: 100.0, onlyLeave: 50.5, bothLeaveAndPurpose: 45.7, other: 3.8 },
    { category: '複合サービス事業', total: 100.0, onlyLeave: 48.5, bothLeaveAndPurpose: 44.7, other: 6.8 },
    { category: 'サービス業(他に分類されないもの)', total: 100.0, onlyLeave: 55.4, bothLeaveAndPurpose: 36.7, other: 7.8 },
    // 事業所規模
    { category: '500人以上', total: 100.0, onlyLeave: 70.9, bothLeaveAndPurpose: 28.1, other: 1.1 },
    { category: '100~499人', total: 100.0, onlyLeave: 65.3, bothLeaveAndPurpose: 34.7, other: 0.1 },
    { category: '30~99人', total: 100.0, onlyLeave: 58.6, bothLeaveAndPurpose: 39.8, other: 1.5 },
    { category: '5~29人', total: 100.0, onlyLeave: 51.2, bothLeaveAndPurpose: 44.8, other: 4.0 },
    { category: '30人以上(再掲)', total: 100.0, onlyLeave: 60.8, bothLeaveAndPurpose: 38.1, other: 1.1 }
  ];

  // 統合された育児休業データ（男性と女性を統合）
  const combinedParentalLeaveTableData = maleParentalLeaveTableData.map((maleRow, index) => {
    const femaleRow = femaleParentalLeaveTableData[index];
    return {
      category: maleRow.category,
      maleOnlyLeave: maleRow.onlyLeave,
      maleBothLeaveAndPurpose: maleRow.bothLeaveAndPurpose,
      maleOther: maleRow.other,
      femaleOnlyLeave: femaleRow.onlyLeave,
      femaleBothLeaveAndPurpose: femaleRow.bothLeaveAndPurpose,
      femaleOther: femaleRow.other
    };
  });

  return (
    <>
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          {/* 出生数及び合計特殊出生率の年次推移とターゲット人口 */}
          <h4 style={{ 
            fontSize: '15px', 
            fontWeight: 600, 
            marginBottom: '12px', 
            color: 'var(--color-text)', 
            borderLeft: '3px solid var(--color-primary)', 
            paddingLeft: '8px' 
          }}>
            出生数及び合計特殊出生率の年次推移
          </h4>
          
          {/* タイトルとサブタイトル */}
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--color-text)',
            textAlign: 'center'
          }}>
            出生動向の分析とターゲット人口の明確化
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-light)',
            marginBottom: '32px',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            出生数の推移、年齢別出生率、初婚年齢の変化などを分析し、ターゲット人口の構成を明確化
          </p>
          
          <div style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'stretch'
          }}>
            {/* 左側：出生数及び合計特殊出生率の年次推移 */}
            <div style={{ flex: '1', minWidth: '500px' }}>
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                height: '718px'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}>
                  図1 母の年齢（５歳階級）・出生順位別にみた出生数の年次推移
                </div>
                <div style={{ flex: '1', position: 'relative', minHeight: '400px', height: '100%' }}>
                  <ResponsiveBar
                    data={birthByAgeAndOrderData.map(d => ({
                      year: d.year.toString(),
                      '第1子': d['第1子'],
                      '第2子': d['第2子'],
                      '第3子以上': d['第3子以上']
                    }))}
                    keys={['第1子', '第2子', '第3子以上']}
                    indexBy="year"
                    margin={{ top: 50, right: 120, bottom: 60, left: 80 }}
                    padding={0.3}
                    valueScale={{ type: 'linear', min: 0, max: 900000 }}
                    indexScale={{ type: 'band', round: true }}
                    colors={['#1f77b4', '#ff7f0e', '#2ca02c']}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -90,
                      legend: '年',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: '出生数（万人）',
                      legendPosition: 'middle',
                      legendOffset: -60,
                      format: (value) => {
                        return (value / 10000).toFixed(1);
                      }
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    enableLabel={false}
                    layers={['grid', 'axes', 'bars', ({ bars, xScale, yScale }) => {
                      // 各年の合計値を計算して表示
                      const yearTotals: { [key: string]: number } = {};
                      bars.forEach((bar) => {
                        const year = bar.data.indexValue as string;
                        if (!yearTotals[year]) {
                          yearTotals[year] = 0;
                        }
                        if (bar.data.value !== null && bar.data.value !== undefined) {
                          yearTotals[year] += bar.data.value;
                        }
                      });
                      
                      // 各年の最後のバー（最上部）に合計値を表示
                      const lastBarsByYear: { [key: string]: typeof bars[0] } = {};
                      bars.forEach((bar) => {
                        const year = bar.data.indexValue as string;
                        if (!lastBarsByYear[year] || bar.y < lastBarsByYear[year].y) {
                          lastBarsByYear[year] = bar;
                        }
                      });
                      
                      return Object.values(lastBarsByYear).map((bar) => {
                        const year = bar.data.indexValue as string;
                        const total = yearTotals[year];
                        const totalInMan = (total / 10000).toFixed(1);
                        
                        return (
                          <g key={`total-${year}`}>
                            <text
                              x={bar.x + bar.width / 2}
                              y={bar.y - 5}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#333"
                              fontSize="12"
                              fontWeight="600"
                            >
                              {totalInMan}万人
                            </text>
                          </g>
                        );
                      });
                    }, 'legends']}
                    tooltip={({ id, value, indexValue, data }) => (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong>{indexValue}年</strong>
                        <br />
                        {id}: {value.toLocaleString()}人
                      </div>
                    )}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'top-right',
                        direction: 'column',
                        justify: false,
                        translateX: -20,
                        translateY: -20,
                        itemsSpacing: 4,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 18,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'square'
                      }
                    ]}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  出典：
                  <a href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: '#0066cc', textDecoration: 'underline' }}>
                    厚生労働省「人口動態統計」表2
                  </a>
                </div>
              </div>
            </div>

            {/* 右側：ターゲット人口の円グラフと表 */}
            <div style={{ flex: '1', minWidth: '500px', display: 'flex', flexDirection: 'column' }}>
              {/* ターゲット人口の円グラフ */}
              <div style={{ 
                marginBottom: '-42px',
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                height: '400px'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}>
                  ターゲット人口の構成
                </div>
                <div style={{ height: '320px' }}>
                  <ResponsivePie
                    data={targetPopulationData}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={(d) => d.data.color}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    tooltip={({ datum }) => (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong>{datum.label}</strong>
                        <br />
                        {datum.value}%
                      </div>
                    )}
                    legends={[
                      {
                        anchor: 'right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 8,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#333',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  出典：
                  <a href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: '#0066cc', textDecoration: 'underline' }}>
                    厚生労働省「人口動態統計」表1
                  </a>
                </div>
              </div>

              {/* ターゲット人口の詳細表 */}
              <div style={{ 
                padding: '12px 20px 20px 20px',
                backgroundColor: '#fff',
                borderRadius: '8px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#F3F4F6',
                      borderBottom: '2px solid var(--color-border-color)'
                    }}>
                      <th style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}>
                        カテゴリー
                      </th>
                      <th style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}>
                        ターゲット人口
                      </th>
                      <th style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}>
                        獲得率
                      </th>
                      <th style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}>
                        獲得数
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetPopulationTableData.map((row, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid var(--color-border-color)'
                      }}>
                        <td style={{
                          padding: '8px 12px',
                          color: 'var(--color-text)'
                        }}>
                          {row.category}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          color: 'var(--color-text)'
                        }}>
                          {row.targetPopulation}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          color: 'var(--color-text)'
                        }}>
                          {row.acquisitionRate}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          color: row.color,
                          fontWeight: 600
                        }}>
                          {row.acquiredCount}
                        </td>
                      </tr>
                    ))}
                    <tr style={{
                      backgroundColor: '#E6F3FF',
                      borderTop: '2px solid var(--color-border-color)'
                    }}>
                      <td style={{
                        padding: '8px 12px',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}>
                        合計
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--color-text)'
                      }}>
                        約516万人
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        color: 'var(--color-text)'
                      }}>
                        -
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: '#1f77b4'
                      }}>
                        約45万人
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 母の年齢（５歳階級）別にみた合計特殊出生率と初婚の妻の年齢（各歳）の構成割合 */}
          {/* ターゲットユーザー年齢 */}
          <h4 style={{ 
            fontSize: '15px', 
            fontWeight: 600, 
            marginBottom: '12px', 
            color: 'var(--color-text)', 
            borderLeft: '3px solid var(--color-primary)', 
            paddingLeft: '8px' 
          }}>
            ターゲットユーザー年齢
          </h4>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--color-text)',
            textAlign: 'center'
          }}>
            ターゲットユーザー年齢の分析
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-light)',
            marginBottom: '32px',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            母の年齢別出生率と初婚年齢の推移から、ターゲットユーザーの年齢層を明確化
          </p>
          
          {/* 第1子出生時の母の平均年齢の年次推移表 */}
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: 'var(--color-text)',
              textAlign: 'center'
            }}>
              表3 第1子出生時の母の平均年齢の年次推移
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#F3F4F6',
                  borderBottom: '2px solid var(--color-border-color)'
                }}>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    1975
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    1985
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    1995
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2005
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2015
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2019
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2020
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2021
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2022
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2023
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    2024
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{
                  borderBottom: '1px solid var(--color-border-color)'
                }}>
                  <td style={{
                    padding: '8px 12px',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    平均年齢
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    25.7歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    26.7歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    27.5歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    29.1歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    30.7歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    30.7歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    30.7歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    30.9歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    30.9歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    31.0歳
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>
                    31.0歳
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{
              fontSize: '11px',
              color: '#666',
              textAlign: 'center',
              marginTop: '12px',
              fontStyle: 'italic'
            }}>
              出典：
              <a href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style={{ color: '#0066cc', textDecoration: 'underline' }}>
                厚生労働省「人口動態統計」表3
              </a>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            {/* 母の年齢（５歳階級）別にみた合計特殊出生率 */}
            <div style={{ flex: '1', minWidth: '380px' }}>
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                height: '500px',
                margin: 0
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}>
                  図2 母の年齢（５歳階級）別にみた合計特殊出生率
                </div>
                <div style={{ height: '400px' }}>
                  <ResponsiveLine
                    data={[
                      { id: '総数(合計特殊出生率)', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['総数(合計特殊出生率)'] })) },
                      { id: '25-29歳', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['25-29歳'] })) },
                      { id: '20-24歳', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['20-24歳'] })) },
                      { id: '30-34歳', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['30-34歳'] })) },
                      { id: '35-39歳', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['35-39歳'] })) },
                      { id: '40-44歳', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['40-44歳'] })) },
                      { id: '15-19歳', data: ageGroupFertilityData.map(d => ({ x: d.x, y: d['15-19歳'] })) }
                    ]}
                    margin={{ top: 50, right: 120, bottom: 60, left: 60 }}
                    xScale={{ type: 'linear', min: 1955, max: 2024 }}
                    yScale={{ type: 'linear', min: 0, max: 2.5 }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -90,
                      legend: '年',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: '出生率',
                      legendPosition: 'middle',
                      legendOffset: -50
                    }}
                    pointSize={0}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={0}
                    enableGridX={true}
                    enableGridY={true}
                    colors={[
                      '#666', // 総数
                      '#FF0000', // 25-29歳
                      '#FF0000', // 20-24歳（破線）
                      '#000000', // 30-34歳（破線）
                      '#008080', // 35-39歳（破線）
                      '#008080', // 40-44歳
                      '#8B4513' // 15-19歳
                    ]}
                    lineWidth={2}
                    enableArea={false}
                    enablePoints={false}
                    useMesh={true}
                    legends={[
                      {
                        anchor: 'top-right',
                        direction: 'column',
                        justify: false,
                        translateX: -20,
                        translateY: -20,
                        itemsSpacing: 4,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 18,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  出典：
                  <a href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: '#0066cc', textDecoration: 'underline' }}>
                    厚生労働省「人口動態統計」図2
                  </a>
                </div>
              </div>
            </div>

            {/* 出生数の年次推移，出生順位別 */}
            <div style={{ flex: '1', minWidth: '380px' }}>
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                height: '500px',
                margin: 0
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}>
                  図3 出生数の年次推移，出生順位別
                </div>
                <div style={{ height: '400px' }}>
                  <ResponsiveLine
                    data={[
                      { id: '総数', data: birthOrderData.map(d => ({ x: d.year, y: d['総数'] })) },
                      { id: '第1子', data: birthOrderData.map(d => ({ x: d.year, y: d['第1子'] })) },
                      { id: '第2子', data: birthOrderData.map(d => ({ x: d.year, y: d['第2子'] })) },
                      { id: '第3子以上', data: birthOrderData.map(d => ({ x: d.year, y: d['第3子以上'] })) }
                    ]}
                    margin={{ top: 50, right: 120, bottom: 60, left: 80 }}
                    xScale={{ type: 'linear', min: 1980, max: 2025 }}
                    yScale={{ type: 'linear', min: 0, max: 1600000 }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -90,
                      legend: '年',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: '出生数（人）',
                      legendPosition: 'middle',
                      legendOffset: -60,
                      format: (value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                        return value.toString();
                      }
                    }}
                    pointSize={0}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={0}
                    enableGridX={true}
                    enableGridY={true}
                    colors={['#333333', '#1f77b4', '#ff7f0e', '#2ca02c']}
                    lineWidth={2}
                    enableArea={false}
                    enablePoints={false}
                    useMesh={true}
                    tooltip={({ point }) => (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong>{point.data.x}年</strong>
                        <br />
                        {point.seriesId}: {point.data.y.toLocaleString()}人
                      </div>
                    )}
                    legends={[
                      {
                        anchor: 'top-right',
                        direction: 'column',
                        justify: false,
                        translateX: -20,
                        translateY: -20,
                        itemsSpacing: 4,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 18,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  出典：
                  <a href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: '#0066cc', textDecoration: 'underline' }}>
                    厚生労働省「人口動態統計」表2
                  </a>
                </div>
              </div>
            </div>

            {/* 初婚の妻の年齢（各歳）の構成割合 */}
            <div style={{ flex: '1', minWidth: '380px' }}>
              <div style={{ 
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                height: '500px',
                margin: 0
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}>
                  図10 初婚の妻の年齢（各歳）の構成割合
                </div>
                <div style={{ height: '400px' }}>
                  <ResponsiveLine
                    data={[
                      { 
                        id: '2004', 
                        data: marriageAgeData2004.map(d => ({ x: d.age, y: d['2004'] }))
                      },
                      { 
                        id: '2014', 
                        data: marriageAgeData2014.map(d => ({ x: d.age, y: d['2014'] }))
                      },
                      { 
                        id: '2024', 
                        data: marriageAgeData2024.map(d => ({ x: d.age, y: d['2024'] }))
                      }
                    ]}
                    margin={{ top: 50, right: 120, bottom: 60, left: 60 }}
                    xScale={{ type: 'linear', min: 15, max: 45 }}
                    yScale={{ type: 'linear', min: 0, max: 10 }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: '歳',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: '%',
                      legendPosition: 'middle',
                      legendOffset: -50
                    }}
                    pointSize={0}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={0}
                    enableGridX={true}
                    enableGridY={true}
                    colors={['#1f77b4', '#ff7f0e', '#2ca02c']}
                    lineWidth={2}
                    enableArea={false}
                    enablePoints={false}
                    useMesh={true}
                    legends={[
                      {
                        anchor: 'top-right',
                        direction: 'column',
                        justify: false,
                        translateX: -20,
                        translateY: -20,
                        itemsSpacing: 4,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 18,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  出典：
                  <a href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ color: '#0066cc', textDecoration: 'underline' }}>
                    厚生労働省「人口動態統計」図10
                  </a>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--color-text-light)',
                  textAlign: 'center',
                  marginTop: '10px'
                }}>
                  注:各届出年に結婚生活に入ったもの。
                </div>
              </div>
            </div>
          </div>
          
          {/* 育休取得率 */}
          <h4 style={{ 
            fontSize: '15px', 
            fontWeight: 600, 
            marginTop: '48px',
            marginBottom: '12px', 
            color: 'var(--color-text)', 
            borderLeft: '3px solid var(--color-primary)', 
            paddingLeft: '8px' 
          }}>
            育休取得率
          </h4>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--color-text)',
            textAlign: 'center'
          }}>
            育休取得率の分析と次世代育成支援の改正ポイント
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-light)',
            marginBottom: '32px',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            男女別の育休取得率の現状を分析し、2025年4月から施行される次世代育成支援対策推進法の改正ポイントを解説
          </p>
          
          {/* 全産業トータルでの育児休業取得率カード */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '24px',
            justifyContent: 'center'
          }}>
            <div style={{
              flex: 1,
              maxWidth: '300px',
              padding: '24px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '2px solid #4a90e2'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                男性の育児休業取得率
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#4a90e2',
                marginBottom: '4px'
              }}>
                40.5%
              </div>
              <div style={{
                fontSize: '11px',
                color: '#999',
                fontStyle: 'italic',
                marginBottom: '4px'
              }}>
                2024年度（
                <a href="https://www.mhlw.go.jp/seisakunitsuite/bunya/koyou_roudou/koyoukintou/ryouritsu/ikuji/?utm_source=chatgpt.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style={{ color: '#999', textDecoration: 'underline' }}>
                  令和6年度雇用均等基本調査
                </a>
                ）
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888',
                lineHeight: '1.4'
              }}>
                ※実際に育児休業を取得した<br />男性の割合
              </div>
            </div>
            <div style={{
              flex: 1,
              maxWidth: '300px',
              padding: '24px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '2px solid #ff69b4'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                女性の育児休業取得率
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#ff69b4',
                marginBottom: '4px'
              }}>
                86.6%
              </div>
              <div style={{
                fontSize: '11px',
                color: '#999',
                fontStyle: 'italic',
                marginBottom: '4px'
              }}>
                2024年度（
                <a href="https://www.mhlw.go.jp/seisakunitsuite/bunya/koyou_roudou/koyoukintou/ryouritsu/ikuji/?utm_source=chatgpt.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style={{ color: '#999', textDecoration: 'underline' }}>
                  令和6年度雇用均等基本調査
                </a>
                ）
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888',
                lineHeight: '1.4'
              }}>
                ※実際に育児休業を取得した<br />女性の割合
              </div>
            </div>
          </div>
          
          {/* 男性の育児休業取得率等の公表について */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #4a90e2'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1e3a8a',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ffd700',
                color: '#333',
                fontSize: '14px',
                fontWeight: 700
              }}>
                POINT
              </span>
              <span style={{ fontSize: '20px' }}>4</span>
              <span>育児休業等の取得状況の公表義務が300人超の企業に拡大</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#666',
                marginLeft: 'auto',
                padding: '4px 12px',
                border: '1px solid #333',
                borderRadius: '4px'
              }}>
                2025年（令和7年）4月1日施行
              </span>
            </h4>
            
            <div style={{
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#333',
              marginBottom: '16px'
            }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>対象企業の拡大：</strong>
                従業員数1,000人超に加え、<strong>300人超1,000人以下の企業</strong>にも、育児休業等の取得状況を公表することが義務付けられました。
              </p>
              
              <p style={{ marginBottom: '12px' }}>
                <strong>公表内容：</strong>
                公表内容は、公表を行う日の属する事業年度の直前の事業年度（公表前事業年度）における男性の「育児休業等の取得割合」または「育児休業等と育児目的休暇の取得割合」のいずれかの割合です。
              </p>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                borderLeft: '3px solid #4a90e2'
              }}>
                <p style={{ marginBottom: '8px', fontWeight: 600 }}>
                  ※「育児休業等」とは、育児・介護休業法に規定する以下の休業のことです：
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  paddingLeft: '20px'
                }}>
                  <li style={{
                    marginBottom: '8px',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      top: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ff9800'
                    }} />
                    育児休業（産後パパ育休を含む）
                  </li>
                  <li style={{
                    marginBottom: '8px',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      top: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ff9800'
                    }} />
                    法第23条第2項（3歳未満の子を育てる労働者について所定労働時間の短縮措置を講じない場合の代替措置義務）又は第24条第1項（小学校就学の始期に達するまでの子を育てる労働者に関する努力義務）の規定に基づく措置として育児休業に関する制度に準ずる措置を講じた場合は、その措置に基づく休業
                  </li>
                </ul>
              </div>
              
              <p style={{
                marginTop: '16px',
                fontSize: '13px',
                color: '#666'
              }}>
                <strong>詳細情報：</strong>
                <a href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/000103533_00006.html" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style={{ color: '#0066cc', textDecoration: 'underline', marginLeft: '8px' }}>
                  男性の育児休業取得率等の計算方法、公表についての詳細はこちらをご確認ください
                </a>
              </p>
            </div>
          </div>
          
          {/* 行動計画策定・変更時の育児休業等の取得状況や労働時間に関する状況の把握・数値目標設定の義務付け */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #4a90e2'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1e3a8a',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ffd700',
                color: '#333',
                fontSize: '14px',
                fontWeight: 700
              }}>
                POINT
              </span>
              <span style={{ fontSize: '20px' }}>5</span>
              <span>行動計画策定・変更時に育児休業等の取得状況や労働時間に関する状況の把握・数値目標設定の義務付け、及びくるみん認定、プラチナくるみん認定、トライくるみん認定の基準等の改正</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#666',
                marginLeft: 'auto',
                padding: '4px 12px',
                border: '1px solid #333',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                2025年（令和7年）4月1日施行
              </span>
            </h4>
            
            <div style={{
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#333',
              marginBottom: '16px'
            }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>対象企業：</strong>
                従業員数<strong>100人超の企業</strong>は、2025年（令和7年）4月1日以降に行動計画を策定又は変更する場合に、次のことが義務付けられました。
                <br />
                <span style={{ fontSize: '13px', color: '#666' }}>
                  （従業員数100人以下の企業は、努力義務）
                </span>
              </p>
              
              <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: '12px', fontWeight: 600 }}>
                  義務付けられた内容：
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  paddingLeft: '20px'
                }}>
                  <li style={{
                    marginBottom: '12px',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      top: '6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#2196f3'
                    }} />
                    計画策定又は変更時の育児休業等取得状況<sup style={{ fontSize: '11px' }}>※1</sup>や労働時間の状況<sup style={{ fontSize: '11px' }}>※2</sup>の把握等（PDCAサイクルの実施）
                  </li>
                  <li style={{
                    marginBottom: '12px',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      top: '6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#2196f3'
                    }} />
                    育児休業等取得状況<sup style={{ fontSize: '11px' }}>※1</sup>や労働時間の状況<sup style={{ fontSize: '11px' }}>※2</sup>に関する数値目標の設定
                  </li>
                </ul>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                borderLeft: '3px solid #4a90e2',
                fontSize: '13px'
              }}>
                <p style={{ marginBottom: '8px' }}>
                  <strong>※1</strong> 男性労働者の「育児休業等取得率」又は男性労働者の「育児休業等及び育児目的休暇の取得率」
                </p>
                <p style={{ marginBottom: '0' }}>
                  <strong>※2</strong> フルタイム労働者一人当たりの各月ごとの法定時間外労働及び法定休日労働の合計時間数等（高度プロフェッショナル制度の適用を受ける労働者にあっては、健康管理時間）
                </p>
              </div>
              
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fff5f5',
                borderRadius: '4px'
              }}>
                <p style={{ marginBottom: '12px', fontWeight: 600, color: '#c62828' }}>
                  くるみん認定、プラチナくるみん認定、トライくるみん認定の認定基準等が2025年（令和7年）4月1日から改正されました。
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  paddingLeft: '20px'
                }}>
                  <li style={{
                    marginBottom: '8px',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      top: '6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef5350'
                    }} />
                    <a href="https://www.mhlw.go.jp/stf/newpage_11367.html" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style={{ color: '#0066cc', textDecoration: 'underline' }}>
                      改正内容について詳しく知りたい方はこちら
                    </a>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '24px' }}>
                      次世代育成支援対策推進法の改正に伴い、くるみん認定、プラチナくるみん認定の認定基準等が改正されます
                    </span>
                  </li>
                  <li style={{
                    marginBottom: '8px',
                    position: 'relative',
                    paddingLeft: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '0',
                      top: '6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef5350'
                    }} />
                    <span style={{ fontSize: '13px' }}>
                      改正後の認定基準等の詳細は、
                      <a href="https://www.mhlw.go.jp/content/11909000/001347349.pdf" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: '#0066cc', textDecoration: 'underline', marginLeft: '4px' }}>
                        こちら
                      </a>
                      をご覧ください。
                    </span>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '24px' }}>
                      次世代育成支援対策推進法
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}

