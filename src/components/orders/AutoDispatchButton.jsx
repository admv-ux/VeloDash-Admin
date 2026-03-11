import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { DispatchService } from './DispatchService';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoDispatchButton({ order, onSuccess }) {
  const [isDispatching, setIsDispatching] = useState(false);
  const queryClient = useQueryClient();

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: () => base44.entities.Zone.list(),
  });

  const handleAutoDispatch = async () => {
    setIsDispatching(true);
    try {
      const result = await DispatchService.assignDriverToOrder(order, drivers, zones);
      
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
        if (onSuccess) onSuccess(result.driver);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to dispatch order');
    } finally {
      setIsDispatching(false);
    }
  };

  const canDispatch = order.status === 'pending' && !order.driver_id;

  if (!canDispatch) return null;

  return (
    <Button
      onClick={handleAutoDispatch}
      disabled={isDispatching}
      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
    >
      {isDispatching ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Dispatching...
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 mr-2" />
          Auto-Assign Driver
        </>
      )}
    </Button>
  );
}