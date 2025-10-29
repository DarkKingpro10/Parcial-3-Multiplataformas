import { EnrollmentDAO } from '../dao/EnrollmentDAO'

export const EnrollmentController = {
  listByCourse: EnrollmentDAO.listByCourse,
  listByStudent: EnrollmentDAO.listByStudent,
  find: EnrollmentDAO.find,
  enroll: EnrollmentDAO.enroll,
  unenroll: EnrollmentDAO.unenroll,
}
