import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Power } from 'lucide-react';
import { toast } from 'sonner';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AvailabilityManager({ driver, onUpdate }) {
  const [status, setStatus] = useState(driver?.status || 'offline');
  const [schedule, setSchedule] = useState(
    driver?.working_schedule || daysOfWeek.reduce((acc, day) => ({
      ...acc,
      [day]: { enabled: true, start: '08:00', end: '18:00' }
    }), {})
  );
  const [acceptingOrders, setAcceptingOrders] = useState(driver?.accepting_orders ?? true);

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate({ status: newStatus });
      setStatus(newStatus);
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleScheduleUpdate = async () => {
    try {
      await onUpdate({ working_schedule: schedule });
      toast.success('Schedule updated successfully');
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const toggleDayEnabled = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateDayTime = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const toggleAcceptingOrders = async (value) => {
    try {
      await onUpdate({ accepting_orders: value });
      setAcceptingOrders(value);
      toast.success(value ? 'Now accepting orders' : 'Stopped accepting orders');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-amber-500';
      case 'offline': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} animate-pulse`} />
              <div>
                <p className="font-semibold text-lg capitalize">{status}</p>
                <p className="text-sm text-slate-500">Your current availability status</p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">{status}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => handleStatusChange('online')}
              variant={status === 'online' ? 'default' : 'outline'}
              className={status === 'online' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Online
            </Button>
            <Button
              onClick={() => handleStatusChange('busy')}
              variant={status === 'busy' ? 'default' : 'outline'}
              className={status === 'busy' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              Busy
            </Button>
            <Button
              onClick={() => handleStatusChange('offline')}
              variant={status === 'offline' ? 'default' : 'outline'}
              className={status === 'offline' ? 'bg-slate-600 hover:bg-slate-700' : ''}
            >
              Offline
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="accepting-orders" className="font-medium">Accept New Orders</Label>
              <p className="text-xs text-slate-500">Allow system to assign new orders</p>
            </div>
            <Switch
              id="accepting-orders"
              checked={acceptingOrders}
              onCheckedChange={toggleAcceptingOrders}
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Working Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {daysOfWeek.map(day => (
            <div key={day} className="flex items-center gap-3 p-3 border rounded-lg">
              <Switch
                checked={schedule[day]?.enabled ?? true}
                onCheckedChange={() => toggleDayEnabled(day)}
              />
              <div className="flex-1">
                <Label className="font-medium">{day}</Label>
              </div>
              {schedule[day]?.enabled && (
                <div className="flex items-center gap-2">
                  <Select
                    value={schedule[day]?.start || '08:00'}
                    onValueChange={(v) => updateDayTime(day, 'start', v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-500">to</span>
                  <Select
                    value={schedule[day]?.end || '18:00'}
                    onValueChange={(v) => updateDayTime(day, 'end', v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
          <Button onClick={handleScheduleUpdate} className="w-full bg-violet-600 hover:bg-violet-700">
            <Clock className="w-4 h-4 mr-2" />
            Save Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}