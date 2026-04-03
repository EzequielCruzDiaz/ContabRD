import Card from "@/components/ui/Card";

interface ActivityItem {
  id: string;
  description: string;
  time: string;
}

interface ActivityFeedProps {
  items?: ActivityItem[];
}

export default function ActivityFeed({ items = [] }: ActivityFeedProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Actividad reciente</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No hay actividad reciente</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <p className="text-sm text-gray-700">{item.description}</p>
              <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
