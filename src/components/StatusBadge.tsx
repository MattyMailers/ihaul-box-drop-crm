const statusConfig: Record<string, { label: string; color: string }> = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-800' },
  kit_prepped: { label: 'Kit Prepped', color: 'bg-yellow-100 text-yellow-800' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  followed_up: { label: 'Followed Up', color: 'bg-indigo-100 text-indigo-800' },
  converted: { label: 'Converted', color: 'bg-orange-100 text-orange-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
