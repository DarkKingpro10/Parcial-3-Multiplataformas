import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

import type { Enrollment } from '../models/Enrollment'
import type { CourseCountRow } from '../dao/ReportDAO'

export function exportStudentEnrollmentsPDF(enrollments: Enrollment[], studentName: string) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(`Reporte de cursos de ${studentName}`, 14, 16)

  const rows = enrollments.map((e) => [
    e.course?.name ?? '-',
    e.student?.user?.full_name ?? '-',
    e.grades?.[0]?.value ?? '-',
  ])

  autoTable(doc, {
    head: [['Curso', 'Estudiante', 'Nota']],
    body: rows,
    startY: 22,
  })

  doc.save(`mis-cursos-${studentName}.pdf`)
}

export function exportStudentEnrollmentsExcel(enrollments: Enrollment[], studentName: string) {
  const data = enrollments.map((e) => ({
    Curso: e.course?.name ?? '-',
    Estudiante: e.student?.user?.full_name ?? '-',
    Nota: e.grades?.[0]?.value ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Mis cursos')
  XLSX.writeFile(wb, `mis-cursos-${studentName}.xlsx`)
}

export function exportCoursesCountPDF(rows: CourseCountRow[]) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Resumen de cursos (admin)', 14, 16)

  const body = rows.map((r) => [r.name, r.credits, r.professor_name ?? '-', r.professor_email ?? '-', r.students_count])
  autoTable(doc, {
    head: [['Curso', 'Créditos', 'Profesor', 'Email', 'Estudiantes']],
    body,
    startY: 22,
  })
  doc.save('cursos-resumen.pdf')
}

export function exportCoursesCountExcel(rows: CourseCountRow[]) {
  const data = rows.map((r) => ({
    Curso: r.name,
    Créditos: r.credits,
    Profesor: r.professor_name ?? '',
    Email: r.professor_email ?? '',
    Estudiantes: r.students_count,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
  XLSX.writeFile(wb, 'cursos-resumen.xlsx')
}
