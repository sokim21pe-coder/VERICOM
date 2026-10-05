// Seller Teaser Foundation — 공용 타입.
// Teaser는 NDA 전 단계의 익명/제한정보 소개자료다. IM/CIM과 구분한다.
// 상태는 최소(DRAFT → IN_REVIEW → APPROVED)로 유지한다.

export type TeaserStatus = "DRAFT" | "IN_REVIEW" | "APPROVED";

export const TEASER_STATUSES: TeaserStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED"];

/** 각 정보 조각의 확인 상태. MASTER_SPEC InformationState와 정렬. 창작 금지. */
export type TeaserDataState = "CONFIRMED" | "ESTIMATED" | "UNKNOWN";

export type TeaserSectionId =
  | "overview"
  | "business"
  | "highlights"
  | "financial"
  | "transaction";

/** Draft 생성에 사용한 구조화 사실 1건. value가 null이면 아직 확인되지 않은 것이다. */
export type TeaserDataPoint = {
  id: string;
  label: string;
  value: string | null;
  state: TeaserDataState;
};

export type TeaserSectionContent = {
  id: TeaserSectionId;
  title: string;
  /** 사용자가 수정 가능한 본문. 생성기는 확인된 사실만으로 seed 한다. */
  body: string;
  dataPoints: TeaserDataPoint[];
};

export type TeaserContent = {
  /** 익명 표현 헤드라인. 회사명을 노출하지 않는다(식별정보 공개 승인 전). */
  headline: string;
  identityMasked: boolean;
  /** 마스킹된 회사 설명(예: "국내 산업용 배터리팩 전문기업"). */
  maskedDescriptor: string;
  sections: TeaserSectionContent[];
  /** 확인이 필요한(UNKNOWN) 정보 라벨 목록. 사용자 안내용. */
  missing: string[];
};

/** DB에 저장된 Teaser 1건(현재 버전 기준 뷰). */
export type TeaserRecord = {
  id: string;
  companyId: string;
  dealId: string | null;
  status: TeaserStatus;
  currentVersion: number;
  approvedVersion: number | null;
  approvedAt: string | null;
  content: TeaserContent;
  identityMasked: boolean;
  maskedDescriptor: string | null;
  updatedAt: string | null;
};
