export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
  },

  MEMBER: {
    MYPAGE: '/mypage',
    MY_INFO: '/mypage/info',
    MY_INFO_EDIT: '/mypage/edit',
    MY_WITHDRAW: '/mypage/withdraw',
  },

  WISHLIST: {
    LIST: '/wishlist',
  },

  TOUR: {
    APPLY: '/tour/apply',
    LIST: '/tour/list',
  },

  CONTRACT: {
    APPLY: '/contract/apply',
    LIST: '/contract/list',
    COMPLETION: '/contract/completion',
  },

  ADMIN: {
    MEMBERS: '/admin/members',
    CATEGORY: '/admin/categories',
    CATEGORY_FORM: '/admin/categories/:facilityCode',
  },

  USER: {
    FACILITY: '/facilities/list/:houseNo/:facilityNo',
    FACILITY_FORM: '/facilities/form/:facilityNo',
    RESERVATION: '/reservation/list/:houseNo',
    RESERVATION_FORM: '/reservation/new/:facilityNo/',
  },
};
