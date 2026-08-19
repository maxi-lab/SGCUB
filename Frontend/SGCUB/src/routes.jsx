import Padron from './pages/Padron'
import Principal from './pages/Principal'

export const routes = [
  {
    path: '/',
    component: Principal,
    label: 'Inicio',
    showInNavigation: false,
  },
  {
    path: '/padron',
    component: Padron,
    label: 'Padrón',
    showInNavigation: true,
  },
]

export function getRoute(pathname) {
  return routes.find((route) => route.path === pathname) ?? routes[0]
}
