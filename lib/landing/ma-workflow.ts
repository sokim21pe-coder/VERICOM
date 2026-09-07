/**
 * VERICOM 기본 표준 M&A 거래진행흐름 (Source of Truth).
 *
 * 순서는 사용자가 확정한 표준 절차이며, 임의로 변경/추가/삭제하지 않는다.
 * 메인페이지와 서비스소개 페이지가 동일한 이 데이터를 사용한다.
 */

export type MaWorkflowStep = {
  label: string;
  desc: string;
};

export const MA_WORKFLOW_TITLE = "M&A 거래진행흐름";
export const MA_WORKFLOW_LEAD =
  "매각 측과 인수 측의 기본적인 M&A 거래진행흐름입니다.";

export const MA_WORKFLOW_DISCLAIMER =
  "위 거래진행흐름은 VERICOM이 사용하는 기본적인 표준 절차입니다. 실제 M&A 거래에서는 거래구조, 협상 방식, 경쟁매각 여부, 당사자 간 합의 및 거래 특성에 따라 일부 단계가 생략되거나 순서가 조정될 수 있습니다.";

export const SELLER_WORKFLOW: MaWorkflowStep[] = [
  {
    label: "초기 상담 및 기업 파악",
    desc: "매각 목표와 회사 현황을 확인하는 첫 단계",
  },
  {
    label: "티저 작성·배포",
    desc: "회사명을 노출하지 않고 핵심 투자포인트를 제공하는 초기 안내자료",
  },
  {
    label: "비밀유지계약 체결",
    desc: "상세정보 제공 전 기밀유지 의무를 정하는 단계",
  },
  {
    label: "재무자료 정리",
    desc: "매각 검토에 필요한 재무정보를 정리·정규화",
  },
  {
    label: "자문계약",
    desc: "M&A Advisor를 공식 선임해 업무범위·보수·기간·역할을 정하는 계약",
  },
  {
    label: "기업가치 평가",
    desc: "승인된 비교배수를 기준으로 예비 기업가치 범위를 산정",
  },
  {
    label: "기업소개자료(IM/CIM) 제공",
    desc: "NDA 이후 상세 사업·재무·거래정보를 제공",
  },
  {
    label: "경영진 미팅",
    desc: "매각·인수 경영진이 직접 확인하고 질의하는 단계",
  },
  {
    label: "인수의향서(IOI) / 인수제안서(LOI)",
    desc: "가격·구조 등 인수 의향을 문서로 제시",
  },
  {
    label: "실사",
    desc: "재무·법률·세무·상업 관점에서 회사를 검증",
  },
  {
    label: "주식매매계약 협상·체결",
    desc: "최종 조건을 협상해 주식매매계약(SPA)을 체결",
  },
  {
    label: "거래종결",
    desc: "대금 지급과 이전으로 거래를 마무리",
  },
  {
    label: "인수 후 통합",
    desc: "거래종결 이후 조직·운영을 통합(PMI)",
  },
];

export const BUYER_WORKFLOW: MaWorkflowStep[] = [
  {
    label: "인수조건 설정",
    desc: "산업·규모·수익성·지역 등 인수기준을 설정",
  },
  {
    label: "인수후보 검토",
    desc: "기준에 맞는 인수 대상을 검토",
  },
  {
    label: "인수전략 수립",
    desc: "인수 목적과 접근 전략을 정리",
  },
  {
    label: "비밀유지계약 체결",
    desc: "정보 열람을 위한 기밀유지 의무를 정하는 단계",
  },
  {
    label: "매각기업 소개 및 티저 제공",
    desc: "매각 대상의 티저·초기 정보를 제공받는 단계",
  },
  {
    label: "자문계약",
    desc: "Buy-side Advisor를 공식 선임해 업무범위·보수·기간·역할을 정하는 계약",
  },
  {
    label: "기업소개자료(IM/CIM) 검토",
    desc: "제공받은 상세 사업·재무·거래정보를 분석",
  },
  {
    label: "경영진 미팅",
    desc: "대상 회사 경영진과 직접 확인하는 단계",
  },
  {
    label: "인수의향서(IOI) / 인수제안서(LOI)",
    desc: "가격·구조 등 인수 의향을 제시",
  },
  {
    label: "실사",
    desc: "대상 회사를 재무·법률·세무·상업 관점에서 검증",
  },
  {
    label: "주식매매계약 협상·체결",
    desc: "최종 조건을 협상해 주식매매계약(SPA)을 체결",
  },
  {
    label: "거래종결",
    desc: "대금 지급과 이전으로 거래를 마무리",
  },
  {
    label: "인수 후 통합",
    desc: "거래종결 이후 조직·운영을 통합(PMI)",
  },
];
