import '../App.css'
import { Link } from 'react-router-dom'

export default function AdminPage() {
	return (
		<section className="construction-page" style={{ textAlign: 'center' }}>
			<p className="eyebrow">Panel de gestión</p>
			<h1>En construcción</h1>
			<p className="intro">
				Estamos preparando las herramientas para administrar el club desde este espacio.
			</p>
			<Link className="home-button" to="/">
				Volver al inicio
			</Link>
		</section>
	)
}
