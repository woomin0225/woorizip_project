export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
  },

  MEMBER: {
    MYPAGE: '/mypage',
  },

  ADMIN: {
    MEMBERS: '/admin/members',

    CATEGORY: '/admin/categories',
    CATEGORY_FORM: '/admin/categories/:facilityCode'
  },
  
  USER: {
    FACILITY: '/facilities/list/:houseNo/:facilityNo',
    FACILITY_FORM: '/facilities/form/:facilityNo',
    
    RESERVATION: '/reservation/list/:houseNo',
    RESERVATION_FORM: '/reservation/new/:facilityNo/',
  }
};
