import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44, getErrorMessage } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/shared/DataTable';
import { Shield, User, Store, Car, Package, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const entityIcons = {
  merchant: Store,
  driver: Car,
  rider: User,
  order: Package,
  ticket: AlertTriangle,
  zone: Shield,
  settings: Shield,
};

const riskColors = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

export default function AuditLogs() {
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500),
  });

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      await base44.entities.AuditLog.clear();
      await queryClient.invalidateQueries(['audit-logs']);
      toast.success('Audit logs cleared successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsClearing(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch = 
      l.action?.toLowerCase().includes(searchValue.toLowerCase()) ||
      l.performed_by?.toLowerCase().includes(searchValue.toLowerCase()) ||
      l.details?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesRisk = riskFilter === 'all' || l.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const columns = [
    {
      header: 'Action',
      cell: (row) => {
        const Icon = entityIcons[row.entity_type] || Shield;
        return (
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              row.risk_level === 'high' ? 'bg-rose-100' : 
              row.risk_level === 'medium' ? 'bg-amber-100' : 'bg-slate-100'
            }`}>
              <Icon className={`w-4 h-4 ${
                row.risk_level === 'high' ? 'text-rose-600' : 
                row.risk_level === 'medium' ? 'text-amber-600' : 'text-slate-600'
              }`} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{row.action}</p>
              <p className="text-sm text-slate-500 capitalize">{row.entity_type}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Details',
      cell: (row) => (
        <p className="text-sm text-slate-600 max-w-md truncate">{row.details || '-'}</p>
      ),
    },
    {
      header: 'Performed By',
      cell: (row) => (
        <span className="text-sm text-slate-700">{row.performed_by || 'System'}</span>
      ),
    },
    {
      header: 'Risk Level',
      cell: (row) => (
        <Badge className={riskColors[row.risk_level] || riskColors.low}>
          {row.risk_level || 'low'}
        </Badge>
      ),
    },
    {
      header: 'IP Address',
      cell: (row) => (
        <span className="text-sm text-slate-500 font-mono">{row.ip_address || '-'}</span>
      ),
    },
    {
      header: 'Timestamp',
      cell: (row) => (
        <span className="text-sm text-slate-500">
          {format(new Date(row.created_date), 'MMM d, yyyy h:mm:ss a')}
        </span>
      ),
    },
  ];

  const filterOptions = [
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-slate-500">Track platform activities and detect fraud</p>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleClearLogs}
          disabled={isClearing || logs.length === 0}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {isClearing ? 'Clearing...' : 'Clear Logs'}
        </Button>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-50 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{logs.filter(l => l.risk_level === 'low' || !l.risk_level).length}</p>
              <p className="text-sm text-slate-600">Low Risk</p>
            </div>
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600">{logs.filter(l => l.risk_level === 'medium').length}</p>
              <p className="text-sm text-slate-600">Medium Risk</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </Card>
        <Card className="p-4 bg-rose-50 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-rose-600">{logs.filter(l => l.risk_level === 'high').length}</p>
              <p className="text-sm text-slate-600">High Risk</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border-0 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredLogs}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search logs..."
          filterValue={riskFilter}
          onFilterChange={setRiskFilter}
          filterOptions={filterOptions}
          filterPlaceholder="Filter by risk"
          emptyMessage="No audit logs found"
        />
      </Card>
    </div>
  );
}