import { Link, NavLink } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

export default function Navbar() {
	const { user, signOut } = useAuth();
	const [menuOpen, setMenuOpen] = useState(false);
	return (
		<header className="sticky top-0 z-40 mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 shadow">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-white">
				<h1 className="text-base font-semibold tracking-wide">
					Sistema Universitario
				</h1>

				{/* Botón hamburguesa (solo en mobile) */}
				<button
					className="block sm:hidden rounded-md p-2 hover:bg-white/10 focus:outline-none"
					onClick={() => setMenuOpen(!menuOpen)}
				>
					{/* Ícono de menú simple */}
					<svg
						className="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						{menuOpen ? (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						) : (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						)}
					</svg>
				</button>

				{/* Menú principal */}
				<nav
					className={`${
						menuOpen ? "flex" : "hidden"
					} absolute left-0 top-full w-full flex-col bg-indigo-700 sm:static sm:flex sm:w-auto sm:flex-row sm:items-center sm:bg-transparent md:gap-1.5`}
				>
					{user?.role === "admin" && (
						<NavLink
							to="/students"
							className={({ isActive }) =>
								`px-4 py-2 font-medium hover:bg-white/10 sm:rounded-md sm:px-3 sm:py-2 ${
									isActive ? "bg-white/20" : ""
								}`
							}
							onClick={() => setMenuOpen(false)}
						>
							Estudiantes
						</NavLink>
					)}
					{user !== null && (
						<NavLink
							to="/courses"
							className={({ isActive }) =>
								`px-4 py-2 font-medium hover:bg-white/10 sm:rounded-md sm:px-3 sm:py-2 ${
									isActive ? "bg-white/20" : ""
								}`
							}
							onClick={() => setMenuOpen(false)}
						>
							Cursos
						</NavLink>
					)}
					{user?.role === "admin" && (
						<NavLink
							to="/professors"
							className={({ isActive }) =>
								`px-4 py-2 font-medium hover:bg-white/10 sm:rounded-md sm:px-3 sm:py-2 ${
									isActive ? "bg-white/20" : ""
								}`
							}
							onClick={() => setMenuOpen(false)}
						>
							Profesores
						</NavLink>
					)}
					<div className="mx-3 hidden h-5 w-px bg-white/30 sm:block" />
					{user ? (
						<div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
							<span className="px-4 py-2 text-white/90 sm:hidden">
								{user.full_name} ({user.role})
							</span>
							<button
								className="rounded-md bg-white/15 px-3 py-2 font-medium text-white hover:bg-white/25"
								onClick={() => {
									signOut();
									setMenuOpen(false);
								}}
							>
								Salir
							</button>
						</div>
					) : (
						<Link
							className="rounded-md bg-white/15 px-3 py-2 font-medium text-white hover:bg-white/25"
							to="/login"
							onClick={() => setMenuOpen(false)}
						>
							Login
						</Link>
					)}
				</nav>
			</div>
		</header>
	);
}
