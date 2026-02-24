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
    CATEGOGY_CREATE: '/admin/categories/new',
    CATEGORY_MODIFY: '/admin/categories/edit/:facilityCode',

    FACILITY: '/admin/facilities/list/:houseNo',
    FACILITY_DETAIL: '/admin/facilities/detail/:facilityNo',
    FACILITY_MODIFY: '/admin/facilities/edit/:facilityNo',

    RESERVATION: '/admin/reservation/list/:houseNo',
    RESERVATION_DETAIL: '/admin/reservation/detail/:reservationNo',
    RESERVATION_MODIFY: '/admin/reservation/edit/:reservationNo',
  },
  LESSOR: {
    FACILITY: '/lessor/facilities/list/:houseNo',
    FACILITY_DETAIL: '/lessor/facilities/detail/:facilityNo',
    FACILITY_CREATE: '/lessor/facilities/new/:houseNo',
    FACILITY_MODIFY: '/lessor/facilities/edit/:facilityNo',

    RESERVATION: '/lessor/reservation/list/:houseNo/:facilityNo',
    RESERVATION_DETAIL: '/lessor/reservation/detail/:reservationNo',
  },
  USER: {
    FACILITY: '/user/facilities/list',
    FACILITY_DETAIL: '/user/facilities/detail/:facilityNo',
    
    RESERVATION: '/user/reservation/list',
    RESERVATION_DETAIL: '/user/reservation/detail/:reservationNo',
    RESERVATION_CREATE: '/user/reservation/new/:facilityNo',
    RESERVATION_MODIFY: '/user/reservation/edit/:reservationNo'
  }
};
