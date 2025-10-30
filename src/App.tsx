import { Outlet } from "react-router";
import "./App.css";
import Navbar from "./components/Navbar";

export default function App() {
	return (
		<div className="min-h-screen bg-neutral-50 text-neutral-800 dark:bg-gray-900 dark:text-white">
			<Navbar />
			<main className="mx-auto max-w-6xl px-4 pb-10 dark:bg-gray-900 dark:text-white">
				<Outlet />
			</main>
		</div>
	);
}
