import { NavLink, Link, Outlet } from "react-router";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

export default function App() {
	const { user, signOut } = useAuth();
	return (
		<div className="min-h-screen bg-neutral-50 text-neutral-800 dark:bg-gray-900 dark:text-white">
			<header className="sticky top-0 z-40 mb-6 bg-linear-to-r from-indigo-600 to-blue-600 shadow">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-white">
					<h1 className="text-base font-semibold tracking-wide">
						Sistema Universitario
					</h1>
					<nav className="flex items-center gap-1 text-sm">
							{user?.role === "admin" && (
								<NavLink
									to="/students"
									className={({ isActive }) =>
										`rounded-md px-3 py-2 font-medium hover:bg-white/10 ${
											isActive ? "bg-white/20" : ""
										}`
									}
								>
									Estudiantes
								</NavLink>
							)}
						<NavLink
							to="/courses"
							className={({ isActive }) =>
								`rounded-md px-3 py-2 font-medium hover:bg-white/10 ${
									isActive ? "bg-white/20" : ""
								}`
							}
						>
							Cursos
						</NavLink>
						{user?.role === "admin" && (
							<NavLink
								to="/professors"
								className={({ isActive }) =>
									`rounded-md px-3 py-2 font-medium hover:bg-white/10 ${
										isActive ? "bg-white/20" : ""
									}`
								}
							>
								Profesores
							</NavLink>
						)}
						<div className="mx-3 h-5 w-px bg-white/30" />
						{user ? (
							<div className="flex items-center gap-2">
								<span className="hidden text-white/90 sm:inline">
									{user.full_name} ({user.role})
								</span>
								<button
									className="rounded-md bg-white/15 px-3 py-2 font-medium text-white hover:bg-white/25"
									onClick={signOut}
								>
									Salir
								</button>
							</div>
						) : (
							<Link
								className="rounded-md bg-white/15 px-3 py-2 font-medium text-white hover:bg-white/25"
								to="/login"
							>
								Login
							</Link>
						)}
					</nav>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 pb-10 dark:bg-gray-900 dark:text-white">
				<Outlet />
			</main>
		</div>
	);
}
