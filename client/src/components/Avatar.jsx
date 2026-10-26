import { displayName, hueFor } from '../lib/format.js';

export default function Avatar({ user, size = 40 }) {
  const name = displayName(user);
  if (user?.image) {
    return <img src={user.image} alt="" width={size} height={size} className="avatar" style={{ '--size': `${size}px` }} />;
  }
  return (
    <span className="avatar" style={{ '--size': `${size}px`, '--h': hueFor(user?.username || name) }} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}
