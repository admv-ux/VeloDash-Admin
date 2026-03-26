import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  User, 
  Car, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Info,
  ChevronRight,
  RotateCcw,
  Wallet,
  Building
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import { toast } from 'sonner';

const RideSimulator = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: Setup, 2: Active Simulation
  const [simulationRide, setSimulationRide] = useState(null);
  
  const [setup, setSetup] = useState({
    customerId: '',
    driverId: '',
    fare: 100,
    vehicleType: 'car'
  });

  // Fetch users and drivers for setup
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.Users.list(),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: () => base44.entities.Drivers.list(),
  });

  // Mutations
  const createRideMutation = useMutation({
    mutationFn: (data) => base44.entities.Simulate.createRide(data),
    onSuccess: (data) => {
      setSimulationRide(data);
      setStep(2);
      toast.success('Ride simulation initiated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to start simulation');
    }
  });

  const advanceMutation = useMutation({
    mutationFn: (rideId) => base44.entities.Simulate.advanceRide(rideId),
    onSuccess: (updatedRide) => {
      setSimulationRide(updatedRide);
      if (updatedRide.status === 'completed') {
        toast.success('Simulation completed successfully');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to advance status');
    }
  });

  const handleStart = () => {
    if (!setup.customerId || !setup.driverId) {
      toast.error('Please select both a customer and a driver');
      return;
    }
    createRideMutation.mutate(setup);
  };

  const handleReset = () => {
    setStep(1);
    setSimulationRide(null);
    setSetup({
      customerId: '',
      driverId: '',
      fare: 100,
      vehicleType: 'car'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'searching': return 'text-yellow-500 bg-yellow-50';
      case 'accepted': return 'text-blue-500 bg-blue-50';
      case 'paid': return 'text-green-600 bg-green-50';
      case 'driver_enroute': return 'text-purple-500 bg-purple-50';
      case 'arrived': return 'text-orange-500 bg-orange-50';
      case 'ongoing': return 'text-emerald-500 bg-emerald-50';
      case 'completed': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const statusMap = [
    { key: 'searching', label: 'Requested', icon: Clock },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
    { key: 'paid', label: 'Paid', icon: Wallet },
    { key: 'driver_enroute', label: 'En-route', icon: Navigation },
    { key: 'arrived', label: 'Arrived', icon: Building },
    { key: 'ongoing', label: 'Ongoing', icon: Car },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Play className="w-6 h-6 text-indigo-600" />
          Ride Lifecycle Simulator
        </h1>
        <p className="text-gray-500">Test the professional calculation model by simulating a full ride flow.</p>
      </div>

      {step === 1 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-400" />
            Simulation Setup
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <select 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={setup.customerId}
                onChange={(e) => setSetup({...setup, customerId: e.target.value})}
              >
                <option value="">Select a test customer</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.email} ({u.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
              <select 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={setup.driverId}
                onChange={(e) => setSetup({...setup, driverId: e.target.value})}
              >
                <option value="">Select a test driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ride Fare (GH₵)</label>
              <input 
                type="number"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={setup.fare}
                onChange={(e) => setSetup({...setup, fare: Number(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <select 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={setup.vehicleType}
                onChange={(e) => setSetup({...setup, vehicleType: e.target.value})}
              >
                <option value="car">Standard (Car)</option>
                <option value="suv">Premium (SUV)</option>
                <option value="bike">Delivery (Bike)</option>
                <option value="truck">Truck</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={createRideMutation.isPending}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createRideMutation.isPending ? 'Initiating...' : (
              <>
                <Play className="w-5 h-5" />
                Start Simulation
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px]">
              {statusMap.map((status, index) => {
                const isActive = simulationRide?.status === status.key;
                const isCompleted = statusMap.findIndex(s => s.key === simulationRide?.status) > index;
                const Icon = status.icon;
                
                return (
                  <React.Fragment key={status.key}>
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 
                        isCompleted ? 'border-green-500 bg-green-50 text-green-500' : 
                        'border-gray-200 bg-white text-gray-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                        {status.label}
                      </span>
                    </div>
                    {index < statusMap.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Active Status & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Current Ride Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Ride Number</span>
                  <span className="font-mono font-medium">#{simulationRide?.id?.split('-')[0].toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(simulationRide?.status)}`}>
                    {simulationRide?.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-600">Fare</span>
                  <span className="font-bold text-gray-900">GH₵ {simulationRide?.finalFare}</span>
                </div>
              </div>

              {simulationRide?.status !== 'completed' && (
                <button
                  onClick={() => advanceMutation.mutate(simulationRide.id)}
                  disabled={advanceMutation.isPending}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {advanceMutation.isPending ? 'Processing...' : (
                    <>
                      Advance to {statusMap[statusMap.findIndex(s => s.key === simulationRide?.status) + 1]?.label}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>

            {simulationRide?.status === 'completed' ? (
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-4">Financial Verdict</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-md">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-gray-600 font-medium">Company Commission</span>
                    </div>
                    <span className="font-bold text-lg text-emerald-700">GH₵ {simulationRide?.commission}</span>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-md">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-gray-600 font-medium">Driver Payout</span>
                    </div>
                    <span className="font-bold text-lg text-indigo-700">GH₵ {simulationRide?.driverPayout}</span>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-white text-gray-700 border border-gray-200 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      New Simulation
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Financial calculations pending</h3>
                <p className="text-sm text-gray-500">Complete the ride lifecycle to see the commission and payout breakdown.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RideSimulator;
