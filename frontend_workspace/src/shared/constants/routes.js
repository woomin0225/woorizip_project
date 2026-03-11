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
    CATEGORY: '/admin/category',
    CATEGORY_FORM: '/admin/category/form/:facilityCode?',
  },

  USER: {
    FACILITY_VIEW: '/facility/view/:houseNo?/:facilityNo?',
    FACILITY_FORM: '/facility/form/:houseNo/:facilityNo?',
    RESERVATION_VIEW: '/reservation/view/:facilityNo?/:reservationNo?',
    RESERVATION_FORM: '/reservation/form/:facilityNo/:reservationNo?'
  },
};
