import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page page--narrow">
      <p className="eyebrow">404</p>
      <h1>This route is off the map.</h1>
      <p className="lead">The page you asked for is not part of VELOOP Games.</p>
      <Link className="btn btn--primary" to="/games">
        Return to Games
      </Link>
    </div>
  );
}
