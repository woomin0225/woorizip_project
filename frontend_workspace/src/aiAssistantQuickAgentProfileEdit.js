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
    label: '휴대번호',
    aliases: ['전화번호', '휴대폰', '핸드폰', '휴대번호', '연락처', '폰번호'],
    normalizeValue: (value) => String(value || '').replace(/\D/g, ''),
    validate: (value) =>
      /^01\d{8,9}$/.test(value)
        ? ''
        : '휴대번호는 숫자 10~11자리로 입력해 주세요. 예: 01012341234',
  },
  {
    key: 'address',
    label: '주소',
    aliases: ['주소', '집주소', '거주지'],
    normalizeValue: (value) => String(value || '').trim(),
    validate: (value) =>
      value.length >= 5
        ? ''
        : '주소는 다섯 글자 이상으로 입력해 주세요.',
  },
  {
    key: 'type',
    label: '회원유형',
    aliases: ['회원유형', '유형', '타입', '임대인', '임차인', '사용자유형'],
    normalizeValue: (value) => {
      const normalized = normalizeText(value);
      if (
        normalized.includes('임대인') ||
        normalized.includes('집주인') ||
        normalized === 'lessor' ||
        normalized === 'landlord'
      ) {
        return 'LESSOR';
      }
      if (
        normalized.includes('임차인') ||
        normalized.includes('사용자') ||
        normalized.includes('일반회원') ||
        normalized === 'user' ||
        normalized === 'tenant'
      ) {
        return 'USER';
      }
      return String(value || '').trim().toUpperCase();
    },
    validate: (value) =>
      value === 'USER' || value === 'LESSOR'
        ? ''
        : '회원유형은 사용자 또는 임대인으로 입력해 주세요.',
  },
];

export const PROFILE_UNSUPPORTED_FIELDS = [
  { label: '닉네임', aliases: ['닉네임', '별명', '닉'] },
  { label: '이메일', aliases: ['이메일', '메일', 'email'] },
  { label: '생년월일', aliases: ['생년월일', '생일', '출생일'] },
  { label: '성별', aliases: ['성별'] },
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
  '현재 챗봇으로 수정할 수 있는 항목은 이름, 휴대번호, 주소, 회원유형입니다.';

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
    displayValue:
      field?.key === 'type'
        ? value === 'LESSOR'
          ? '임대인'
          : value === 'USER'
            ? '사용자'
            : value
        : value,
    error,
  };
};
