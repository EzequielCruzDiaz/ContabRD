import Card from "@/components/ui/Card";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
}

export default function KpiCard({ title, value, change }: KpiCardProps) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {change && <p className="mt-1 text-xs text-gray-400">{change}</p>}
    </Card>
  );
}
