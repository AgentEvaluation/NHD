import { useState, useEffect } from 'react';
import { TestRun } from '@/types/runs';

export function useTestRuns() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    const res = await fetch('/api/tools/test-runs');
    const savedRuns = await res.json();
    setRuns(savedRuns);    
  };

  const addRun = async (newRun: TestRun) => {
    await fetch('/api/tools/test-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRun)
    });
    setRuns(prev => [newRun, ...prev]);    
  };

  const updateRun = async (updatedRun: TestRun) => {
    setRuns(prev => {
      const index = prev.findIndex(run => run.id === updatedRun.id);
      const newRuns = [...prev];
      
      if (index === -1) {
        return [updatedRun, ...newRuns];
      } else {
        newRuns[index] = updatedRun;
        return newRuns;
      }
    });
  
    // Also update selectedRun if it's the same one
    if (selectedRun?.id === updatedRun.id) {
      setSelectedRun(updatedRun);
    }
  
    fetch('/api/tools/test-runs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRun)
    }).catch(err => console.error("Failed to save run:", err));
  };

  return {
    runs,
    selectedRun,
    setSelectedRun,
    addRun,
    updateRun
  };
}