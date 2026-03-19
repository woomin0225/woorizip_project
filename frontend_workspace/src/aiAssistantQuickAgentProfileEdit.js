import { normalizeText } from './aiAssistantQuickAgentActions';

export const PROFILE_EDITABLE_FIELDS = [
  {
    key: 'name',
    label: '이름',
    aliases: ['이름', '성함', '이름값'],
    normalizeValue: (value) => String(value || '').trim(),
    validate: (value) =>
      value.length >= 2
        ? ''
        : '이름은 두 글자 이상으로 입력해 주세요.',
  },
  {
    key: 'phone',
    label: '전화번호',
    aliases: ['전화번호', '휴대폰', '핸드폰', '휴대번호', '연락처', '폰번호'],
    normalizeValue: (value) => String(value || '').replace(/\D/g, ''),
    validate: (value) =>
      /^01\d{8,9}$/.test(value)
        ? ''
        : '전화번호는 숫자 10~11자리로 입력해 주세요. 예: 01012341234',
  },
  {
    key: 'birthDate',
    label: '생년월일',
    aliases: ['생년월일', '생일', '출생일'],
    normalizeValue: (value) => {
      const source = String(value || '').trim();
      const match = source.match(/(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/);
      if (!match) return source;
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    validate: (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? ''
        : '생년월일은 1999-01-31 형식으로 입력해 주세요.',
  },
  {
    key: 'gender',
    label: '성별',
    aliases: ['성별'],
    normalizeValue: (value) => {
      const normalized = normalizeText(value);
      if (
        normalized.includes('남') ||
        normalized.includes('남성') ||
        normalized === 'm' ||
        normalized === 'male'
      ) {
        return 'M';
      }
      if (
        normalized.includes('여') ||
        normalized.includes('여성') ||
        normalized === 'f' ||
        normalized === 'female'
      ) {
        return 'F';
      }
      return String(value || '').trim().toUpperCase();
    },
    validate: (value) =>
      value === 'M' || value === 'F'
        ? ''
        : '성별은 남성 또는 여성으로 입력해 주세요.',
  },
];

export const PROFILE_UNSUPPORTED_FIELDS = [
  { label: '닉네임', aliases: ['닉네임', '별명', '닉'] },
  { label: '주소', aliases: ['주소', '집주소', '거주지'] },
  { label: '이메일', aliases: ['이메일', '메일', 'email'] },
  { label: '회원유형', aliases: ['회원유형', '유형', '타입', '임대인', '사용자유형'] },
];

const VALUE_SEPARATORS = ['으로', '로', '바꿔', '변경', '수정', '해줘', '해주세요'];

const findFieldByText = (messageText) => {
  const normalized = normalizeText(messageText);

  const unsupported = PROFILE_UNSUPPORTED_FIELDS.find((field) =>
    field.aliases.some((alias) => normalized.includes(normalizeText(alias)))
  );
  if (unsupported) {
    return { kind: 'unsupported', field: unsupported };
  }

  const supported = PROFILE_EDITABLE_FIELDS.find((field) =>
    field.aliases.some((alias) => normalized.includes(normalizeText(alias)))
  );
  if (supported) {
    return { kind: 'supported', field: supported };
  }

  return { kind: 'unknown', field: null };
};

const stripLeadingFieldLabel = (messageText, field) => {
  let value = String(messageText || '').trim();
  field.aliases.forEach((alias) => {
    value = value.replace(new RegExp(`^${alias}\\s*`, 'i'), '').trim();
  });
  value = value.replace(/^(을|를|은|는|이|가)\s*/, '').trim();
  return value;
};

const stripTrailingCommand = (messageText) => {
  let value = String(messageText || '').trim();
  VALUE_SEPARATORS.forEach((token) => {
    value = value.replace(new RegExp(`${token}.*$`), '').trim();
  });
  return value;
};

export const getProfileEditSupportMessage = () =>
  '현재 챗봇으로 수정할 수 있는 항목은 이름, 전화번호, 생년월일, 성별입니다.';

export const isProfileEditPage = (pathname) => pathname === '/mypage/edit';

export const parseProfileEditRequest = (messageText) => {
  const text = String(messageText || '').trim();
  if (!text) return { kind: 'empty' };

  const match = findFieldByText(text);
  if (match.kind === 'unsupported') {
    return {
      kind: 'unsupported',
      fieldLabel: match.field.label,
    };
  }

  if (match.kind !== 'supported') {
    return { kind: 'unknown' };
  }

  let value = stripLeadingFieldLabel(text, match.field);
  value = stripTrailingCommand(value);

  if (!value) {
    return {
      kind: 'fieldOnly',
      field: match.field,
    };
  }

  return {
    kind: 'fieldWithValue',
    field: match.field,
    rawValue: value,
  };
};

export const normalizeProfileEditValue = (field, rawValue) => {
  const value = field?.normalizeValue ? field.normalizeValue(rawValue) : String(rawValue || '').trim();
  const error = field?.validate ? field.validate(value) : '';

  return {
    value,
    displayValue: field?.key === 'gender' ? (value === 'M' ? '남성' : value === 'F' ? '여성' : value) : value,
    error,
  };
};
